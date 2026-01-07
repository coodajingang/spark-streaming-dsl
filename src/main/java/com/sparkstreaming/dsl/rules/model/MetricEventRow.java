package com.sparkstreaming.dsl.rules.model;

import org.apache.spark.sql.Encoder;
import org.apache.spark.sql.Encoders;
import org.apache.spark.sql.types.DataTypes;
import org.apache.spark.sql.types.StructType;

import java.io.Serializable;
import java.util.Map;
import java.util.Objects;

public class MetricEventRow implements Serializable {
    private long timestamp;
    private String metric;
    private Map<String, String> labels;
    private double value;

    public MetricEventRow() {}

    public MetricEventRow(long timestamp, String metric, Map<String, String> labels, double value) {
        this.timestamp = timestamp;
        this.metric = metric;
        this.labels = labels;
        this.value = value;
    }

    public static MetricEventRow fromMetricEvent(MetricEvent event) {
        return new MetricEventRow(event.getTimestamp(), event.getMetric(), event.getLabels(), event.getValue());
    }

    public MetricEvent toMetricEvent() {
        return new MetricEvent(timestamp, metric, labels, value);
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    public String getMetric() {
        return metric;
    }

    public void setMetric(String metric) {
        this.metric = metric;
    }

    public Map<String, String> getLabels() {
        return labels;
    }

    public void setLabels(Map<String, String> labels) {
        this.labels = labels;
    }

    public double getValue() {
        return value;
    }

    public void setValue(double value) {
        this.value = value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MetricEventRow that = (MetricEventRow) o;
        return timestamp == that.timestamp &&
               Double.compare(that.value, value) == 0 &&
               Objects.equals(metric, that.metric) &&
               Objects.equals(labels, that.labels);
    }

    @Override
    public int hashCode() {
        return Objects.hash(timestamp, metric, labels, value);
    }

    @Override
    public String toString() {
        return "MetricEventRow{" +
               "timestamp=" + timestamp +
               ", metric='" + metric + '\'' +
               ", labels=" + labels +
               ", value=" + value +
               '}';
    }

    public static Encoder<MetricEventRow> encoder() {
        return Encoders.bean(MetricEventRow.class);
    }

    public static StructType schema() {
        return new StructType()
            .add("timestamp", DataTypes.LongType, false)
            .add("metric", DataTypes.StringType, false)
            .add("labels", DataTypes.createMapType(DataTypes.StringType, DataTypes.StringType), false)
            .add("value", DataTypes.DoubleType, false);
    }
}