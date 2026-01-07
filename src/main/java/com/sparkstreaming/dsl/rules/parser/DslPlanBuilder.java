package com.sparkstreaming.dsl.rules.parser;

import com.sparkstreaming.dsl.rules.plan.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.List;

public class DslPlanBuilder {
    private static final Logger LOG = LoggerFactory.getLogger(DslPlanBuilder.class);

    public LogicalPlan build(DslRule rule) throws ValidationException {
        LOG.info("Building logical plan for rule: {}", rule.getRuleId());
        
        // Validate rule first
        rule.validate();
        
        // Start with source node
        LogicalPlan current = new SourceNode(
            rule.getSource().getMetric(),
            rule.getSource().getMatchLabels()
        );
        
        // Apply each operation in the pipeline
        List<DslOp> pipeline = rule.getPipeline();
        if (pipeline != null) {
            for (int i = 0; i < pipeline.size(); i++) {
                DslOp op = pipeline.get(i);
                LOG.debug("Applying operation {}: {}", i, op.getOperation());
                current = applyOp(current, op);
            }
        }
        
        LOG.info("Successfully built logical plan for rule: {}", rule.getRuleId());
        return current;
    }
    
    private LogicalPlan applyOp(LogicalPlan current, DslOp op) throws ValidationException {
        String operation = op.getOperation().toLowerCase();
        
        switch (operation) {
            case "enrich":
                return applyEnrich(current, op);
                
            case "rate":
                return applyRate(current, op);
                
            case "delta":
                return applyDelta(current, op);
                
            case "increase":
                return applyIncrease(current, op);
                
            case "changes":
                return applyChanges(current, op);
                
            case "groupby":
                return applyGroupBy(current, op);
                
            case "sum":
                return applyAggregate(current, op, AggregateNode.AggregateType.SUM);
                
            case "avg":
                return applyAggregate(current, op, AggregateNode.AggregateType.AVG);
                
            case "max":
                return applyAggregate(current, op, AggregateNode.AggregateType.MAX);
                
            case "min":
                return applyAggregate(current, op, AggregateNode.AggregateType.MIN);
                
            case "count":
                return applyAggregate(current, op, AggregateNode.AggregateType.COUNT);
                
            case "histogram_quantile":
                return applyHistogramQuantile(current, op);
                
            case "add":
            case "sub":
            case "mul":
            case "div":
                return applyArithmetic(current, op, operation);
                
            default:
                throw new ValidationException("Unsupported operation: " + op.getOperation());
        }
    }
    
    private LogicalPlan applyEnrich(LogicalPlan current, DslOp op) throws ValidationException {
        String type = op.getType();
        String on = op.getOn();
        String add = op.getAdd();
        
        if (type == null || on == null || add == null) {
            throw new ValidationException("Enrich operation requires type, on, and add fields");
        }
        
        EnrichNode.EnrichType enrichType;
        try {
            enrichType = EnrichNode.EnrichType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Unknown enrich type: " + type);
        }
        
        return new EnrichNode(current, on, add, enrichType, op.getSource());
    }
    
    private LogicalPlan applyRate(LogicalPlan current, DslOp op) throws ValidationException {
        Duration window = parseDuration(op.getWindow());
        
        RateNode.RateType rateType = RateNode.RateType.RATE; // default
        if (op.getType() != null) {
            try {
                rateType = RateNode.RateType.valueOf(op.getType().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Unknown rate type: " + op.getType());
            }
        }
        
        return new RateNode(current, window, rateType);
    }
    
    private LogicalPlan applyDelta(LogicalPlan current, DslOp op) throws ValidationException {
        Duration window = parseDuration(op.getWindow());
        return new DeltaNode(current, window);
    }
    
    private LogicalPlan applyIncrease(LogicalPlan current, DslOp op) throws ValidationException {
        Duration window = parseDuration(op.getWindow());
        return new IncreaseNode(current, window);
    }
    
    private LogicalPlan applyChanges(LogicalPlan current, DslOp op) throws ValidationException {
        Duration window = parseDuration(op.getWindow());
        return new ChangesNode(current, window);
    }
    
    private LogicalPlan applyGroupBy(LogicalPlan current, DslOp op) throws ValidationException {
        List<String> labels = op.getLabels();
        if (labels == null || labels.isEmpty()) {
            throw new ValidationException("Groupby operation requires labels");
        }
        
        GroupByNode.GroupByMode mode = GroupByNode.GroupByMode.KEEP_OTHERS; // default
        if (op.getMode() != null) {
            try {
                mode = GroupByNode.GroupByMode.valueOf(op.getMode().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Unknown groupby mode: " + op.getMode());
            }
        }
        
        return new GroupByNode(current, labels, mode);
    }
    
    private LogicalPlan applyAggregate(LogicalPlan current, DslOp op, 
                                       AggregateNode.AggregateType aggregateType) throws ValidationException {
        List<String> labels = op.getLabels();
        Duration window = op.getWindow() != null ? parseDuration(op.getWindow()) : null;
        
        return new AggregateNode(current, aggregateType, labels, window);
    }
    
    private LogicalPlan applyHistogramQuantile(LogicalPlan current, DslOp op) throws ValidationException {
        Double phi = op.getPhi();
        List<String> buckets = op.getBuckets();
        
        if (phi == null) {
            throw new ValidationException("Histogram quantile operation requires phi");
        }
        if (buckets == null || buckets.isEmpty()) {
            throw new ValidationException("Histogram quantile operation requires buckets");
        }
        
        return new HistogramQuantileNode(current, phi, buckets);
    }
    
    private LogicalPlan applyArithmetic(LogicalPlan current, DslOp op, String operation) throws ValidationException {
        ArithmeticNode.ArithmeticOp arithmeticOp;
        try {
            arithmeticOp = ArithmeticNode.ArithmeticOp.valueOf(operation.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Unknown arithmetic operation: " + operation);
        }
        
        Object left = op.getLeft();
        Object right = op.getRight();
        
        return new ArithmeticNode(current, arithmeticOp, left, right);
    }
    
    private Duration parseDuration(String durationStr) throws ValidationException {
        if (durationStr == null || durationStr.isEmpty()) {
            return null;
        }
        
        durationStr = durationStr.trim().toLowerCase();
        
        try {
            if (durationStr.endsWith("s")) {
                long seconds = Long.parseLong(durationStr.substring(0, durationStr.length() - 1));
                return Duration.ofSeconds(seconds);
            } else if (durationStr.endsWith("m")) {
                long minutes = Long.parseLong(durationStr.substring(0, durationStr.length() - 1));
                return Duration.ofMinutes(minutes);
            } else if (durationStr.endsWith("h")) {
                long hours = Long.parseLong(durationStr.substring(0, durationStr.length() - 1));
                return Duration.ofHours(hours);
            } else if (durationStr.endsWith("d")) {
                long days = Long.parseLong(durationStr.substring(0, durationStr.length() - 1));
                return Duration.ofDays(days);
            } else {
                // Default to seconds if no unit specified
                long seconds = Long.parseLong(durationStr);
                return Duration.ofSeconds(seconds);
            }
        } catch (NumberFormatException e) {
            throw new ValidationException("Invalid duration format: " + durationStr);
        }
    }
}