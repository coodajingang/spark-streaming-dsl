package com.sparkstreaming.dsl.rules.manager;

import com.sparkstreaming.dsl.rules.executor.StreamingExecutor;
import com.sparkstreaming.dsl.rules.parser.DslRule;
import com.sparkstreaming.dsl.rules.parser.RuleLoader;
import com.sparkstreaming.dsl.rules.plan.DslPlanBuilder;
import com.sparkstreaming.dsl.rules.plan.LogicalPlan;
import com.sparkstreaming.dsl.rules.utils.FileWatchService;
import org.apache.spark.broadcast.Broadcast;
import org.apache.spark.streaming.api.java.JavaDStream;
import org.apache.spark.streaming.api.java.JavaPairDStream;
import org.apache.spark.streaming.api.java.JavaStreamingContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Function;

public class RuleManager {
    private static final Logger LOG = LoggerFactory.getLogger(RuleManager.class);
    
    private final String rulesFilePath;
    private final JavaStreamingContext streamingContext;
    private final RuleExecutionFactory executionFactory;
    private final FileWatchService fileWatchService;
    
    private final AtomicReference<List<DslRule>> activeRules = new AtomicReference<>(Collections.emptyList());
    private final Map<String, JavaPairDStream<?, ?>> runningExecutions = new ConcurrentHashMap<>();
    private final Map<String, Object> ruleStates = new ConcurrentHashMap<>();
    
    private volatile boolean started = false;
    
    public interface RuleExecutionFactory {
        JavaPairDStream<?, ?> createExecution(DslRule rule);
    }
    
    public RuleManager(String rulesFilePath, 
                      JavaStreamingContext streamingContext,
                      RuleExecutionFactory executionFactory,
                      Duration checkInterval) {
        this.rulesFilePath = rulesFilePath;
        this.streamingContext = streamingContext;
        this.executionFactory = executionFactory;
        this.fileWatchService = new FileWatchService(rulesFilePath, checkInterval);
    }
    
    public void start() throws IOException {
        if (started) {
            LOG.warn("RuleManager is already started");
            return;
        }
        
        LOG.info("Starting RuleManager for: {}", rulesFilePath);
        
        // Load initial rules
        loadAndStartRules();
        
        // Setup file watcher
        fileWatchService.addListener(this::onRulesFileChanged);
        fileWatchService.start();
        
        started = true;
        LOG.info("RuleManager started successfully");
        
        // Log active rules
        List<DslRule> rules = activeRules.get();
        LOG.info("Active rules: {}", rules.size());
        for (DslRule rule : rules) {
            LOG.info("  - {}: {}", rule.getRuleId(), rule.getDescription());
        }
    }
    
    public void stop() {
        if (!started) {
            return;
        }
        
        LOG.info("Stopping RuleManager");
        
        fileWatchService.stop();
        runningExecutions.clear();
        ruleStates.clear();
        
        started = false;
        LOG.info("RuleManager stopped");
    }
    
    public List<DslRule> getActiveRules() {
        return activeRules.get();
    }
    
    private void onRulesFileChanged(java.nio.file.Path path) {
        LOG.info("Rules file changed: {}", path);
        
        try {
            // Give the file system a moment to finish writing
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        try {
            reloadRules();
        } catch (Exception e) {
            LOG.error("Failed to reload rules", e);
        }
    }
    
    private void loadAndStartRules() {
        try {
            List<DslRule> rules = RuleLoader.loadRules(rulesFilePath);
            activeRules.set(rules);
            
            // Start executions for enabled rules
            for (DslRule rule : rules) {
                if (Boolean.TRUE.equals(rule.getEnabled())) {
                    startRuleExecution(rule);
                }
            }
            
            LOG.info("Loaded and started {} rules", rules.size());
        } catch (Exception e) {
            LOG.error("Failed to load and start rules", e);
        }
    }
    
    private synchronized void reloadRules() {
        LOG.info("Reloading rules...");
        
        try {
            // Load new rules
            List<DslRule> newRules = RuleLoader.loadRules(rulesFilePath);
            List<DslRule> oldRules = activeRules.get();
            
            // Find rules to stop (not in new rules or disabled)
            Set<String> newRuleIds = new HashSet<>();
            for (DslRule rule : newRules) {
                if (Boolean.TRUE.equals(rule.getEnabled())) {
                    newRuleIds.add(rule.getRuleId());
                }
            }
            
            for (DslRule oldRule : oldRules) {
                if (!newRuleIds.contains(oldRule.getRuleId())) {
                    stopRuleExecution(oldRule.getRuleId());
                }
            }
            
            // Update active rules
            activeRules.set(newRules);
            
            // Start new or updated rules
            for (DslRule rule : newRules) {
                if (Boolean.TRUE.equals(rule.getEnabled())) {
                    // Check if this is a new rule or updated rule
                    boolean isNewOrUpdated = true;
                    for (DslRule oldRule : oldRules) {
                        if (oldRule.getRuleId().equals(rule.getRuleId()) && 
                            oldRule.equals(rule)) {
                            isNewOrUpdated = false;
                            break;
                        }
                    }
                    
                    if (isNewOrUpdated) {
                        startRuleExecution(rule);
                    }
                }
            }
            
            LOG.info("Successfully reloaded {} rules", newRules.size());
            
        } catch (Exception e) {
            LOG.error("Failed to reload rules", e);
        }
    }
    
    private void startRuleExecution(DslRule rule) {
        try {
            LOG.info("Starting execution for rule: {}", rule.getRuleId());
            
            // Create execution
            JavaPairDStream<?, ?> resultStream = executionFactory.createExecution(rule);
            
            // Store reference
            runningExecutions.put(rule.getRuleId(), resultStream);
            
            // Setup output
            setupResultOutput(resultStream, rule);
            
            LOG.info("Started execution for rule: {}", rule.getRuleId());
            
        } catch (Exception e) {
            LOG.error("Failed to start rule execution: {}", rule.getRuleId(), e);
        }
    }
    
    private void stopRuleExecution(String ruleId) {
        LOG.info("Stopping execution for rule: {}", ruleId);
        
        runningExecutions.remove(ruleId);
        ruleStates.remove(ruleId);
        
        LOG.info("Stopped execution for rule: {}", ruleId);
    }
    
    private void setupResultOutput(JavaPairDStream<?, ?> resultStream, DslRule rule) {
        // Add output logic here based on rule configuration
        // For now, just print to console
        resultStream.foreachRDD((rdd, time) -> {
            if (!rdd.isEmpty()) {
                long count = rdd.count();
                LOG.info("Rule {} produced {} results at {}", 
                    rule.getRuleId(), count, Instant.ofEpochMilli(time.milliseconds()));
                
                // Print first few results for debugging
                rdd.take(5).forEach(result -> {
                    LOG.debug("  Result: {}", result);
                });
            }
        });
    }
}