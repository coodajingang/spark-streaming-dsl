package com.sparkstreaming.dsl.rules.plan;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class RateNode implements LogicalPlan {
    private final LogicalPlan child;
    private final Duration window;
    private final RateType rateType;

    public enum RateType {
        RATE,      // 平均速率
        IRATE      // 瞬时速率
    }

    public RateNode(LogicalPlan child, Duration window, RateType rateType) {
        this.child = Objects.requireNonNull(child, "Child plan cannot be null");
        this.window = Objects.requireNonNull(window, "Window cannot be null");
        this.rateType = Objects.requireNonNull(rateType, "Rate type cannot be null");
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

    public Duration getWindow() {
        return window;
    }

    public RateType getRateType() {
        return rateType;
    }

    @Override
    public void validate() throws ValidationException {
        child.validate();
        if (window.isNegative() || window.isZero()) {
            throw new ValidationException("Window duration must be positive");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RateNode rateNode = (RateNode) o;
        return Objects.equals(child, rateNode.child) &&
               Objects.equals(window, rateNode.window) &&
               rateType == rateNode.rateType;
    }

    @Override
    public int hashCode() {
        return Objects.hash(child, window, rateType);
    }

    @Override
    public String toString() {
        return "RateNode{" +
               "window=" + window +
               ", rateType=" + rateType +
               '}';
    }
}