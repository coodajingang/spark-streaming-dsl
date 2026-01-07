package com.sparkstreaming.dsl.rules.plan;

public interface LogicalPlanVisitor<T> {
    
    T visit(SourceNode node);
    
    T visit(EnrichNode node);
    
    T visit(RateNode node);
    
    T visit(DeltaNode node);
    
    T visit(IncreaseNode node);
    
    T visit(ChangesNode node);
    
    T visit(AggregateNode node);
    
    T visit(GroupByNode node);
    
    T visit(ArithmeticNode node);
    
    T visit(HistogramQuantileNode node);
}