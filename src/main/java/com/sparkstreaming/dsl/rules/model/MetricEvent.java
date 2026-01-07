package com.sparkstreaming.dsl.rules.model;

import java.util.Map;
import java.util.Objects;

public class MetricEvent {
    private long timestamp;
    private String metric;
    private Map<String, String> labels;
    private double value;

    public MetricEvent() {}

    public MetricEvent(long timestamp, String metric, Map<String, String> labels, double value) {
        this.timestamp = timestamp;
        this.metric = metric;
        this.labels = labels;
        this.value = value;
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
        MetricEvent that = (MetricEvent) o;
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
        return "MetricEvent{" +
               "timestamp=" + timestamp +
               ", metric='" + metric + '\'' +
               ", labels=" + labels +
               ", value=" + value +
               '}';
    }
}