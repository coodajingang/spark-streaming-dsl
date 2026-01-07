package com.sparkstreaming.dsl.rules.parser;

import com.sparkstreaming.dsl.rules.plan.ValidationException;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;
import java.util.Objects;

public class SourceConfig {
    
    @JsonProperty("metric")
    private String metric;
    
    @JsonProperty("match")
    private Map<String, String> matchLabels;
    
    @JsonProperty("match_regex")
    private Map<String, String> matchRegex;

    public SourceConfig() {}

    public SourceConfig(String metric) {
        this.metric = metric;
    }

    public SourceConfig(String metric, Map<String, String> matchLabels) {
        this.metric = metric;
        this.matchLabels = matchLabels;
    }

    public String getMetric() {
        return metric;
    }

    public void setMetric(String metric) {
        this.metric = metric;
    }

    public Map<String, String> getMatchLabels() {
        return matchLabels;
    }

    public void setMatchLabels(Map<String, String> matchLabels) {
        this.matchLabels = matchLabels;
    }

    public Map<String, String> getMatchRegex() {
        return matchRegex;
    }

    public void setMatchRegex(Map<String, String> matchRegex) {
        this.matchRegex = matchRegex;
    }

    public void validate() throws ValidationException {
        if (metric == null || metric.trim().isEmpty()) {
            throw new ValidationException("source.metric is required");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SourceConfig that = (SourceConfig) o;
        return Objects.equals(metric, that.metric) &&
               Objects.equals(matchLabels, that.matchLabels) &&
               Objects.equals(matchRegex, that.matchRegex);
    }

    @Override
    public int hashCode() {
        return Objects.hash(metric, matchLabels, matchRegex);
    }

    @Override
    public String toString() {
        return "SourceConfig{" +
               "metric='" + metric + '\'' +
               ", matchLabels=" + matchLabels +
               ", matchRegex=" + matchRegex +
               '}';
    }
}