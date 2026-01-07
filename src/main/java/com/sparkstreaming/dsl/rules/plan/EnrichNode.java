package com.sparkstreaming.dsl.rules.plan;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public class EnrichNode implements LogicalPlan {
    private final LogicalPlan child;
    private final String sourceField;
    private final String targetField;
    private final EnrichType enrichType;
    private final Map<String, Object> config;

    public enum EnrichType {
        DIMENSION,
        THRESHOLD
    }

    public EnrichNode(LogicalPlan child, String sourceField, String targetField, 
                      EnrichType enrichType, Map<String, Object> config) {
        this.child = Objects.requireNonNull(child, "Child plan cannot be null");
        this.sourceField = Objects.requireNonNull(sourceField, "Source field cannot be null");
        this.targetField = Objects.requireNonNull(targetField, "Target field cannot be null");
        this.enrichType = Objects.requireNonNull(enrichType, "Enrich type cannot be null");
        this.config = config != null ? config : Collections.emptyMap();
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

    public String getSourceField() {
        return sourceField;
    }

    public String getTargetField() {
        return targetField;
    }

    public EnrichType getEnrichType() {
        return enrichType;
    }

    public Map<String, Object> getConfig() {
        return config;
    }

    @Override
    public void validate() throws ValidationException {
        child.validate();
        if (sourceField.trim().isEmpty()) {
            throw new ValidationException("Source field cannot be empty");
        }
        if (targetField.trim().isEmpty()) {
            throw new ValidationException("Target field cannot be empty");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        EnrichNode that = (EnrichNode) o;
        return Objects.equals(child, that.child) &&
               Objects.equals(sourceField, that.sourceField) &&
               Objects.equals(targetField, that.targetField) &&
               enrichType == that.enrichType &&
               Objects.equals(config, that.config);
    }

    @Override
    public int hashCode() {
        return Objects.hash(child, sourceField, targetField, enrichType, config);
    }

    @Override
    public String toString() {
        return "EnrichNode{" +
               "sourceField='" + sourceField + '\'' +
               ", targetField='" + targetField + '\'' +
               ", enrichType=" + enrichType +
               ", config=" + config +
               '}';
    }
}