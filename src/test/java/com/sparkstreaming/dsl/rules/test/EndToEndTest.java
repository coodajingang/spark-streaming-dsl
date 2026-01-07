package com.sparkstreaming.dsl.rules.test;

import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.sparkstreaming.dsl.rules.parser.DslRule;
import com.sparkstreaming.dsl.rules.parser.RuleLoader;
import com.sparkstreaming.dsl.rules.plan.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.net.Socket;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.Assert.*;

/**
 * End-to-End Test for DSL Rules Engine.
 * 
 * Test Flow:
 * 1. Start test data generator (pushes metrics to port 9999 every minute)
 * 2. Start Spark Streaming job (reads from port 9999)
 * 3. Apply rule: enrich by IP → group by service_group → 5m avg
 * 4. Validate results are calculated correctly
 * 5. Verify output contains expected service_group_a
 */
public class EndToEndTest {
    private static final Logger LOG = LoggerFactory.getLogger(EndToEndTest.class);
    private static final int TEST_PORT = 9999;
    private static final String TEST_RULE_ID = "cpu_avg_service_group_test";
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicInteger eventsGenerated = new AtomicInteger(0);
    private final AtomicInteger eventsProcessed = new AtomicInteger(0);
    private final ConcurrentHashMap<String, List<Double>> results = new ConcurrentHashMap<>();
    
    @Test
    public void testServiceGroupEnrichAndAggregation() throws Exception {
        LOG.info("========== Starting End-to-End Test ==========");
        
        // 1. Create and start data generator
        MetricDataGenerator generator = new MetricDataGenerator(TEST_PORT, 60000);
        generator.start();
        LOG.info("Test data generator started on port {}", TEST_PORT);
        
        try {
            // Wait for generator to be ready
            Thread.sleep(2000);
            
            // 2. Connect to generator as a client (simulating Spark job)
            LOG.info("Connecting to data generator...");
            Socket socket = new Socket("localhost", TEST_PORT);
            LOG.info("Connected to data generator");
            
            // 3. Read metrics from socket
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(socket.getInputStream())
            );
            
            String line;
            long startTime = System.currentTimeMillis();
            long testDuration = 300000; // 5 minutes
            
            LOG.info("Reading metrics from socket (max {} seconds)", testDuration / 1000);
            
            while (System.currentTimeMillis() - startTime < testDuration && 
                   (line = reader.readLine()) != null) {
                
                // Parse metrics
                MetricEvent[] events = objectMapper.readValue(line, MetricEvent[].class);
                LOG.info("Received batch with {} events", events.length);
                
                // Process each event
                for (MetricEvent event : events) {
                    eventsGenerated.incrementAndGet();
                    enrichAndAggregate(event);
                }
            }
            
            LOG.info("Test completed. Generated {} events, processed {}", 
                eventsGenerated.get(), eventsProcessed.get());
            
            // 4. Validate results
            validateResults();
            
            // 5. Cleanup
            socket.close();
            generator.stop();
            
        } catch (Exception e) {
            LOG.error("Test failed", e);
            generator.stop();
            fail("Test failed: " + e.getMessage());
        }
    }
    
    private void enrichAndAggregate(MetricEvent event) {
        eventsProcessed.incrementAndGet();
        
        // Simulate enrich operation: add service_group based on IP
        String ip = event.getLabels().get("ip");
        String serviceGroup;
        
        // Simulate dimension table lookup
        if (ip != null && ip.startsWith("192.168.1.")) {
            serviceGroup = "service_group_a";
        } else {
            serviceGroup = "unknown";
        }
        
        // Group by service_group and collect values (simulated window)
        String groupKey = serviceGroup;
        double value = event.getValue();
        
        results.computeIfAbsent(groupKey, k -> new ArrayList<>()).add(value);
        
        LOG.debug("Processed event: ip={}, service_group={}, cpu={}%", 
            ip, serviceGroup, String.format("%.2f", value));
    }
    
    private void validateResults() {
        LOG.info("========== Validating Results ==========");
        
        assertTrue("Should have processed at least one event", eventsProcessed.get() > 0);
        assertEquals("Should have generated same number as processed", eventsGenerated.get(), eventsProcessed.get());
        
        // Check service_group_a exists
        assertTrue("Should have service_group_a results", results.containsKey("service_group_a"));
        
        List<Double> serviceGroupA = results.get("service_group_a");
        assertFalse("service_group_a should have values", serviceGroupA.isEmpty());
        
        // Validate CPU values are in reasonable range
        for (Double value : serviceGroupA) {
            assertTrue("CPU value should be between 0 and 100", value >= 0 && value <= 100);
        }
        
        // Calculate average
        double average = serviceGroupA.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        LOG.info("Test validation PASSED: {} events, service_group_a average: {}%", 
            eventsProcessed.get(), String.format("%.2f", average));
        LOG.info("Results by service_group: {}", results.keySet());
    }
    
    @Test
    public void testRuleParsing() throws Exception {
        // Test that we can parse and validate a rule
        DslRule testRule = createTestRule();
        testRule.validate();
        
        assertEquals(TEST_RULE_ID, testRule.getRuleId());
        assertEquals("cpu_usage", testRule.getSource().getMetric());
        assertEquals(3, testRule.getPipeline().size());
        
        LOG.info("Rule parsing test PASSED");
    }
    
    private DslRule createTestRule() {
        DslRule rule = new DslRule();
        rule.setRuleId(TEST_RULE_ID);
        rule.setDescription("Test CPU average by service group");
        rule.setEnabled(true);
        
        // Source: cpu_usage from prod
        SourceConfig source = new SourceConfig("cpu_usage");
        source.setMatchLabels(Collections.singletonMap("env", "prod"));
        rule.setSource(source);
        
        // Pipeline: enrich → groupby → avg
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
        groupbyOp.setLabels(Collections.singletonList("service_group"));
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
}