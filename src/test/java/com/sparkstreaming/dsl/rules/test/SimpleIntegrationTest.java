package com.sparkstreaming.dsl.rules.test;

import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.sparkstreaming.dsl.rules.parser.*;
import com.sparkstreaming.dsl.rules.plan.*;
import com.sparkstreaming.dsl.rules.executor.StreamingExecutor;
import org.apache.spark.SparkConf;
import org.apache.spark.broadcast.Broadcast;
import org.apache.spark.streaming.Duration;
import org.apache.spark.streaming.api.java.*;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import scala.Tuple2;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.Assert.*;

/**
 * Simple Integration Test for DSL Rules Engine.
 * Tests the complete flow from socket input to aggregated output.
 */
public class SimpleIntegrationTest {
    private static final int TEST_PORT = 9999;
    private static final String APP_NAME = "DSL-Rules-Integration-Test";
    private ServerSocket serverSocket;
    private ExecutorService executorService;
    private volatile boolean running = false;
    private final AtomicInteger metricsSent = new AtomicInteger(0);
    private final AtomicInteger metricsReceived = new AtomicInteger(0);
    private final Map<String, List<Double>> results = new ConcurrentHashMap<>();
    
    @Before
    public void setup() {
        executorService = Executors.newCachedThreadPool();
    }
    
    @After
    public void teardown() throws IOException {
        running = false;
        if (serverSocket != null && !serverSocket.isClosed()) {
            serverSocket.close();
        }
        executorService.shutdown();
    }
    
    @Test(timeout = 180000) // 3 minute timeout
    public void testCompleteFlow() throws Exception {
        // 1. Create test rule
        DslRule rule = createTestRule();
        rule.validate();
        assertEquals("cpu_avg_service_group", rule.getRuleId());
        
        // 2. Build logical plan
        DslPlanBuilder builder = new DslPlanBuilder();
        LogicalPlan plan = builder.build(rule);
        plan.validate();
        
        // 3. Start socket server (simulates metric source)
        assertTrue("Should start socket server", startSocketServer());
        
        // 4. Initialize Spark Streaming
        SparkConf conf = new SparkConf()
            .setAppName(APP_NAME)
            .setMaster("local[*]")
            .set("spark.streaming.clock", "org.apache.spark.streaming.util.ManualClock");
        
        JavaStreamingContext jssc = new JavaStreamingContext(conf, Duration.apply(1000));
        jssc.checkpoint("/tmp/spark/checkpoint/integration-test");
        
        // 5. Create dimension table
        Map<String, String> dimensionTable = new HashMap<>();
        dimensionTable.put("192.168.1.1", "service_group_a");
        dimensionTable.put("192.168.1.2", "service_group_a");
        dimensionTable.put("192.168.1.3", "service_group_a");
        Broadcast<Map<String, String>> broadcastTable = jssc.sparkContext().broadcast(dimensionTable);
        
        // 6. Create socket input stream
        JavaReceiverInputDStream<String> socketStream = jssc.receiverStream(
            new CustomSocketReceiver("localhost", TEST_PORT)
        );
        
        // 7. Parse metrics
        JavaDStream<MetricEvent> metricStream = socketStream.flatMap(line -> {
            try {
                SimpleMetric[] metrics = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(line, SimpleMetric[].class);
                List<MetricEvent> events = new ArrayList<>();
                for (SimpleMetric metric : metrics) {
                    events.add(metric.toMetricEvent());
                }
                return events;
            } catch (Exception e) {
                return Collections.emptyList();
            }
        });
        
        // 8. Execute rule
        StreamingExecutor executor = new StreamingExecutor(metricStream, broadcastTable, new HashMap<>());
        JavaPairDStream<scala.Tuple2<String, String>, Double> resultStream = plan.accept(executor);
        
        // 9. Collect results
        CountDownLatch resultLatch = new CountDownLatch(3); // Wait for 3 result batches
        
        resultStream.foreachRDD((rdd, time) -> {
            if (!rdd.isEmpty()) {
                rdd.collect().forEach(tuple -> {
                    String serviceGroup = tuple._1._2;
                    Double avg = tuple._2;
                    results.computeIfAbsent(serviceGroup, k -> new ArrayList<>()).add(avg);
                    metricsReceived.incrementAndGet();
                });
                resultLatch.countDown();
            }
        });
        
        // 10. Start streaming
        jssc.start();
        
        // 11. Send test data
        sendTestData();
        
        // 12. Wait for results
        assertTrue("Should receive results", resultLatch.await(60, TimeUnit.SECONDS));
        
        // 13. Validate
        validateResults();
        
        // 14. Cleanup
        jssc.stop(false);
    }
    
    private boolean startSocketServer() throws IOException {
        serverSocket = new ServerSocket(TEST_PORT);
        running = true;
        
        executorService.submit(() -> {
            while (running) {
                try (Socket client = serverSocket.accept()) {
                    handleClient(client);
                } catch (IOException e) {
                    if (running) {
                        e.printStackTrace();
                    }
                }
            }
        });
        
        return true;
    }
    
    private void handleClient(Socket client) throws IOException {
        OutputStream out = client.getOutputStream();
        long endTime = System.currentTimeMillis() + 30000; // Run for 30 seconds
        Random random = new Random();
        
        while (System.currentTimeMillis() < endTime) {
            // Generate 3 metrics (one per machine)
            List<SimpleMetric> metrics = Arrays.asList(
                new SimpleMetric("cpu_usage", "192.168.1.1", "host-01", 20 + random.nextDouble() * 60),
                new SimpleMetric("cpu_usage", "192.168.1.2", "host-02", 20 + random.nextDouble() * 60),
                new SimpleMetric("cpu_usage", "192.168.1.3", "host-03", 20 + random.nextDouble() * 60)
            );
            
            String json = objectMapper.writeValueAsString(metrics);
            out.write(json.getBytes());
            out.write('\n');
            out.flush();
            
            metricsSent.addAndGet(metrics.size());
            
            try {
                Thread.sleep(1000); // Send every second
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
    
    private void sendTestData() throws InterruptedException {
        // Wait a bit for everything to start
        Thread.sleep(2000);
        LOG.info("Sending test data...");
    }
    
    private void validateResults() {
        LOG.info("========== Validating Results ==========");
        LOG.info("Metrics sent: {}", metricsSent.get());
        LOG.info("Metrics received/processed: {}", metricsReceived.get());
        LOG.info("Result groups: {}", results.keySet());
        
        // Should have service_group_a
        assertTrue("Should have service_group_a results", results.containsKey("service_group_a"));
        
        List<Double> serviceGroupA = results.get("service_group_a");
        assertFalse("Should have values in service_group_a", serviceGroupA.isEmpty());
        
        // Values should be in reasonable range
        for (Double value : serviceGroupA) {
            assertTrue("CPU should be 0-100%, got: " + value, value >= 0 && value <= 100);
        }
        
        double avg = serviceGroupA.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        LOG.info("Service Group A: {} results, average: {}%", serviceGroupA.size(), String.format("%.2f", avg));
        LOG.info("Service Group A values: {}", serviceGroupA);
        
        LOG.info("========== All Validations PASSED ==========");
    }
    
    private DslRule createTestRule() {
        DslRule rule = new DslRule();
        rule.setRuleId(TEST_RULE_ID);
        rule.setDescription("Test: CPU avg by service group");
        rule.setEnabled(true);
        
        // Source
        SourceConfig source = new SourceConfig("cpu_usage");
        source.setMatchLabels(Collections.singletonMap("env", "prod"));
        rule.setSource(source);
        
        // Pipeline
        List<DslOp> pipeline = new ArrayList<>();
        
        // Enrich
        DslOp enrich = new DslOp();
        enrich.setOperation("enrich");
        enrich.setType("dimension");
        enrich.setOn("labels.ip");
        enrich.setAdd("service_group");
        pipeline.add(enrich);
        
        // Group by
        DslOp groupby = new DslOp();
        groupby.setOperation("groupby");
        groupby.setLabels(Collections.singletonList("service_group"));
        groupby.setMode("keep_others");
        pipeline.add(groupby);
        
        // Average
        DslOp avg = new DslOp();
        avg.setOperation("avg");
        avg.setWindow("5m");
        pipeline.add(avg);
        
        rule.setPipeline(pipeline);
        return rule;
    }
    
    // Simple metric class for serialization
    static class SimpleMetric {
        public String metric;
        public String ip;
        public String host;
        public double value;
        public long timestamp;
        
        public SimpleMetric() {}
        
        public SimpleMetric(String metric, String ip, String host, double value) {
            this.metric = metric;
            this.ip = ip;
            this.host = host;
            this.value = value;
            this.timestamp = System.currentTimeMillis();
        }
        
        public MetricEvent toMetricEvent() {
            Map<String, String> labels = new HashMap<>();
            labels.put("ip", ip);
            labels.put("host", host);
            labels.put("env", "prod");
            
            return new MetricEvent(timestamp, metric, labels, value);
        }
    }
    
    // Custom socket receiver
    static class CustomSocketReceiver extends org.apache.spark.streaming.receiver.Receiver<String> {
        private final String host;
        private final int port;
        
        public CustomSocketReceiver(String host, int port) {
            super(org.apache.spark.storage.StorageLevel.MEMORY_AND_DISK_2());
            this.host = host;
            this.port = port;
        }
        
        @Override
        public void onStart() {
            new Thread(this::receive).start();
        }
        
        @Override
        public void onStop() {
            // Thread will be killed by Spark
        }
        
        private void receive() {
            try (Socket socket = new Socket(host, port)) {
                java.io.BufferedReader reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(socket.getInputStream())
                );
                String line;
                while (!isStopped() && (line = reader.readLine()) != null) {
                    store(line);
                }
            } catch (Exception e) {
                restart("Error receiving data", e);
            }
        }
    }
}