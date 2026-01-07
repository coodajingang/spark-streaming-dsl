package com.sparkstreaming.dsl.rules.plan;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class AggregateNode implements LogicalPlan {
    private final LogicalPlan child;
    private final AggregateType aggregateType;
    private final List<String> groupByLabels;
    private final Duration window;

    public enum AggregateType {
        SUM,
        AVG,
        MAX,
        MIN,
        COUNT
    }

    public AggregateNode(LogicalPlan child, AggregateType aggregateType, 
                         List<String> groupByLabels, Duration window) {
        this.child = Objects.requireNonNull(child, "Child plan cannot be null");
        this.aggregateType = Objects.requireNonNull(aggregateType, "Aggregate type cannot be null");
        this.groupByLabels = groupByLabels != null ? groupByLabels : Collections.emptyList();
        this.window = window;
    }

    @Override
    public <T> T accept(LogicalPlanVisitor<T> visitor) {
        return visitor.visit(this);
    }

    @Override
    public List<LogicalPlan> children() {
        return Collections.singletonList(child);
    }

    public LogicalPlan getChild() {
        return child;
    }

    public AggregateType getAggregateType() {
        return aggregateType;
    }

    public List<String> getGroupByLabels() {
        return groupByLabels;
    }

    public Duration getWindow() {
        return window;
    }

    @Override
    public void validate() throws ValidationException {
        child.validate();
        if (window != null && (window.isNegative() || window.isZero())) {
            throw new ValidationException("Window duration must be positive");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AggregateNode that = (AggregateNode) o;
        return Objects.equals(child, that.child) &&
               aggregateType == that.aggregateType &&
               Objects.equals(groupByLabels, that.groupByLabels) &&
               Objects.equals(window, that.window);
    }

    @Override
    public int hashCode() {
        return Objects.hash(child, aggregateType, groupByLabels, window);
    }

    @Override
    public String toString() {
        return "AggregateNode{" +
               "aggregateType=" + aggregateType +
               ", groupByLabels=" + groupByLabels +
               ", window=" + window +
               '}';
    }
}