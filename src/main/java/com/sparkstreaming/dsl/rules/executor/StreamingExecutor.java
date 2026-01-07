package com.sparkstreaming.dsl.rules.executor;

import com.sparkstreaming.dsl.rules.model.MetricEvent;
import com.sparkstreaming.dsl.rules.model.SeriesKey;
import com.sparkstreaming.dsl.rules.plan.*;
import org.apache.spark.broadcast.Broadcast;
import org.apache.spark.streaming.Duration;
import org.apache.spark.streaming.State;
import org.apache.spark.streaming.StateSpec;
import org.apache.spark.streaming.api.java.*;
import scala.Tuple2;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;

public class StreamingExecutor implements LogicalPlanVisitor<JavaPairDStream<SeriesKey, Double>> {
    
    private final JavaDStream<MetricEvent> inputStream;
    private final Broadcast<Map<String, String>> dimensionTable;
    private final Map<String, Object> config;
    private final Duration batchDuration;
    
    public StreamingExecutor(JavaDStream<MetricEvent> inputStream, 
                             Broadcast<Map<String, String>> dimensionTable,
                             Map<String, Object> config) {
        this.inputStream = inputStream;
        this.dimensionTable = dimensionTable != null ? dimensionTable : 
            inputStream.context().sparkContext().broadcast(new HashMap<>());
        this.config = config != null ? config : new HashMap<>();
        this.batchDuration = inputStream.slideDuration();
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(SourceNode node) {
        String metric = node.getMetric();
        Map<String, String> matchLabels = node.getMatchLabels();
        
        return inputStream
            .filter(event -> {
                // Filter by metric name
                if (!event.getMetric().equals(metric)) {
                    return false;
                }
                
                // Filter by match labels
                for (Map.Entry<String, String> entry : matchLabels.entrySet()) {
                    String labelValue = event.getLabels().get(entry.getKey());
                    if (labelValue == null || !labelValue.equals(entry.getValue())) {
                        return false;
                    }
                }
                
                return true;
            })
            .mapToPair(event -> {
                SeriesKey key = new SeriesKey(event.getMetric(), event.getLabels());
                return new Tuple2<>(key, event.getValue());
            });
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(EnrichNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        
        return childStream.mapToPair(tuple -> {
            try {
                // Extract source value
                String sourceField = node.getSourceField();
                String[] parts = sourceField.split("\\.");
                String sourceValue = null;
                
                if (parts.length >= 2 && parts[0].equals("labels")) {
                    sourceValue = tuple._1.getLabels().get(parts[1]);
                }
                
                // Get dimension value from broadcast table
                if (sourceValue != null) {
                    Map<String, String> table = dimensionTable.value();
                    String enrichedValue = table.getOrDefault(sourceValue, "unknown");
                    
                    // Add new label
                    String targetField = node.getTargetField();
                    tuple._1.setLabel(targetField, enrichedValue);
                }
                
                return tuple;
            } catch (Exception e) {
                // Return original tuple if enrichment fails
                return tuple;
            }
        });
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(RateNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        
        // For Spark 2.3.1, we need to add timestamp information
        // We'll use mapWithState for stateful computation
        JavaMapWithStateDStream<SeriesKey, Tuple2<Double, Long>, MetricState, Tuple2<SeriesKey, Double>> stateStream =
            childStream.mapToPair(tuple -> {
                // Add timestamp to value
                long timestamp = System.currentTimeMillis();
                return new Tuple2<>(tuple._1, new Tuple2<>(tuple._2, timestamp));
            }).mapWithState(StateSpec.function((key, value, state) -> {
                MetricState metricState = state.exists() ? state.get() : new MetricState();
                
                double rate = 0.0;
                if (value.isPresent()) {
                    Tuple2<Double, Long> currentValue = value.get();
                    
                    if (metricState.getLastTimestamp() > 0) {
                        long timeDiff = currentValue._2 - metricState.getLastTimestamp();
                        double valueDiff = currentValue._1 - metricState.getLastValue();
                        
                        if (timeDiff > 0) {
                            rate = valueDiff / (timeDiff / 1000.0); // per second
                        }
                    }
                    
                    // Update state
                    metricState.update(currentValue._2, currentValue._1);
                    state.update(metricState);
                }
                
                return new Tuple2<>(key, rate);
            }).timeout(Duration.apply(10 * 60 * 1000))); // 10 minutes timeout

        return stateStream.mapToPair(tuple -> tuple);
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(DeltaNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        Duration window = durationToSpark(node.getWindow());
        
        // Use window operation to calculate delta
        return childStream.reduceByKeyAndWindow(
            (v1, v2) -> v2 - v1, // Latest - earliest in window
            window,
            batchDuration
        );
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(IncreaseNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        Duration window = durationToSpark(node.getWindow());
        
        // Use window operation to calculate increase
        return childStream.reduceByKeyAndWindow(
            Double::sum, // Sum all changes
            window,
            batchDuration
        );
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(ChangesNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        Duration window = durationToSpark(node.getWindow());
        
        // Count changes using mapWithState
        JavaMapWithStateDStream<SeriesKey, Double, ChangeCountState, Tuple2<SeriesKey, Double>> stateStream =
            childStream.mapWithState(StateSpec.function((key, value, state) -> {
                ChangeCountState countState = state.exists() ? state.get() : new ChangeCountState();
                
                if (value.isPresent()) {
                    double currentValue = value.get();
                    
                    if (currentValue != countState.getLastValue()) {
                        countState.increment();
                        countState.setLastValue(currentValue);
                    }
                    
                    state.update(countState);
                }
                
                return new Tuple2<>(key, (double) countState.getCount());
            }).timeout(Duration.apply(10 * 60 * 1000))); // 10 minutes timeout

        return stateStream.mapToPair(tuple -> tuple);
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(AggregateNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        
        // Apply groupby if specified
        if (node.getGroupByLabels() != null && !node.getGroupByLabels().isEmpty()) {
            childStream = childStream.mapToPair(tuple -> {
                // Create new key with only groupby labels
                SeriesKey newKey = new SeriesKey(tuple._1.getMetric(), new HashMap<>());
                for (String label : node.getGroupByLabels()) {
                    String value = tuple._1.getLabels().get(label);
                    if (value != null) {
                        newKey.setLabel(label, value);
                    }
                }
                return new Tuple2<>(newKey, tuple._2);
            });
        }
        
        // Apply window if specified
        if (node.getWindow() != null) {
            Duration window = durationToSpark(node.getWindow());
            
            switch (node.getAggregateType()) {
                case SUM:
                    return childStream.reduceByKeyAndWindow(Double::sum, window, batchDuration);
                case AVG:
                    return childStream.mapToPair(tuple -> new Tuple2<>(tuple._1, new Tuple2<>(tuple._2, 1L)))
                        .reduceByKeyAndWindow(
                            (t1, t2) -> new Tuple2<>(t1._1 + t2._1, t1._2 + t2._2),
                            window,
                            batchDuration
                        )
                        .mapToPair(tuple -> new Tuple2<>(tuple._1, tuple._2._1 / tuple._2._2));
                case MAX:
                    return childStream.reduceByKeyAndWindow(Math::max, window, batchDuration);
                case MIN:
                    return childStream.reduceByKeyAndWindow(Math::min, window, batchDuration);
                case COUNT:
                    return childStream.mapToPair(tuple -> new Tuple2<>(tuple._1, 1L))
                        .reduceByKeyAndWindow(Long::sum, window, batchDuration)
                        .mapToPair(tuple -> new Tuple2<>(tuple._1, tuple._2.doubleValue()));
                default:
                    throw new RuntimeException("Unknown aggregate type: " + node.getAggregateType());
            }
        } else {
            // No window, apply globally
            switch (node.getAggregateType()) {
                case SUM:
                    return childStream.reduceByKey(Double::sum);
                case AVG:
                    return childStream.mapToPair(tuple -> new Tuple2<>(tuple._1, new Tuple2<>(tuple._2, 1L)))
                        .reduceByKey((t1, t2) -> new Tuple2<>(t1._1 + t2._1, t1._2 + t2._2))
                        .mapToPair(tuple -> new Tuple2<>(tuple._1, tuple._2._1 / tuple._2._2));
                case MAX:
                    return childStream.reduceByKey(Math::max);
                case MIN:
                    return childStream.reduceByKey(Math::min);
                case COUNT:
                    return childStream.mapToPair(tuple -> new Tuple2<>(tuple._1, 1L))
                        .reduceByKey(Long::sum)
                        .mapToPair(tuple -> new Tuple2<>(tuple._1, tuple._2.doubleValue()));
                default:
                    throw new RuntimeException("Unknown aggregate type: " + node.getAggregateType());
            }
        }
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(GroupByNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        
        return childStream.mapToPair(tuple -> {
            // Create new key with only specified labels
            SeriesKey newKey = new SeriesKey(tuple._1.getMetric(), new HashMap<>());
            
            for (String label : node.getLabels()) {
                String value = tuple._1.getLabels().get(label);
                if (value != null) {
                    newKey.setLabel(label, value);
                }
            }
            
            return new Tuple2<>(newKey, tuple._2);
        });
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(ArithmeticNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        
        return childStream.mapToPair(tuple -> {
            double result = tuple._2;
            
            // Apply arithmetic operation
            switch (node.getOperation()) {
                case ADD:
                    result = applyOperand(result, node.getLeft()) + applyOperand(result, node.getRight());
                    break;
                case SUB:
                    result = applyOperand(result, node.getLeft()) - applyOperand(result, node.getRight());
                    break;
                case MUL:
                    result = applyOperand(result, node.getLeft()) * applyOperand(result, node.getRight());
                    break;
                case DIV:
                    double divisor = applyOperand(result, node.getRight());
                    result = divisor != 0 ? applyOperand(result, node.getLeft()) / divisor : 0;
                    break;
            }
            
            return new Tuple2<>(tuple._1, result);
        });
    }

    @Override
    public JavaPairDStream<SeriesKey, Double> visit(HistogramQuantileNode node) {
        JavaPairDStream<SeriesKey, Double> childStream = node.getChild().accept(this);
        double phi = node.getPhi();
        
        // Simple implementation - in real scenario, would need bucket data
        return childStream.mapToPair(tuple -> {
            // Placeholder - actual implementation would calculate quantile from buckets
            double quantile = tuple._2 * phi; // Simplified
            return new Tuple2<>(tuple._1, quantile);
        });
    }
    
    private Duration durationToSpark(java.time.Duration duration) {
        if (duration == null) {
            return batchDuration;
        }
        return Duration.apply(duration.toMillis());
    }
    
    private double applyOperand(double currentValue, Object operand) {
        if (operand == null) {
            return currentValue;
        }
        
        if (operand instanceof Number) {
            return ((Number) operand).doubleValue();
        } else if (operand instanceof Map) {
            // Handle field reference like {"field": "value"}
            @SuppressWarnings("unchecked")
            Map<String, Object> ref = (Map<String, Object>) operand;
            if ("field".equals(ref.get("field"))) {
                return currentValue;
            }
        }
        
        return currentValue;
    }
    
    // State classes for stateful operations
    public static class MetricState implements java.io.Serializable {
        private long lastTimestamp;
        private double lastValue;
        
        public long getLastTimestamp() {
            return lastTimestamp;
        }
        
        public double getLastValue() {
            return lastValue;
        }
        
        public void update(long timestamp, double value) {
            this.lastTimestamp = timestamp;
            this.lastValue = value;
        }
    }
    
    public static class ChangeCountState implements java.io.Serializable {
        private long count;
        private double lastValue;
        
        public long getCount() {
            return count;
        }
        
        public double getLastValue() {
            return lastValue;
        }
        
        public void setLastValue(double lastValue) {
            this.lastValue = lastValue;
        }
        
        public void increment() {
            this.count++;
        }
    }
}