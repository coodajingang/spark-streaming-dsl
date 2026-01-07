#!/bin/bash
# Integration Test Runner for DSL Rules Engine
# 
# This script runs the complete end-to-end integration test:
# 1. Starts metric data generator (pushes to port 9999)
# 2. Starts Spark Streaming job (reads from port 9999)
# 3. Validates results after 5 minutes
# 4. Reports success/failure

set -e

echo "========== DSL Rules Engine Integration Test =========="
echo "Test Scenario:"
echo "- 3 machines in service_group A (192.168.1.[1-3])"
echo "- CPU usage metrics every minute"
echo "- Rule: enrich by IP → group by service_group → 5m avg"
echo "========================================================\n"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Build the project
echo -e "${YELLOW}Step 1: Building project...${NC}"
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}Build successful!${NC}\n"

# Step 2: Create test rules file
echo -e "${YELLOW}Step 2: Creating test rules...${NC}"
cat > config/test-rules.json << 'EOF'
[
  {
    "rule_id": "cpu_avg_service_group_integration",
    "description": "CPU average by service group for integration test",
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
echo -e "${GREEN}Test rules created!${NC}\n"

# Step 3: Start data generator
echo -e "${YELLOW}Step 3: Starting data generator (port 9999)...${NC}"
java -cp target/dsl-spark-streaming-rules-engine-1.0.0-jar-with-dependencies.jar \
     com.sparkstreaming.dsl.rules.test.MetricDataGenerator &
GENERATOR_PID=$!
echo "Data generator started (PID: $GENERATOR_PID)"

# Wait for generator to be ready
sleep 3
echo -e "${GREEN}Data generator ready!${NC}\n"

# Step 4: Start Spark Streaming job
echo -e "${YELLOW}Step 4: Starting Spark Streaming job...${NC}"
java -cp target/dsl-spark-streaming-rules-engine-1.0.0-jar-with-dependencies.jar \
     com.sparkstreaming.dsl.rules.test.SparkStreamingTest \
     config/test-rules.json &
SPARK_PID=$!
echo "Spark job started (PID: $SPARK_PID)"

# Step 5: Wait for data collection
echo -e "${YELLOW}Step 5: Collecting data for 5 minutes...${NC}"
for i in {1..5}; do
    echo "Minute $i/5"
    sleep 60
done

echo -e "${GREEN}Data collection complete!${NC}\n"

# Step 6: Stop data generator
echo -e "${YELLOW}Step 6: Stopping data generator...${NC}"
kill $GENERATOR_PID 2>/dev/null || true
wait $GENERATOR_PID 2>/dev/null || true
echo -e "${GREEN}Data generator stopped${NC}\n"

# Step 7: Wait for final processing
echo -e "${YELLOW}Step 7: Waiting for final processing (30 seconds)...${NC}"
sleep 30

# Step 8: Run JUnit tests
echo -e "${YELLOW}Step 8: Running JUnit validation tests...${NC}"
mvn test -Dtest=EndToEndTest#testRuleParsing,EndToEndTest#testServiceGroupEnrichAndAggregate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Validation tests PASSED!${NC}\n"
else
    echo -e "${RED}Validation tests FAILED!${NC}\n"
fi

# Step 9: Stop Spark job
echo -e "${YELLOW}Step 9: Stopping Spark job...${NC}"
kill $SPARK_PID 2>/dev/null || true
wait $SPARK_PID 2>/dev/null || true
echo -e "${GREEN}Spark job stopped${NC}\n"

# Final report
echo "========== Test Summary =========="
echo "Duration: 5+ minutes"
echo "Machines: 3 (192.168.1.1-3)"
echo "Service Group: service_group_a"
echo "Rule: enrich → groupby → 5m avg"
echo "=================================="
echo -e "${GREEN}Integration test completed!${NC}"

exit 0