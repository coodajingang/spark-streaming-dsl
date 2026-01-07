# Structured Streaming Usage Guide

## Migration Overview

Both DStream and Structured Streaming versions share the same DSL, parser, and logical plan infrastructure. The only difference is in the execution layer.

## Quick Start

### 1. Dependencies (pom.xml)

Both DStream and Structured Streaming dependencies are included:
```xml
<dependency>
    <groupId>org.apache.spark</groupId>
    <artifactId>spark-streaming_2.11</artifactId>
    <version>2.3.1</version>
</dependency>
<dependency>
    <groupId>org.apache.spark</groupId>
    <artifactId>spark-sql_2.11</artifactId>
    <version>2.3.1</version>
</dependency>
```

### 2. Create Rules (same for both)

```json
[
  {
    "rule_id": "cpu_avg",
    "source": { "metric": "cpu_usage", "match": {"env": "prod"} },
    "pipeline": [
      {"op": "groupby", "labels": ["host"]},
      {"op": "avg", "window": "5m"}
    ]
  }
]
```

### 3. Execute Rules

#### DStream Version

```java
import org.apache.spark.SparkConf;
import org.apache.spark.streaming.api.java.*;
import com.sparkstreaming.dsl.rules.executor.StreamingExecutor;

// Initialize context
SparkConf conf = new SparkConf().setAppName("DSL-Rules-DStream");
JavaStreamingContext jssc = new JavaStreamingContext(conf, batchDuration);

// Create input stream
JavaDStream<MetricEvent> inputStream = createYourInputStream(jssc);

// Load rules
List<DslRule> rules = RuleLoader.loadRules("config/rules.json");

// Execute each rule
for (DslRule rule : rules) {
    DslPlanBuilder builder = new DslPlanBuilder();
    LogicalPlan plan = builder.build(rule);
    
    StreamingExecutor executor = new StreamingExecutor(inputStream, broadcastTable, config);
    JavaPairDStream<SeriesKey, Double> result = plan.accept(executor);
    
    // Output results
    result.foreachRDD((rdd, time) -> {
        // Your output logic here
    });
}

jssc.start();
jssc.awaitTermination();
```

#### Structured Streaming Version

```java
import org.apache.spark.sql.*;
import com.sparkstreaming.dsl.rules.executor.StructuredStreamingExecutor;

// Initialize SparkSession
SparkSession spark = SparkSession
    .builder()
    .appName("DSL-Rules-Structured")
    .getOrCreate();

// Create input stream
Dataset<Row> inputStream = spark
    .readStream()
    .format("kafka")
    .option("kafka.bootstrap.servers", "localhost:9092")
    .option("subscribe", "metrics")
    .load();

// Parse kafka value to MetricEvent structure
Dataset<Row> metrics = inputStream
    .select(from_json(col("value").cast("string"), MetricEventRow.schema()).as("metric"))
    .select("metric.*");

// Register as temp view for queries
metrics.createOrReplaceTempView("metrics_stream");

// Load and execute rules
List<DslRule> rules = RuleLoader.loadRules("config/rules.json");

List<StreamingQuery> queries = new ArrayList<>();
for (DslRule rule : rules) {
    DslPlanBuilder builder = new DslPlanBuilder();
    LogicalPlan plan = builder.build(rule);
    
    StructuredStreamingExecutor executor = new StructuredStreamingExecutor(spark, broadcastTable, config);
    Dataset<Row> result = plan.accept(executor);
    
    // Output results
    StreamingQuery query = result.writeStream()
        .format("console")
        .outputMode("append")
        .start();
    
    queries.add(query);
}

// Wait for termination
spark.streams().awaitAnyTermination();
```

## Key Differences

| Aspect | DStream | Structured Streaming |
|--------|---------|---------------------|
| Context | JavaStreamingContext | SparkSession |
| Input | JavaDStream<MetricEvent> | Dataset<Row> |
| Executor | StreamingExecutor | StructuredStreamingExecutor |
| Output | foreachRDD() | writeStream() |
| State | mapWithState() | mapGroupsWithState() |
| Window | reduceByKeyAndWindow() | groupBy().agg() with watermark |

## API Mapping

### Basic Operations

**Filter:**
- DStream: `stream.filter(event -> condition)`
- Structured Streaming: `df.filter(col("value").gt(10))`

**Map:**
- DStream: `stream.map(event -> transform)`
- Structured Streaming: `df.select(expr("value * 2"))`

**Group By:**
- DStream: `stream.mapToPair(...).reduceByKey(...)`
- Structured Streaming: `df.groupBy("key").agg(sum("value"))`

### Stateful Operations

**Window Aggregation:**
- DStream: `reduceByKeyAndWindow(func, windowDuration, slideDuration)`
- Structured Streaming: `df.groupBy(window("timestamp", "5 minutes"), "key").agg(sum("value"))`

**Session Windows:**
- DStream: Not directly supported
- Structured Streaming: `df.groupBy(session_window("timestamp", "5 minutes")).agg(...)`

### Output

**Console Output:**
- DStream: `stream.print()`
- Structured Streaming: `df.writeStream().format("console").start()`

**Kafka Output:**
- DStream: Custom foreachRDD implementation
- Structured Streaming: `df.writeStream().format("kafka").options(...).start()`

## Compatibility Notes

Both implementations:
- Use the same DSL rules (JSON format)
- Use the same logical plan structure
- Use the same parser and validation
- Support the same operators

The only difference is the execution engine and API used.

## Performance Considerations

**Structured Streaming advantages:**
- Better optimization via Catalyst
- More efficient state management
- Easier to debug (query plans)
- Unified batch/streaming API

**DStream advantages:**
- Lower latency (micro-batch)
- More mature API (Spark 2.3.1)
- More examples and community support

Choose based on your specific requirements.