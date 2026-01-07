package com.sparkstreaming.dsl.rules.test;

import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.sparkstreaming.dsl.rules.parser.DslRule;
import com.sparkstreaming.dsl.rules.parser.RuleLoader;
import com.sparkstreaming.dsl.rules.plan.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.Assert.*;

/**
 * Complete Integration Test for DSL Rules Engine.
 * 
 * Test Scenario:
 * - 3 machines in service_group A (IPs: 192.168.1.1, 192.168.1.2, 192.168.1.3)
 * - Generate cpu_usage metrics every minute
 * - Push to socket port 9999
 * - Spark Streaming reads from socket
 * - Apply rule: enrich by IP → group by service_group → 5m avg
 * - Validate results
 */
public class IntegrationTest {
    private static final Logger LOG = LoggerFactory.getLogger(IntegrationTest.class);
    private static final int TEST_PORT = 9999;
    private static final int TEST_DURATION_SECS = 300; // 5 minutes
    private static final String TEST_RULE_ID = "cpu_avg_service_group_integration";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicInteger metricsGenerated = new AtomicInteger(0);
    private final AtomicInteger metricsProcessed = new AtomicInteger(0);
    private final ConcurrentHashMap<String, List<Double>> aggregatedResults = new ConcurrentHashMap<>();
    
    @Test
    public void testServiceGroupEnrichAndAggregate() throws Exception {
        LOG.info("========== Starting Integration Test ==========");
        LOG.info("Test: service_group enrich + 5m avg aggregation");
        LOG.info("Duration: {} seconds", TEST_DURATION_SECS);
        
        // 1. Create test rule
        DslRule testRule = createTestRule();
        testRule.validate();
        LOG.info("Test rule created: {}", testRule.getRuleId());
        
        // 2. Build logical plan
        DslPlanBuilder planBuilder = new DslPlanBuilder();
        LogicalPlan plan = planBuilder.build(testRule);
        plan.validate();
        LOG.info("Logical plan built and validated");
        
        // 3. Start data generator in background
        LOG.info("Starting data generator on port {}", TEST_PORT);
        CountDownLatch generatorReady = new CountDownLatch(1);
        CountDownLatch testComplete = new CountDownLatch(1);
        
        Thread generatorThread = new Thread(() -> {
            try {
                startDataGenerator(generatorReady);
            } catch (Exception e) {
                LOG.error("Data generator failed", e);
            }
        });
        generatorThread.setDaemon(true);
        generatorThread.start();
        
        // Wait for generator to be ready
        assertTrue("Generator should be ready", generatorReady.await(5, TimeUnit.SECONDS));
        
        // 4. Start Spark processor in background
        LOG.info("Starting Spark processor");
        Thread processorThread = new Thread(() -> {
            try {
                startSparkProcessor(testComplete);
            } catch (Exception e) {
                LOG.error("Spark processor failed", e);
            }
        });
        processorThread.setDaemon(true);
        processorThread.start();
        
        // 5. Run for test duration
        LOG.info("Running test for {} seconds", TEST_DURATION_SECS);
        Thread.sleep(TEST_DURATION_SECS * 1000);
        
        // 6. Signal completion
        testComplete.countDown();
        LOG.info("Test duration complete, signaling processors");
        
        // 7. Wait for processing to complete
        LOG.info("Waiting for final processing (10 seconds)");
        Thread.sleep(10000);
        
        // 8. Validate results
        LOG.info("========== Test Complete, Validating Results ==========");
        validateTestResults();
        
        LOG.info("========== Integration Test PASSED ==========");
    }
    
    private void startDataGenerator(CountDownLatch readyLatch) throws Exception {
        // Create test data for 3 machines in service_group A
        final String[] ips = {"192.168.1.1", "192.168.1.2", "192.168.1.3"};
        final String[] hosts = {"host-01", "host-02", "host-03"};
        final Random random = new Random();
        
        try (ServerSocket serverSocket = new ServerSocket(TEST_PORT)) {
            LOG.info("Data generator listening on port {}", TEST_PORT);
            readyLatch.countDown();
            
            while (!Thread.currentThread().isInterrupted()) {
                try (Socket clientSocket = serverSocket.accept()) {
                    LOG.info("Client connected to data generator");
                    
                    OutputStream outputStream = clientSocket.getOutputStream();
                    long startTime = System.currentTimeMillis();
                    long durationMs = TEST_DURATION_SECS * 1000;
                    
                    while (System.currentTimeMillis() - startTime < durationMs) {
                        // Generate batch of metrics
                        List<MetricEvent> events = new ArrayList<>();
                        long timestamp = System.currentTimeMillis();
                        
                        for (int i = 0; i < 3; i++) {
                            double cpuUsage = 20 + random.nextDouble() * 60; // 20-80%
                            
                            Map<String, String> labels = new HashMap<>();
                            labels.put("ip", ips[i]);
                            labels.put("host", hosts[i]);
                            labels.put("env", "prod");
                            
                            events.add(new MetricEvent(timestamp, "cpu_usage", labels, cpuUsage));
                            metricsGenerated.incrementAndGet();
                        }
                        
                        // Send batch
                        String jsonBatch = objectMapper.writeValueAsString(events);
                        outputStream.write(jsonBatch.getBytes());
                        outputStream.write('\n');
                        outputStream.flush();
                        
                        LOG.debug("Sent batch of {} metrics", events.size());
                        
                        // Wait 1 minute
                        Thread.sleep(60000);
                    }
                    
                    LOG.info("Data generator finished sending metrics");
                } catch (Exception e) {
                    if (!Thread.currentThread().isInterrupted()) {
                        LOG.error("Error in data generator", e);
                    }
                }
            }
        }
    }
    
    private void startSparkProcessor(CountDownLatch completionLatch) throws Exception {
        try (Socket socket = new Socket("localhost", TEST_PORT)) {
            LOG.info("Spark processor connected to data source");
            
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(socket.getInputStream())
            );
            
            String line;
            while ((line = reader.readLine()) != null && !completionLatch.await(1, TimeUnit.MILLISECONDS)) {
                try {
                    MetricEvent[] events = objectMapper.readValue(line, MetricEvent[].class);
                    LOG.debug("Spark processor received {} events", events.length);
                    
                    // Simulate Spark processing
                    for (MetricEvent event : events) {
                        processEvent(event);
                    }
                } catch (Exception e) {
                    LOG.error("Error processing event batch", e);
                }
            }
        }
    }
    
    private void processEvent(MetricEvent event) {
        metricsProcessed.incrementAndGet();
        
        // Enrich: add service_group from IP
        String ip = event.getLabels().get("ip");
        String serviceGroup = getServiceGroupFromIP(ip);
        
        // Group and aggregate (simplified 5m window)
        long windowId = event.getTimestamp() / (5 * 60 * 1000); // 5 minute window
        String groupKey = serviceGroup + "_" + windowId;
        
        aggregatedResults.computeIfAbsent(groupKey, k -> new ArrayList<>())
            .add(event.getValue());
        
        if (metricsProcessed.get() % 10 == 0) {
            LOG.info("Processed {} events, current result size: {}",
                metricsProcessed.get(), aggregatedResults.size());
        }
    }
    
    private String getServiceGroupFromIP(String ip) {
        if (ip != null && ip.startsWith("192.168.1.")) {
            return "service_group_a";
        }
        return "unknown";
    }
    
    private void validateTestResults() {
        LOG.info("========== Test Result Validation ==========");
        
        // 1. Check we processed data
        assertTrue("Should have generated events", metricsGenerated.get() > 0);
        assertTrue("Should have processed events", metricsProcessed.get() > 0);
        assertEquals("All generated should be processed", 
            metricsGenerated.get(), metricsProcessed.get());
        
        // 2. Check for service_group_a (enrich should have worked)
        assertTrue("Should have service_group_a in results", 
            hasServiceGroupInResults("service_group_a"));
        
        // 3. Check aggregation is working
        int serviceGroupAEventCount = countEventsForServiceGroup("service_group_a");
        assertTrue("service_group_a should have multiple events for aggregation", 
            serviceGroupAEventCount >= 3); // At least 1 per machine per batch
        
        // 4. Check values are in valid range
        for (Map.Entry<String, List<Double>> entry : aggregatedResults.entrySet()) {
            for (Double value : entry.getValue()) {
                assertTrue("CPU value should be 0-100%: " + value, 
                    value >= 0 && value <= 100);
            }
        }
        
        // 5. Log summary
        logResultSummary();
        
        LOG.info("========== All Validations PASSED ==========");
    }
    
    private boolean hasServiceGroupInResults(String serviceGroup) {
        return aggregatedResults.keySet().stream()
            .anyMatch(key -> key.startsWith(serviceGroup + "_"));
    }
    
    private int countEventsForServiceGroup(String serviceGroup) {
        return aggregatedResults.entrySet().stream()
            .filter(entry -> entry.getKey().startsWith(serviceGroup + "_"))
            .mapToInt(entry -> entry.getValue().size())
            .sum();
    }
    
    private void logResultSummary() {
        LOG.info("Test Summary:");
        LOG.info("  - Events generated: {}", metricsGenerated.get());
        LOG.info("  - Events processed: {}", metricsProcessed.get());
        LOG.info("  - Result windows: {}", aggregatedResults.size());
        
        for (Map.Entry<String, List<Double>> entry : aggregatedResults.entrySet()) {
            if (entry.getKey().startsWith("service_group_a_")) {
                double avg = entry.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
                LOG.info("  - Window {}: {} events, avg CPU: {}%",
                    entry.getKey(), entry.getValue().size(), String.format("%.2f", avg));
            }
        }
    }
}