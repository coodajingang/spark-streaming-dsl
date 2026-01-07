package com.sparkstreaming.dsl.rules.plan;

import java.util.List;

public interface LogicalPlan {
    
    <T> T accept(LogicalPlanVisitor<T> visitor);
    
    List<LogicalPlan> children();
    
    default void validate() throws ValidationException {
        for (LogicalPlan child : children()) {
            child.validate();
        }
    }
}