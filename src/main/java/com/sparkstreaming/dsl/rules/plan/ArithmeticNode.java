package com.sparkstreaming.dsl.rules.plan;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

public class ArithmeticNode implements LogicalPlan {
    private final LogicalPlan child;
    private final ArithmeticOp operation;
    private final Object left;
    private final Object right;

    public enum ArithmeticOp {
        ADD, SUB, MUL, DIV
    }

    public ArithmeticNode(LogicalPlan child, ArithmeticOp operation, Object left, Object right) {
        this.child = Objects.requireNonNull(child, "Child plan cannot be null");
        this.operation = Objects.requireNonNull(operation, "Operation cannot be null");
        this.left = left;
        this.right = right;
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

    public ArithmeticOp getOperation() {
        return operation;
    }

    public Object getLeft() {
        return left;
    }

    public Object getRight() {
        return right;
    }

    @Override
    public void validate() throws ValidationException {
        child.validate();
        if (operation == null) {
            throw new ValidationException("Arithmetic operation cannot be null");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ArithmeticNode that = (ArithmeticNode) o;
        return Objects.equals(child, that.child) &&
               operation == that.operation &&
               Objects.equals(left, that.left) &&
               Objects.equals(right, that.right);
    }

    @Override
    public int hashCode() {
        return Objects.hash(child, operation, left, right);
    }

    @Override
    public String toString() {
        return "ArithmeticNode{" +
               "operation=" + operation +
               ", left=" + left +
               ", right=" + right +
               '}';
    }
}