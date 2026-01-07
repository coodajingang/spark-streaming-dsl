package com.sparkstreaming.dsl.rules.plan;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class HistogramQuantileNode implements LogicalPlan {
    private final LogicalPlan child;
    private final double phi;
    private final List<String> buckets;

    public HistogramQuantileNode(LogicalPlan child, double phi, List<String> buckets) {
        this.child = Objects.requireNonNull(child, "Child plan cannot be null");
        this.phi = phi;
        this.buckets = buckets != null ? buckets : Collections.emptyList();
        
        if (phi <= 0 || phi > 1) {
            throw new IllegalArgumentException("phi must be between 0 and 1");
        }
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

    public double getPhi() {
        return phi;
    }

    public List<String> getBuckets() {
        return buckets;
    }

    @Override
    public void validate() throws ValidationException {
        child.validate();
        if (phi <= 0 || phi > 1) {
            throw new ValidationException("phi must be between 0 and 1");
        }
        if (buckets.isEmpty()) {
            throw new ValidationException("buckets cannot be empty for histogram_quantile operation");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HistogramQuantileNode that = (HistogramQuantileNode) o;
        return Double.compare(that.phi, phi) == 0 &&
               Objects.equals(child, that.child) &&
               Objects.equals(buckets, that.buckets);
    }

    @Override
    public int hashCode() {
        return Objects.hash(child, phi, buckets);
    }

    @Override
    public String toString() {
        return "HistogramQuantileNode{" +
               "phi=" + phi +
               ", buckets=" + buckets +
               '}';
    }
}