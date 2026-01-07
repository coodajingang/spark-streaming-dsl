package com.sparkstreaming.dsl.rules.parser;

import com.sparkstreaming.dsl.rules.plan.ValidationException;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class DslRule {
    
    @JsonProperty("rule_id")
    private String ruleId;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("source")
    private SourceConfig source;
    
    @JsonProperty("pipeline")
    private List<DslOp> pipeline;
    
    @JsonProperty("enabled")
    private Boolean enabled = true;
    
    @JsonProperty("properties")
    private Map<String, Object> properties;

    public DslRule() {}

    public DslRule(String ruleId, SourceConfig source, List<DslOp> pipeline) {
        this.ruleId = ruleId;
        this.source = source;
        this.pipeline = pipeline;
    }

    public String getRuleId() {
        return ruleId;
    }

    public void setRuleId(String ruleId) {
        this.ruleId = ruleId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public SourceConfig getSource() {
        return source;
    }

    public void setSource(SourceConfig source) {
        this.source = source;
    }

    public List<DslOp> getPipeline() {
        return pipeline;
    }

    public void setPipeline(List<DslOp> pipeline) {
        this.pipeline = pipeline;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Map<String, Object> getProperties() {
        return properties;
    }

    public void setProperties(Map<String, Object> properties) {
        this.properties = properties;
    }

    public void validate() throws ValidationException {
        if (ruleId == null || ruleId.trim().isEmpty()) {
            throw new ValidationException("rule_id is required");
        }
        if (source == null) {
            throw new ValidationException("source is required");
        }
        if (pipeline == null || pipeline.isEmpty()) {
            throw new ValidationException("pipeline is required and cannot be empty");
        }
        
        source.validate();
        
        for (DslOp op : pipeline) {
            op.validate();
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DslRule dslRule = (DslRule) o;
        return Objects.equals(ruleId, dslRule.ruleId) &&
               Objects.equals(source, dslRule.source) &&
               Objects.equals(pipeline, dslRule.pipeline) &&
               Objects.equals(enabled, dslRule.enabled);
    }

    @Override
    public int hashCode() {
        return Objects.hash(ruleId, source, pipeline, enabled);
    }

    @Override
    public String toString() {
        return "DslRule{" +
               "ruleId='" + ruleId + '\'' +
               ", source=" + source +
               ", pipelineSize=" + (pipeline != null ? pipeline.size() : 0) +
               ", enabled=" + enabled +
               '}';
    }
}