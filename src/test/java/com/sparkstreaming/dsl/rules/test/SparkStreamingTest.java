package com.sparkstreaming.dsl.rules.test;

import com.sparkstreaming.dsl.rules.Main;
import com.sparkstreaming.dsl.rules.executor.StreamingExecutor;
import com.sparkstreaming.dsl.rules.manager.RuleManager;
import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.sparkstreaming.dsl.rules.model.SeriesKey;
import com.sparkstreaming.dsl.rules.parser.DslRule;
import com.sparkstreaming.dsl.rules.parser.RuleLoader;
import com.sparkstreaming.dsl.rules.plan.*;
import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.broadcast.Broadcast;
import org.apache.spark.streaming.Duration;
import org.apache.spark.streaming.api.java.*;
import org.apache.spark.streaming.dstream.DStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import scala.Tuple2;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.Socket;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Integration test for DSL Rules Engine.
 * Tests the complete flow: socket input → enrich → aggregate → console output
 */
public class SparkStreamingTest {
    private static final Logger LOG = LoggerFactory.getLogger(SparkStreamingTest.class);
    private static final String TEST_RULE_ID = "cpu_avg_service_group_a";
    
    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.err.println("Usage: SparkStreamingTest <rules-file>");
            System.exit(1);
        }
        
        String rulesFile = args[0];
        
        LOG.info("Starting SparkStreamingTest");
        LOG.info("Rules file: {}", rulesFile);
        
        // 1. Initialize Spark
        SparkConf conf = new SparkConf()
            .setAppName("DSL-Rules-Test")
            .setMaster("local[*]")
            .set("spark.streaming.stopGracefullyOnShutdown", "true");
        
        JavaStreamingContext jssc = new JavaStreamingContext(conf, Duration.apply(4000));
        jssc.checkpoint("/tmp/spark/checkpoint/dsl-rules-test");
        
        // 2. Create dimension table (simulated - maps IP to service_group)
        Map<String, String> dimensionTable = new HashMap<>();
        dimensionTable.put("192.168.1.1", "service_group_a");
        dimensionTable.put("192.168.1.2", "service_group_a");
        dimensionTable.put("192.168.1.3", "service_group_a");
        Broadcast<Map<String, String>> broadcastTable = jssc.sparkContext().broadcast(dimensionTable);
        LOG.info("Broadcast dimension table with {} entries", dimensionTable.size());
        
        // 3. Create socket input stream (reads from port 9999)
        JavaReceiverInputDStream<String> socketStream = jssc.receiverStream(
            new SocketTextStreamReceiver("localhost", 9999)
        );
        
        // 4. Parse JSON metrics from socket
        JavaDStream<MetricEvent> metricStream = socketStream.flatMap(line -> {
            try {
                // Each line is a JSON array of MetricEvent objects
                ObjectMapper mapper = new ObjectMapper();
                MetricEvent[] events = mapper.readValue(line, MetricEvent[].class);
                return Arrays.asList(events);
            } catch (Exception e) {
                LOG.error("Failed to parse metric line: {}", line, e);
                return Collections.emptyList();
            }
        });
        
        // 5. Load and setup test rule
        DslRule testRule = createTestRule();
        LogicalPlan plan = new DslPlanBuilder().build(testRule);
        LOG.info("Built logical plan for rule: {}", testRule.getRuleId());
        
        // 6. Execute rule
        StreamingExecutor executor = new StreamingExecutor(metricStream, broadcastTable, new HashMap<>());
        JavaPairDStream<SeriesKey, Double> resultStream = plan.accept(executor);
        
        // 7. Collect and validate results
        final AtomicLong totalEvents = new AtomicLong(0);
        final Map<String, List<Double>> resultsByGroup = new ConcurrentHashMap<>();
        
        resultStream.foreachRDD((rdd, time) -> {
            if (!rdd.isEmpty()) {
                long count = rdd.count();
                totalEvents.addAndGet(count);
                
                LOG.info("===============================================");
                LOG.info("Batch time: {}", new java.util.Date(time.milliseconds()));
                LOG.info("Result count: {}", count);
                LOG.info("Total events processed: {}", totalEvents.get());
                
                // Collect results
                List<Tuple2<SeriesKey, Double>> results = rdd.collect();
                for (Tuple2<SeriesKey, Double> result : results) {
                    String serviceGroup = result._1.getLabels().get("service_group");
                    if (serviceGroup != null) {
                        resultsByGroup.computeIfAbsent(serviceGroup, k -> new ArrayList<>()).add(result._2);
                        LOG.info("  Service Group: {}, Avg CPU: {}%", serviceGroup, String.format("%.2f", result._2));
                    } else {
                        LOG.info("  Result: key={}, value={}", result._1, result._2);
                    }
                }
                LOG.info("===============================================");
                
                // Validation logic
                validateResults(resultsByGroup);
            }
        });
        
        // 8. Start Spark Streaming
        LOG.info("Starting Spark Streaming context");
        jssc.start();
        
        // Wait for termination
        LOG.info("Spark Streaming started. Waiting for termination...");
        jssc.awaitTermination();
        
        LOG.info("Test completed");
    }
    
    private static DslRule createTestRule() {
        DslRule rule = new DslRule();
        rule.setRuleId(TEST_RULE_ID);
        rule.setDescription("Test: CPU average by service group for service_group A");
        rule.setEnabled(true);
        
        // Source: cpu_usage from prod env
        SourceConfig source = new SourceConfig("cpu_usage");
        source.setMatchLabels(Collections.singletonMap("env", "prod"));
        rule.setSource(source);
        
        // Pipeline: enrich -> groupby -> avg
        List<DslOp> pipeline = new ArrayList<>();
        
        // Enrich: add service_group from IP
        DslOp enrichOp = new DslOp();
        enrichOp.setOperation("enrich");
        enrichOp.setType("dimension");
        enrichOp.setOn("labels.ip");
        enrichOp.setAdd("service_group");
        pipeline.add(enrichOp);
        
        // Group by service_group
        DslOp groupbyOp = new DslOp();
        groupbyOp.setOperation("groupby");
        groupbyOp.setLabels(Arrays.asList("service_group"));
        groupbyOp.setMode("keep_others");
        pipeline.add(groupbyOp);
        
        // Average over 5 minutes
        DslOp avgOp = new DslOp();
        avgOp.setOperation("avg");
        avgOp.setWindow("5m");
        pipeline.add(avgOp);
        
        rule.setPipeline(pipeline);
        return rule;
    }
    
    private static void validateResults(Map<String, List<Double>> resultsByGroup) {
        if (resultsByGroup.isEmpty()) {
            LOG.warn("No results to validate");
            return;
        }
        
        // Check that we have service_group_a
        if (!resultsByGroup.containsKey("service_group_a")) {
            LOG.error("Validation FAILED: Expected service_group_a not found in results");
            return;
        }
        
        List<Double> serviceGroupAValues = resultsByGroup.get("service_group_a");
        if (serviceGroupAValues.isEmpty()) {
            LOG.error("Validation FAILED: service_group_a has no values");
            return;
        }
        
        // Check that values are in reasonable range (0-100% for CPU)
        for (Double value : serviceGroupAValues) {
            if (value < 0 || value > 100) {
                LOG.error("Validation FAILED: CPU value {} out of range [0, 100]", value);
                return;
            }
        }
        
        // Log success
        double avg = serviceGroupAValues.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        LOG.info("Validation PASSED: service_group_a has {} results, average: {}%", 
            serviceGroupAValues.size(), String.format("%.2f", avg));
    }
    
    private static class ObjectMapper extends com.fasterxml.jackson.databind.ObjectMapper {
    }
    
    public static class SocketTextStreamReceiver extends org.apache.spark.streaming.receiver.Receiver<String> {
        private static final long serialVersionUID = 1L;
        private final String host;
        private final int port;
        
        public SocketTextStreamReceiver(String host, int port) {
            super(StorageLevel.MEMORY_AND_DISK_2());
            this.host = host;
            this.port = port;
        }
        
        @Override
        public void onStart() {
            new Thread(this::receive).start();
        }
        
        @Override
        public void onStop() {
            // No clean way to stop the thread, will be killed by Spark
        }
        
        private void receive() {
            try (Socket socket = new Socket(host, port)) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                String line;
                while (!isStopped() && (line = reader.readLine()) != null) {
                    store(line);
                }
            } catch (Exception e) {
                restart("Error receiving data from socket", e);
            }
        }
    }
}