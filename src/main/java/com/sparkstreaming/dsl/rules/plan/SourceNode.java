package com.sparkstreaming.dsl.rules.plan;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class SourceNode implements LogicalPlan {
    private final String metric;
    private final Map<String, String> matchLabels;
    private final List<LogicalPlan> children;

    public SourceNode(String metric, Map<String, String> matchLabels) {
        this.metric = Objects.requireNonNull(metric, "Metric cannot be null");
        this.matchLabels = matchLabels != null ? matchLabels : Collections.emptyMap();
        this.children = Collections.emptyList();
    }

    @Override
    public <T> T accept(LogicalPlanVisitor<T> visitor) {
        return visitor.visit(this);
    }

    @Override
    public List<LogicalPlan> children() {
        return children;
    }

    public String getMetric() {
        return metric;
    }

    public Map<String, String> getMatchLabels() {
        return matchLabels;
    }

    @Override
    public void validate() throws ValidationException {
        if (metric.trim().isEmpty()) {
            throw new ValidationException("Metric name cannot be empty");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SourceNode that = (SourceNode) o;
        return Objects.equals(metric, that.metric) &&
               Objects.equals(matchLabels, that.matchLabels);
    }

    @Override
    public int hashCode() {
        return Objects.hash(metric, matchLabels);
    }

    @Override
    public String toString() {
        return "SourceNode{" +
               "metric='" + metric + '\'' +
               ", matchLabels=" + matchLabels +
               '}';
    }
}