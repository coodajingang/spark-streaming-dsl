package com.sparkstreaming.dsl.rules;

import com.sparkstreaming.dsl.rules.executor.StreamingExecutor;
import com.sparkstreaming.dsl.rules.manager.RuleManager;
import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.sparkstreaming.dsl.rules.parser.DslRule;
import com.sparkstreaming.dsl.rules.plan.DslPlanBuilder;
import com.sparkstreaming.dsl.rules.plan.LogicalPlan;
import org.apache.spark.SparkConf;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.broadcast.Broadcast;
import org.apache.spark.streaming.Duration;
import org.apache.spark.streaming.api.java.JavaDStream;
import org.apache.spark.streaming.api.java.JavaPairDStream;
import org.apache.spark.streaming.api.java.JavaStreamingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.*;

public class Main {
    private static final Logger LOG = LoggerFactory.getLogger(Main.class);
    private static final String APP_NAME = "DSL-Spark-Streaming-Rules-Engine";
    
    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Usage: Main --rules-file <path> [--checkpoint-dir <path>] [--test-mode]");
            System.exit(1);
        }
        
        // Parse arguments
        Map<String, String> argMap = parseArguments(args);
        String rulesFile = argMap.get("rules-file");
        String checkpointDir = argMap.getOrDefault("checkpoint-dir", "/tmp/spark/checkpoint/dsl-rules");
        boolean testMode = Boolean.parseBoolean(argMap.getOrDefault("test-mode", "false"));
        
        if (rulesFile == null) {
            System.err.println("--rules-file is required");
            System.exit(1);
        }
        
        LOG.info("Starting DSL Spark Streaming Rules Engine");
        LOG.info("Rules file: {}", rulesFile);
        LOG.info("Checkpoint directory: {}", checkpointDir);
        LOG.info("Test mode: {}", testMode);
        
        try {
            // 1. Initialize Spark Streaming Context
            SparkConf conf = new SparkConf().setAppName(APP_NAME);
            
            // Set some reasonable defaults if not set
            if (conf.get("spark.master", null) == null) {
                conf.setMaster("local[*]");
                LOG.warn("spark.master not set, using local[*]");
            }
            
            JavaStreamingContext streamingContext = JavaStreamingContext.getOrCreate(
                checkpointDir,
                () -> createStreamingContext(conf, checkpointDir, testMode)
            );
            
            // 2. Load dimension table (example - in production load from external source)
            Map<String, String> dimensionTable = loadDimensionTable();
            Broadcast<Map<String, String>> broadcastTable = streamingContext.sparkContext().broadcast(dimensionTable);
            
            // 3. Create input stream (Kafka or test data)
            JavaDStream<MetricEvent> inputStream;
            if (testMode) {
                inputStream = createTestInputStream(streamingContext);
            } else {
                inputStream = createKafkaInputStream(streamingContext);
            }
            
            // 4. Create RuleManager with hot-loading support
            RuleManager ruleManager = new RuleManager(
                rulesFile,
                streamingContext,
                rule -> {
                    // Create execution for rule
                    return createRuleExecution(rule, inputStream, broadcastTable);
                },
                Duration.ofSeconds(30)  // Check for changes every 30 seconds
            );
            
            // 5. Start rule manager
            ruleManager.start();
            
            // 6. Set shutdown hook
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                LOG.info("Shutting down DSL Rules Engine...");
                ruleManager.stop();
                streamingContext.stop(true, true);
                LOG.info("Shutdown complete");
            }));
            
            // 7. Start Spark Streaming
            LOG.info("Starting Spark Streaming context...");
            streamingContext.start();
            streamingContext.awaitTermination();
            
        } catch (Exception e) {
            LOG.error("Failed to start DSL Rules Engine", e);
            System.exit(1);
        }
    }
    
    private static JavaStreamingContext createStreamingContext(SparkConf conf, String checkpointDir, boolean testMode) {
        // Set checkpoint directory
        conf.set("spark.streaming.checkpoint.directory", checkpointDir);
        
        // Create streaming context with 4 second batch interval
        JavaStreamingContext jssc = new JavaStreamingContext(conf, Duration.apply(4000));
        jssc.checkpoint(checkpointDir);
        
        LOG.info("Created new JavaStreamingContext");
        return jssc;
    }
    
    private static Map<String, String> loadDimensionTable() {
        // In production, load from HDFS, database, or external service
        // For demo, return a simple mapping
        Map<String, String> dimensionTable = new HashMap<>();
        dimensionTable.put("192.168.1.1", "web-servers");
        dimensionTable.put("192.168.1.2", "web-servers");
        dimensionTable.put("192.168.1.3", "database-servers");
        dimensionTable.put("192.168.1.4", "database-servers");
        dimensionTable.put("192.168.1.5", "cache-servers");
        dimensionTable.put("192.168.1.6", "cache-servers");
        return dimensionTable;
    }
    
    private static JavaDStream<MetricEvent> createTestInputStream(JavaStreamingContext jssc) {
        LOG.info("Creating test input stream");
        
        // Create test data
        List<MetricEvent> testEvents = Arrays.asList(
            createMetricEvent("cpu_usage", "192.168.1.1", "prod", 45.5),
            createMetricEvent("cpu_usage", "192.168.1.2", "prod", 52.3),
            createMetricEvent("cpu_usage", "192.168.1.3", "prod", 78.1),
            createMetricEvent("cpu_usage", "192.168.1.4", "prod", 65.7),
            createMetricEvent("cpu_usage", "192.168.1.5", "prod", 32.2),
            createMetricEvent("cpu_usage", "192.168.1.6", "prod", 28.9),
            createMetricEvent("memory_usage", "192.168.1.1", "prod", 1234.5),
            createMetricEvent("memory_usage", "192.168.1.2", "prod", 2345.6),
            createMetricEvent("memory_usage", "192.168.1.3", "prod", 3456.7),
            createMetricEvent("memory_usage", "192.168.1.4", "prod", 4567.8)
        );
        
        // Create queue stream
        Queue<JavaDStream<MetricEvent>> queue = new LinkedList<>();
        for (int i = 0; i < 100; i++) {
            JavaDStream<MetricEvent> batch = jssc.sparkContext().parallelize(testEvents).toJavaRDD().toJavaDStream();
            queue.add(batch);
        }
        
        return jssc.queueStream(queue, true);
    }
    
    private static JavaDStream<MetricEvent> createKafkaInputStream(JavaStreamingContext jssc) {
        LOG.info("Creating Kafka input stream (placeholder)");
        
        // In production, use KafkaUtils.createDirectStream
        // For now, return test stream as placeholder
        return createTestInputStream(jssc);
    }
    
    private static MetricEvent createMetricEvent(String metric, String ip, String env, double value) {
        Map<String, String> labels = new HashMap<>();
        labels.put("ip", ip);
        labels.put("env", env);
        
        MetricEvent event = new MetricEvent();
        event.setTimestamp(System.currentTimeMillis());
        event.setMetric(metric);
        event.setLabels(labels);
        event.setValue(value);
        
        return event;
    }
    
    private static JavaPairDStream<?, ?> createRuleExecution(DslRule rule, 
                                                               JavaDStream<MetricEvent> inputStream,
                                                               Broadcast<Map<String, String>> broadcastTable) {
        LOG.info("Creating execution for rule: {}", rule.getRuleId());
        
        // Build logical plan
        DslPlanBuilder builder = new DslPlanBuilder();
        LogicalPlan plan = builder.build(rule);
        
        LOG.debug("Built logical plan for rule: {}", rule.getRuleId());
        
        // Create executor
        Map<String, Object> config = new HashMap<>();
        config.put("rule.id", rule.getRuleId());
        config.put("rule.description", rule.getDescription());
        
        StreamingExecutor executor = new StreamingExecutor(inputStream, broadcastTable, config);
        
        // Execute plan
        @SuppressWarnings("unchecked")
        JavaPairDStream<?, ?> result = plan.accept(executor);
        
        // Log results
        result.foreachRDD((rdd, time) -> {
            if (!rdd.isEmpty()) {
                long count = rdd.count();
                LOG.info("Rule {} produced {} results at {}", 
                    rule.getRuleId(), count, new Date(time.milliseconds()));
                
                // Print a few sample results
                List<?> samples = rdd.take(3);
                for (Object sample : samples) {
                    LOG.debug("  Sample result: {}", sample);
                }
            }
        });
        
        return result;
    }
    
    private static Map<String, String> parseArguments(String[] args) {
        Map<String, String> argMap = new HashMap<>();
        
        for (int i = 0; i < args.length; i += 2) {
            if (i + 1 < args.length) {
                String key = args[i].replace("--", "");
                String value = args[i + 1];
                argMap.put(key, value);
            }
        }
        
        return argMap;
    }
}