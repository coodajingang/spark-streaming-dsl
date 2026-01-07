package com.sparkstreaming.dsl.rules.model;

import java.io.Serializable;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;

public class SeriesKey implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String metric;
    private Map<String, String> labels;

    public SeriesKey() {
        this.labels = new TreeMap<>();
    }

    public SeriesKey(String metric, Map<String, String> labels) {
        this.metric = metric;
        this.labels = new TreeMap<>(labels);
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
        this.labels = new TreeMap<>(labels);
    }

    public void setLabel(String key, String value) {
        if (this.labels == null) {
            this.labels = new TreeMap<>();
        }
        this.labels.put(key, value);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SeriesKey seriesKey = (SeriesKey) o;
        return Objects.equals(metric, seriesKey.metric) &&
               Objects.equals(labels, seriesKey.labels);
    }

    @Override
    public int hashCode() {
        return Objects.hash(metric, labels);
    }

    @Override
    public String toString() {
        return "SeriesKey{" +
               "metric='" + metric + '\'' +
               ", labels=" + labels +
               '}';
    }
}