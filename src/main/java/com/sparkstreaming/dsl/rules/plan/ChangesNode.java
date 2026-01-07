package com.sparkstreaming.dsl.rules.plan;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class ChangesNode implements LogicalPlan {
    private final LogicalPlan child;
    private final Duration window;

    public ChangesNode(LogicalPlan child, Duration window) {
        this.child = Objects.requireNonNull(child, "Child plan cannot be null");
        this.window = Objects.requireNonNull(window, "Window cannot be null");
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
        ChangesNode that = (ChangesNode) o;
        return Objects.equals(child, that.child) &&
               Objects.equals(window, that.window);
    }

    @Override
    public int hashCode() {
        return Objects.hash(child, window);
    }

    @Override
    public String toString() {
        return "ChangesNode{" +
               "window=" + window +
               '}';
    }
}