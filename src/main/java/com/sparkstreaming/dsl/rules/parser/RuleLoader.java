package com.sparkstreaming.dsl.rules.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sparkstreaming.dsl.rules.plan.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class RuleLoader {
    private static final Logger LOG = LoggerFactory.getLogger(RuleLoader.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    public static List<DslRule> loadRules(String filePath) throws IOException, ValidationException {
        LOG.info("Loading rules from: {}", filePath);
        
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IOException("Rules file not found: " + filePath);
        }
        
        try {
            // Try to parse as array first
            DslRule[] rulesArray = OBJECT_MAPPER.readValue(file, DslRule[].class);
            List<DslRule> rules = Arrays.asList(rulesArray);
            
            LOG.info("Loaded {} rules from {}", rules.size(), filePath);
            
            // Validate each rule
            for (DslRule rule : rules) {
                try {
                    rule.validate();
                    LOG.debug("Validated rule: {}", rule.getRuleId());
                } catch (ValidationException e) {
                    LOG.error("Validation failed for rule: {}", rule.getRuleId(), e);
                    throw e;
                }
            }
            
            return rules;
        } catch (IOException e) {
            LOG.error("Failed to parse rules file: {}", filePath, e);
            throw e;
        }
    }
    
    public static List<DslRule> loadRulesSafe(String filePath) {
        try {
            return loadRules(filePath);
        } catch (Exception e) {
            LOG.error("Failed to load rules from: {}", filePath, e);
            return Collections.emptyList();
        }
    }
}