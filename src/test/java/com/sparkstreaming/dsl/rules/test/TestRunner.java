package com.sparkstreaming.dsl.rules.test;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/**
 * Integration Test Runner for DSL Rules Engine.
 * 
 * This test validates the complete flow:
 * 1. Data Generator produces metrics for 3 machines in service_group A
 * 2. Metrics are sent to port 9999 every minute
 * 3. Spark Streaming job reads from port 9999
 * 4. Rule is applied: enrich by IP → group by service_group → 5m avg
 * 5. Results are validated for correctness
 * 
 * To run this test:
 * 1. Start MetricDataGenerator (pushes data to port 9999)
 * 2. Start SparkStreamingTest (reads from port 9999 and processes)
 * 3. Wait for 5+ minutes to collect enough data
 * 4. Verify results in console output
 */
public class TestRunner {
    private static final Logger LOG = LoggerFactory.getLogger(TestRunner.class);
    private static final int TEST_PORT = 9999;
    private static final String TEST_RULES_FILE = "config/test-rules.json";
    
    public static void main(String[] args) throws Exception {
        LOG.info("========== DSL Rules Engine Integration Test ==========");
        LOG.info("This test will run for approximately 6 minutes");
        LOG.info("Make sure port {} is available", TEST_PORT);
        
        // Create test rules file
        createTestRulesFile();
        
        // Start test in new thread to avoid blocking
        Thread testThread = new Thread(() -> {
            try {
                runIntegrationTest();
            } catch (Exception e) {
                LOG.error("Test failed", e);
                System.exit(1);
            }
        });
        testThread.start();
        
        // Wait for test completion or timeout
        CountDownLatch latch = new CountDownLatch(1);
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            LOG.info("Shutting down test...");
            latch.countDown();
        }));
        
        // Run for 6 minutes max
        boolean completed = latch.await(6, TimeUnit.MINUTES);
        if (!completed) {
            LOG.info("Test timeout reached (6 minutes)");
        }
        
        LOG.info("========== Test Run Complete ==========");
        System.exit(0);
    }
    
    private static void runIntegrationTest() throws Exception {
        // Step 1: Start data generator
        LOG.info("Step 1: Starting metric data generator...");
        MetricDataGenerator generator = new MetricDataGenerator(TEST_PORT, 60000);
        generator.start();
        
        // Wait a bit for generator to be ready
        Thread.sleep(2000);
        
        // Step 2: Start Spark job in background
        LOG.info("Step 2: Starting Spark Streaming test job...");
        Thread sparkThread = new Thread(() -> {
            try {
                String[] args = {TEST_RULES_FILE};
                SparkStreamingTest.main(args);
            } catch (Exception e) {
                LOG.error("Spark job failed", e);
            }
        });
        sparkThread.setDaemon(true);
        sparkThread.start();
        
        // Step 3: Run for 5 minutes to collect data
        LOG.info("Step 3: Collecting data for 5 minutes...");
        for (int i = 0; i < 5; i++) {
            LOG.info("Minutes elapsed: {}/5", i + 1);
            Thread.sleep(60000); // 1 minute
        }
        
        // Step 4: Stop generator and wait for processing
        LOG.info("Step 4: Stopping data generator...");
        generator.stop();
        
        LOG.info("Step 5: Waiting for final processing (30 seconds)...");
        Thread.sleep(30000);
        
        // Step 6: Run JUnit tests for validation
        LOG.info("Step 6: Running JUnit validation tests...");
        EndToEndTest test = new EndToEndTest();
        
        try {
            test.testRuleParsing();
            LOG.info("✓ Rule parsing test PASSED");
        } catch (Exception e) {
            LOG.error("✗ Rule parsing test FAILED", e);
        }
        
        try {
            test.testServiceGroupEnrichAndAggregation();
            LOG.info("✓ End-to-end test PASSED");
        } catch (Exception e) {
            LOG.error("✗ End-to-end test FAILED", e);
        }
        
        LOG.info("========== All Tests Complete ==========");
    }
    
    private static void createTestRulesFile() throws IOException {
        // Create a test rules file for the integration test
        String testRule = String.join("\n",
            "[",
            "  {",
            "    \"rule_id\": \"cpu_avg_service_group_test\",",
            "    \"description\": \"CPU average by service group for integration test\",",
            "    \"source\": {",
            "      \"metric\": \"cpu_usage\",",
            "      \"match\": {\"env\": \"prod\"}",
            "    },",
            "    \"pipeline\": [",
            "      {",
            "        \"op\": \"enrich\",",
            "        \"type\": \"dimension\",",
            "        \"on\": \"labels.ip\",",
            "        \"add\": \"service_group\"",
            "      },",
            "      {",
            "        \"op\": \"groupby\",",
            "        \"labels\": [\"service_group\"],",
            "        \"mode\": \"keep_others\"",
            "      },",
            "      {",
            "        \"op\": \"avg\",",
            "        \"window\": \"5m\"",
            "      }",
            "    ],",
            "    \"enabled\": true",
            "  }",
            "]"
        );
        
        File file = new File(TEST_RULES_FILE);
        file.getParentFile().mkdirs();
        try (FileWriter writer = new FileWriter(file)) {
            writer.write(testRule);
        }
        
        LOG.info("Created test rules file: {}", TEST_RULES_FILE);
    }
    
    public static void printTestInstructions() {
        System.out.println("\n========== Integration Test Instructions ==========\n");
        System.out.println("This test validates the complete DSL Rules Engine flow:");
        System.out.println("\n1. Data Generator:");
        System.out.println("   - Simulates 3 machines (192.168.1.1, 192.168.1.2, 192.168.1.3)");
        System.out.println("   - All machines belong to service_group A");
        System.out.println("   - Produces cpu_usage metrics every 1 minute");
        System.out.println("   - Pushes data to localhost:9999");
        System.out.println("\n2. Spark Streaming Job:");
        System.out.println("   - Reads from localhost:9999");
        System.out.println("   - Enriches data: adds service_group based on IP");
        System.out.println("   - Groups by service_group");
        System.out.println("   - Calculates 5-minute average of cpu_usage");
        System.out.println("   - Outputs results to console");
        System.out.println("\n3. Validation:");
        System.out.println("   - Verifies service_group_A exists in results");
        System.out.println("   - Validates CPU values are in range [0, 100]");
        System.out.println("   - Checks aggregation logic is correct");
        System.out.println("\nExpected Output:");
        System.out.println("   - Console logs showing enriched metrics");
        System.out.println("   - Aggregated results with service_group_a average");
        System.out.println("   - Validation PASSED message");
        System.out.println("\nTest Duration: ~6 minutes");
        System.out.println("\n====================================================\n");
    }
}