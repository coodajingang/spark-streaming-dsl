package com.sparkstreaming.dsl.rules.parser;

import com.sparkstreaming.dsl.rules.plan.ValidationException;
import org.junit.Test;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;

import static org.junit.Assert.*;

public class DslRuleTest {
    
    @Test
    public void testValidRule() throws ValidationException {
        DslRule rule = new DslRule();
        rule.setRuleId("test-rule");
        rule.setEnabled(true);
        
        SourceConfig source = new SourceConfig("cpu_usage");
        source.setMatchLabels(Collections.singletonMap("env", "prod"));
        rule.setSource(source);
        
        DslOp op = new DslOp("avg");
        op.setWindow("5m");
        rule.setPipeline(Collections.singletonList(op));
        
        rule.validate();
        assertEquals("test-rule", rule.getRuleId());
        assertTrue(rule.getEnabled());
        assertNotNull(rule.getSource());
        assertEquals(1, rule.getPipeline().size());
    }
    
    @Test(expected = ValidationException.class)
    public void testInvalidRuleMissingId() throws ValidationException {
        DslRule rule = new DslRule();
        rule.validate();
    }
    
    @Test(expected = ValidationException.class)
    public void testInvalidRuleMissingSource() throws ValidationException {
        DslRule rule = new DslRule();
        rule.setRuleId("test-rule");
        rule.validate();
    }
    
    @Test(expected = ValidationException.class)
    public void testInvalidRuleEmptyPipeline() throws ValidationException {
        DslRule rule = new DslRule();
        rule.setRuleId("test-rule");
        rule.setSource(new SourceConfig("cpu_usage"));
        rule.setPipeline(Collections.emptyList());
        rule.validate();
    }
    
    @Test
    public void testEnrichOperationValidation() throws ValidationException {
        DslOp enrichOp = new DslOp("enrich");
        enrichOp.setType("dimension");
        enrichOp.setOn("labels.ip");
        enrichOp.setAdd("service_group");
        
        enrichOp.validate();
        assertEquals("enrich", enrichOp.getOperation());
        assertEquals("dimension", enrichOp.getType());
        assertEquals("labels.ip", enrichOp.getOn());
        assertEquals("service_group", enrichOp.getAdd());
    }
    
    @Test(expected = ValidationException.class)
    public void testInvalidEnrichOperation() throws ValidationException {
        DslOp enrichOp = new DslOp("enrich");
        // Missing required fields
        enrichOp.validate();
    }
    
    @Test
    public void testRateOperation() throws ValidationException {
        DslOp rateOp = new DslOp("rate");
        rateOp.setWindow("5m");
        rateOp.setType("rate");
        
        rateOp.validate();
        assertEquals("rate", rateOp.getOperation());
        assertEquals("5m", rateOp.getWindow());
    }
}