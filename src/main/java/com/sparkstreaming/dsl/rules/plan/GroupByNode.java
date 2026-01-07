package com.sparkstreaming.dsl.rules.plan;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class GroupByNode implements LogicalPlan {
    private final LogicalPlan child;
    private final List<String> labels;
    private final GroupByMode mode;

    public enum GroupByMode {
        KEEP_OTHERS,  // 保留其他标签
        DROP_OTHERS   // 删除其他标签
    }

    public GroupByNode(LogicalPlan child, List<String> labels, GroupByMode mode) {
        this.child = Objects.requireNonNull(child, "Child plan cannot be null");
        this.labels = labels != null ? labels : Collections.emptyList();
        this.mode = mode != null ? mode : GroupByMode.KEEP_OTHERS;
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

    public List<String> getLabels() {
        return labels;
    }

    public GroupByMode getMode() {
        return mode;
    }

    @Override
    public void validate() throws ValidationException {
        child.validate();
        if (labels.isEmpty()) {
            throw new ValidationException("At least one label is required for groupby operation");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GroupByNode that = (GroupByNode) o;
        return Objects.equals(child, that.child) &&
               Objects.equals(labels, that.labels) &&
               mode == that.mode;
    }

    @Override
    public int hashCode() {
        return Objects.hash(child, labels, mode);
    }

    @Override
    public String toString() {
        return "GroupByNode{" +
               "labels=" + labels +
               ", mode=" + mode +
               '}';
    }
}