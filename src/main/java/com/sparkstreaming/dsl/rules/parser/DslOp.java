package com.sparkstreaming.dsl.rules.parser;

import com.sparkstreaming.dsl.rules.plan.ValidationException;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public class DslOp {
    
    @JsonProperty("op")
    private String operation;
    
    @JsonProperty("window")
    private String window;
    
    @JsonProperty("labels")
    private List<String> labels;
    
    @JsonProperty("type")
    private String type;
    
    @JsonProperty("on")
    private String on;
    
    @JsonProperty("add")
    private String add;
    
    @JsonProperty("value")
    private Object value;
    
    @JsonProperty("left")
    private Object left;
    
    @JsonProperty("right")
    private Object right;
    
    @JsonProperty("phi")
    private Double phi;
    
    @JsonProperty("buckets")
    private List<String> buckets;
    
    @JsonProperty("source")
    private Map<String, Object> source;
    
    @JsonProperty("thresholds")
    private Map<String, Object> thresholds;
    
    @JsonProperty("mode")
    private String mode;

    public DslOp() {}

    public DslOp(String operation) {
        this.operation = operation;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }

    public String getWindow() {
        return window;
    }

    public void setWindow(String window) {
        this.window = window;
    }

    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getOn() {
        return on;
    }

    public void setOn(String on) {
        this.on = on;
    }

    public String getAdd() {
        return add;
    }

    public void setAdd(String add) {
        this.add = add;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public Object getLeft() {
        return left;
    }

    public void setLeft(Object left) {
        this.left = left;
    }

    public Object getRight() {
        return right;
    }

    public void setRight(Object right) {
        this.right = right;
    }

    public Double getPhi() {
        return phi;
    }

    public void setPhi(Double phi) {
        this.phi = phi;
    }

    public List<String> getBuckets() {
        return buckets;
    }

    public void setBuckets(List<String> buckets) {
        this.buckets = buckets;
    }

    public Map<String, Object> getSource() {
        return source;
    }

    public void setSource(Map<String, Object> source) {
        this.source = source;
    }

    public Map<String, Object> getThresholds() {
        return thresholds;
    }

    public void setThresholds(Map<String, Object> thresholds) {
        this.thresholds = thresholds;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public void validate() throws ValidationException {
        if (operation == null || operation.trim().isEmpty()) {
            throw new ValidationException("op is required in pipeline");
        }
        
        // Validate based on operation type
        switch (operation.toLowerCase()) {
            case "enrich":
                if (type == null || type.trim().isEmpty()) {
                    throw new ValidationException("type is required for enrich operation");
                }
                if (on == null || on.trim().isEmpty()) {
                    throw new ValidationException("on is required for enrich operation");
                }
                if (add == null || add.trim().isEmpty()) {
                    throw new ValidationException("add is required for enrich operation");
                }
                break;
                
            case "rate":
            case "delta":
            case "increase":
            case "changes":
                if (window == null || window.trim().isEmpty()) {
                    throw new ValidationException("window is required for " + operation + " operation");
                }
                break;
                
            case "groupby":
                if (labels == null || labels.isEmpty()) {
                    throw new ValidationException("labels are required for groupby operation");
                }
                break;
                
            case "histogram_quantile":
                if (phi == null || phi <= 0 || phi > 1) {
                    throw new ValidationException("phi must be between 0 and 1 for histogram_quantile operation");
                }
                if (buckets == null || buckets.isEmpty()) {
                    throw new ValidationException("buckets are required for histogram_quantile operation");
                }
                break;
                
            case "add":
            case "sub":
            case "mul":
            case "div":
                // Arithmetic operations can have various configurations
                break;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DslOp dslOp = (DslOp) o;
        return Objects.equals(operation, dslOp.operation) &&
               Objects.equals(window, dslOp.window) &&
               Objects.equals(labels, dslOp.labels) &&
               Objects.equals(type, dslOp.type);
    }

    @Override
    public int hashCode() {
        return Objects.hash(operation, window, labels, type);
    }

    @Override
    public String toString() {
        return "DslOp{" +
               "operation='" + operation + '\'' +
               ", window='" + window + '\'' +
               ", labels=" + labels +
               ", type='" + type + '\'' +
               '}';
    }
}