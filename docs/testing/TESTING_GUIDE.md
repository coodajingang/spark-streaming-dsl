# DSL Rules Engine - Testing Guide

## Overview

This document describes how to run the integration tests for the DSL Spark Streaming Rules Engine. The tests validate the complete flow from data ingestion through rule processing to result output.

## Test Architecture

### Components

1. **MetricDataGenerator** - Simulates metric production
   - Pushes metrics to socket port 9999
   - 3 machines in service_group A (IPs: 192.168.1.1, 192.168.1.2, 192.168.1.3)
   - CPU usage metrics every minute

2. **SparkStreamingProcessor** - Processes metrics
   - Reads from port 9999
   - Enriches data (adds service_group from IP)
   - Groups by service_group
   - Calculates 5-minute average

3. **Validators** - Verify correctness
   - Check service_group_a exists in results
   - Validate CPU values are in range [0, 100]
   - Verify aggregation logic

## Quick Start

```bash
# Make test script executable
chmod +x test-integration.sh

# Run complete integration test
./test-integration.sh
```

## Manual Test Execution

### Step 1: Build the project

```bash
mvn clean package -DskipTests
```

### Step 2: Start data generator

```bash
java -cp target/dsl-spark-streaming-rules-engine-1.0.0-jar-with-dependencies.jar \
     com.sparkstreaming.dsl.rules.test.MetricDataGenerator
```

The generator will:
- Listen on port 9999 for connections
- Generate CPU usage metrics every minute
- Simulate 3 machines in service_group A
- Run for 30 minutes or until stopped

### Step 3: Start Spark Streaming job (in another terminal)

```bash
# Create test rules file
cat > config/test-rules.json << 'EOF'
[
  {
    "rule_id": "cpu_avg_service_group_test",
    "description": "CPU average by service group",
    "source": {
      "metric": "cpu_usage", 
      "match": {"env": "prod"}
    },
    "pipeline": [
      {
        "op": "enrich",
        "type": "dimension",
        "on": "labels.ip",
        "add": "service_group"
      },
      {
        "op": "groupby",
        "labels": ["service_group"],
        "mode": "keep_others"
      },
      {
        "op": "avg",
        "window": "5m"
      }
    ],
    "enabled": true
  }
]
EOF

# Run Spark job
java -cp target/dsl-spark-streaming-rules-engine-1.0.0-jar-with-dependencies.jar \
     com.sparkstreaming.dsl.rules.test.SparkStreamingTest \
     config/test-rules.json
```

### Step 4: Observe output

Watch the console output for:
- Received events count
- Enriched metrics with service_group
- Aggregated results
- Validation messages

Expected output:
```
Rule cpu_avg_service_group_test produced X results
Service Group: service_group_a, Avg CPU: 45.23%
```

### Step 5: Stop data generator

Press Ctrl+C in the data generator terminal or wait for 30-minute timeout.

### Step 6: Run unit tests

```bash
mvn test -Dtest=EndToEndTest
```

## Test Scenarios

### Scenario 1: Service Group Enrichment

**Goal**: Verify that the enrich operation correctly adds service_group based on IP

**Setup**:
```json
{
  "op": "enrich",
  "type": "dimension",
  "on": "labels.ip",
  "add": "service_group"
}
```

**Validation**:
- Metrics from IP 192.168.1.X should have service_group="service_group_a"
- All three IPs should map to the same service_group

### Scenario 2: Group By Aggregation

**Goal**: Verify that grouping by service_group works correctly

**Setup**:
```json
{
  "op": "groupby",
  "labels": ["service_group"],
  "mode": "keep_others"
}
```

**Validation**:
- All machines in service_group_a should be grouped together
- Result count should be 1 per window (one service_group)

### Scenario 3: 5-Minute Window Average

**Goal**: Verify that the 5-minute average calculation is correct

**Setup**:
```json
{
  "op": "avg",
  "window": "5m"
}
```

**Validation**:
- Average should be within [0, 100] (CPU percentage)
- Should have at least 3 values (one per machine) per window
- Average should be reasonable (20-80% based on generator)

### Scenario 4: Complete Pipeline

**Goal**: Verify end-to-end pipeline works correctly

**Pipeline**: enrich → groupby → avg

**Validation**:
- Rule parses correctly
- Logical plan builds correctly
- Execution produces valid results
- Results contain expected service_group_a

## Expected Results

After running for 5 minutes with data generator:

- **Events generated**: ~15 (3 machines × 5 minutes)
- **Events processed**: ~15 (all should be processed)
- **Result windows**: 1 (5-minute window)
- **Service groups**: 1 (service_group_a)
- **CPU range**: 20-80% (as generated)
- **Average CPU**: ~50% (expected, since generator uses 20-80% range)

## Troubleshooting

### Port 9999 already in use

Error: `Address already in use: 9999`

Solution: 
```bash
# Find and kill the process using port 9999
lsof -i :9999 | awk 'NR!=1 {print $2}' | xargs kill -9
```

### Spark cannot connect to socket

Error: `Connection refused`

Solution:
- Ensure data generator is running first
- Check firewall settings
- Verify port 9999 is accessible

### Build failures

Error: `Compilation failure`

Solution:
```bash
# Clean and rebuild
mvn clean compile package -DskipTests
```

### Test timeouts

If tests hang:
- Increase timeout in test annotations
- Check network connectivity
- Verify resources (CPU, memory) are available

## Performance Benchmarks

Expected performance on a standard development machine:

- **Data generation rate**: 3 metrics/second (3 machines)
- **Processing latency**: < 1 second per batch
- **Memory usage**: < 1GB for test
- **CPU usage**: < 50% of one core

## Success Criteria

Test is considered successful if:

1. ✅ Data generator starts and runs without errors
2. ✅ Spark Streaming job connects and reads data
3. ✅ Enrich operation adds service_group correctly
4. ✅ Group by operation aggregates correctly
5. ✅ Average calculation produces valid values
6. ✅ Results contain service_group_a
7. ✅ CPU values are in range [0, 100]
8. ✅ At least 10 metrics are processed

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Run Integration Tests
  run: |
    chmod +x test-integration.sh
    ./test-integration.sh
```

```yaml
# Jenkins example
pipeline {
    stage('Integration Test') {
        steps {
            sh 'chmod +x test-integration.sh'
            sh './test-integration.sh'
        }
    }
}
```

## Next Steps

After successful test:

1. **Deploy to production** with real Kafka source
2. **Add more rules** for different metrics
3. **Configure monitoring** for the rules engine
4. **Set up alerting** based on rule results
5. **Scale out** to handle more metrics

## Support

For issues or questions:
- Check logs in target/test-logs/
- Review console output for error messages
- Verify all components are running
- Check port availability and network connectivity