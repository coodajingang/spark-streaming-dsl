package com.sparkstreaming.dsl.rules.executor;

import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.sparkstreaming.dsl.rules.model.SeriesKey;
import com.sparkstreaming.dsl.rules.plan.*;
import org.apache.spark.broadcast.Broadcast;
import org.apache.spark.sql.*;
import org.apache.spark.sql.streaming.DataStreamWriter;
import org.apache.spark.sql.streaming.OutputMode;
import org.apache.spark.sql.streaming.StreamingQuery;
import org.apache.spark.sql.streaming.StreamingQueryException;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import static org.apache.spark.sql.functions.*;

/**
 * Structured Streaming Executor for DSL Rules Engine
 * Compatible with Spark 2.3.1 Structured Streaming API
 */
public class StructuredStreamingExecutor implements LogicalPlanVisitor<Dataset<Row>> {
    
    private static final Logger LOG = LoggerFactory.getLogger(StructuredStreamingExecutor.class);
    
    private final SparkSession spark;
    private final Broadcast<Map<String, String>> dimensionTable;
    private final Map<String, Object> config;
    
    public StructuredStreamingExecutor(SparkSession spark, 
                                       Broadcast<Map<String, String>> dimensionTable,
                                       Map<String, Object> config) {
        this.spark = spark;
        this.dimensionTable = dimensionTable != null ? dimensionTable : 
            spark.sparkContext().broadcast(new java.util.HashMap<>());
        this.config = config != null ? config : new java.util.HashMap<>();
    }

    @Override
    public Dataset<Row> visit(SourceNode node) {
        LOG.debug("Executing SourceNode for metric: {}", node.getMetric());
        
        String metric = node.getMetric();
        Map<String, String> matchLabels = node.getMatchLabels();
        
        Dataset<Row> df = spark.readStream()
            .format("memory")
            .option("trigger", "processingTime")
            .load();
        
        // Filter by metric name
        df = df.filter(col("metric").equalTo(metric));
        
        // Apply label filters
        for (Map.Entry<String, String> entry : matchLabels.entrySet()) {
            df = df.filter(col("labels").getItem(entry.getKey()).equalTo(entry.getValue()));
        }
        
        // Create series key
        df = df.withColumn("series_key", 
            struct(col("metric"), col("labels")));
            
        return df;
    }

    @Override
    public Dataset<Row> visit(EnrichNode node) {
        LOG.debug("Executing EnrichNode: {} -> {}", node.getSourceField(), node.getTargetField());
        
        Dataset<Row> child = node.getChild().accept(this);
        
        // TODO: Implement proper enrich with broadcast variables
        // In Spark 2.3.1, this requires mapPartitions with broadcast value
        
        return child;
    }

    @Override
    public Dataset<Row> visit(RateNode node) {
        LOG.debug("Executing RateNode with window: {}", node.getWindow());
        
        Dataset<Row> child = node.getChild().accept(this);
        
        // In Structured Streaming, rate calculation requires stateful operations
        // This is a simplified placeholder
        return child.withColumn("rate", 
            when(col("value").isNotNull(), col("value"))
            .otherwise(lit(0.0)));
    }

    @Override
    public Dataset<Row> visit(DeltaNode node) {
        LOG.debug("Executing DeltaNode with window: {}", node.getWindow());
        
        Dataset<Row> child = node.getChild().accept(this);
        String windowDuration = formatDuration(node.getWindow());
        
        // Add watermark
        child = child.withWatermark("timestamp", windowDuration);
        
        // Create window spec
        WindowSpec windowSpec = Window.partitionBy("series_key")
            .orderBy("timestamp")
            .rangeBetween(-node.getWindow().toMillis(), 0);
        
        // Calculate delta (current - first in window)
        return child.withColumn("delta", 
            col("value").minus(first("value").over(windowSpec)));
    }

    @Override
    public Dataset<Row> visit(IncreaseNode node) {
        LOG.debug("Executing IncreaseNode with window: {}", node.getWindow());
        
        Dataset<Row> child = node.getChild().accept(this);
        String windowDuration = formatDuration(node.getWindow());
        
        // Add watermark
        child = child.withWatermark("timestamp", windowDuration);
        
        // Calculate increase (sum of changes in window)
        // This is simplified - real implementation needs stateful processing
        return child.withColumn("increase", col("value"));
    }

    @Override
    public Dataset<Row> visit(ChangesNode node) {
        LOG.debug("Executing ChangesNode with window: {}", node.getWindow());
        
        Dataset<Row> child = node.getChild().accept(this);
        String windowDuration = formatDuration(node.getWindow());
        
        child = child.withWatermark("timestamp", windowDuration);
        
        // Count changes (simplified - needs stateful logic)
        return child.withColumn("changes", 
            when(col("value").isNotNull(), 1).otherwise(0));
    }

    @Override
    public Dataset<Row> visit(AggregateNode node) {
        LOG.debug("Executing AggregateNode: {}", node.getAggregateType());
        
        Dataset<Row> child = node.getChild().accept(this);
        
        // Apply groupby if specified
        String[] groupByCols = node.getGroupByLabels().toArray(new String[0]);
        if (groupByCols.length > 0) {
            child = child.withColumn("group_key", 
                explode(array(groupByCols)));
            child = child.groupBy("group_key");
        } else {
            child = child.groupBy();
        }
        
        // Apply aggregation
        switch (node.getAggregateType()) {
            case SUM:
                return child.agg(sum("value").as("result"));
            case AVG:
                return child.agg(avg("value").as("result"));
            case MAX:
                return child.agg(max("value").as("result"));
            case MIN:
                return child.agg(min("value").as("result"));
            case COUNT:
                return child.agg(count("value").as("result"));
            default:
                throw new RuntimeException("Unknown aggregate type: " + node.getAggregateType());
        }
    }

    @Override
    public Dataset<Row> visit(GroupByNode node) {
        LOG.debug("Executing GroupByNode with labels: {}", node.getLabels());
        
        Dataset<Row> child = node.getChild().accept(this);
        
        // For simplicity, just return with group key columns
        String[] labels = node.getLabels().toArray(new String[0]);
        if (labels.length > 0) {
            child = child.withColumn("group_keys", 
                array(labels));
        }
        
        return child;
    }

    @Override
    public Dataset<Row> visit(ArithmeticNode node) {
        LOG.debug("Executing ArithmeticNode: {}", node.getOperation());
        
        Dataset<Row> child = node.getChild().accept(this);
        
        Column result;
        Column left = col("value");
        Column right = col("value");
        
        switch (node.getOperation()) {
            case ADD:
                result = left.plus(right);
                break;
            case SUB:
                result = left.minus(right);
                break;
            case MUL:
                result = left.multiply(right);
                break;
            case DIV:
                result = when(right.notEqual(0), left.divide(right)).otherwise(0);
                break;
            default:
                throw new RuntimeException("Unknown arithmetic operation: " + node.getOperation());
        }
        
        return child.withColumn("arithmetic_result", result);
    }

    @Override
    public Dataset<Row> visit(HistogramQuantileNode node) {
        LOG.debug("Executing HistogramQuantileNode with phi: {}", node.getPhi());
        
        Dataset<Row> child = node.getChild().accept(this);
        double phi = node.getPhi();
        
        // Simplified quantile calculation
        return child.withColumn("quantile", col("value").multiply(phi));
    }

    private String formatDuration(Duration duration) {
        long seconds = duration.getSeconds();
        if (seconds < 60) {
            return seconds + " seconds";
        } else if (seconds < 3600) {
            return (seconds / 60) + " minutes";
        } else if (seconds < 86400) {
            return (seconds / 3600) + " hours";
        } else {
            return (seconds / 86400) + " days";
        }
    }
}