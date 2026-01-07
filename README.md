# DSL Spark Streaming 实时规则引擎

## 概述

本项目实现了基于 Spark Streaming 2.3.1 的自定义 DSL（领域特定语言）实时规则引擎。通过 JSON 格式的 DSL 描述计算规则，将流式指标数据进行动态、可扩展的实时计算。

## 特性

- **DSL 驱动**: 使用 JSON DSL 定义计算规则，无需编写代码
- **实时计算**: 基于 Spark Streaming 实现低延迟流处理
- **状态管理**: 内置状态管理支持时间窗口和聚合操作
- **可扩展**: 支持自定义算子和处理逻辑
- **高性能**: 优化的执行计划和缓存策略

## 快速开始

### 环境要求

- Java 8+
- Apache Spark 2.3.1
- Maven 3.x

### 编译和运行

```bash
# 克隆项目
git clone <repository-url>
cd dsl-spark-streaming-rules-engine

# 编译
mvn clean package

# 运行示例
spark-submit \
  --class com.sparkstreaming.dsl.rules.Main \
  --master local[*] \
  target/dsl-spark-streaming-rules-engine-1.0.0-jar-with-dependencies.jar \
  --rules-config config/rules.json
```

## DSL 规则定义

### 基本结构

```json
{
  "rule_id": "规则唯一标识",
  "source": {
    "metric": "指标名称",
    "match": {"标签键": "标签值"}
  },
  "pipeline": [
    {"op": "算子名称", ...},
    {"op": "下一个算子", ...}
  ]
}
```

### 支持的算子

#### 1. enrich - 维度扩充

```json
{
  "op": "enrich",
  "type": "dimension",
  "on": "labels.ip",
  "add": "service_group"
}
```

#### 2. rate - 计算速率

```json
{
  "op": "rate",
  "window": "5m"
}
```

#### 3. groupby - 分组

```json
{
  "op": "groupby",
  "labels": ["service_group", "datacenter"]
}
```

#### 4. 聚合函数

```json
{
  "op": "sum"
}
```

```json
{
  "op": "avg"
}
```

```json
{
  "op": "max"
}
```

```json
{
  "op": "min"
}
```

### 完整示例

#### 示例 1: CPU 使用率按服务组平均

```json
{
  "rule_id": "cpu_avg_by_group",
  "source": {
    "metric": "cpu_usage",
    "match": {"env": "prod"}
  },
  "pipeline": [
    {"op": "enrich", "type": "dimension", "on": "labels.ip", "add": "service_group"},
    {"op": "rate", "window": "5m"},
    {"op": "groupby", "labels": ["service_group"]},
    {"op": "avg"}
  ]
}
```

#### 示例 2: 内存使用率总和

```json
{
  "rule_id": "memory_total",
  "source": {
    "metric": "memory_usage",
    "match": {"env": "prod"}
  },
  "pipeline": [
    {"op": "groupby", "labels": ["host"]},
    {"op": "sum"}
  ]
}
```

#### 示例 3: 网络流量变化率

```json
{
  "rule_id": "network_rate_change",
  "source": {
    "metric": "network_bytes",
    "match": {"interface": "eth0"}
  },
  "pipeline": [
    {"op": "rate", "window": "1m"},
    {"op": "delta", "window": "5m"}
  ]
}
```

## 架构设计

### 整体架构

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   DSL Rules     │────▶│  Logical Plan    │────▶│  Spark Streaming  │
│   (JSON)        │     │  (DAG)           │     │  Execution        │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

### 组件说明

1. **DSL Parser**: 解析 JSON 格式的规则定义
2. **Logical Plan Builder**: 将 DSL 转换为逻辑执行计划
3. **Streaming Executor**: 将逻辑计划转换为 Spark Streaming 操作
4. **State Manager**: 管理窗口状态和checkpoint

## 配置说明

### 应用配置

```yaml
# application.conf
spark {
  app {
    name = "DSL-Rules-Engine"
    master = "yarn"
  }
  
  streaming {
    batch-duration = 4 seconds
    checkpoint-dir = "hdfs:///user/spark/checkpoint"
  }
  
  kafka {
    brokers = "localhost:9092"
    topics = ["metrics"]
    group-id = "rules-engine-group"
  }
}

rules {
  config-path = "config/rules.json"
  reload-interval = 60 seconds
}
```

### 规则配置文件

规则配置文件包含多个规则定义：

```json
{
  "rules": [
    {
      "rule_id": "rule1",
      "source": {...},
      "pipeline": [...]
    },
    {
      "rule_id": "rule2",
      "source": {...},
      "pipeline": [...]
    }
  ]
}
```

## API 文档

### 核心类

#### MetricEvent

表示一个指标事件。

```java
public class MetricEvent {
    private long timestamp;           // 时间戳
    private String metric;            // 指标名称
    private Map<String, String> labels; // 标签
    private double value;             // 值
}
```

#### SeriesKey

表示一个时间序列的唯一标识。

```java
public class SeriesKey {
    private String metric;            // 指标名称
    private Map<String, String> labels; // 标签
}
```

#### LogicalPlan

逻辑计划的抽象接口。

```java
public interface LogicalPlan {
    <T> T accept(LogicalPlanVisitor<T> visitor);
}
```

### 算子实现

#### SourceNode

数据源节点，从输入流中读取指定指标的数据。

#### EnrichNode

维度扩充节点，通过lookup表为数据添加新的标签。

#### RateNode

计算速率，公式: `rate = (current_value - previous_value) / time_diff`。

#### AggregateNode

聚合节点，支持 sum、avg、max、min 等操作。

#### WindowStateNode

窗口状态节点，管理时间窗口内的状态数据。

## 性能优化

### 1. 共享数据源

所有规则共享同一个 Kafka DStream，避免重复消费：

```java
JavaDStream<MetricEvent> sharedStream = KafkaUtils.createDirectStream(...);
for (DslRule rule : rules) {
    LogicalPlan plan = builder.build(rule);
    JavaPairDStream<SeriesKey, Double> result = plan.accept(executor);
    // 处理结果
}
```

### 2. Map-side 预聚合

在 shuffle 之前进行局部聚合，减少网络传输：

```java
stream.mapToPair(...)
      .reduceByKey((v1, v2) -> v1 + v2) // map-side 预聚合
      .groupByKey()
      .mapValues(...);
```

### 3. Broadcast 维表

使用 broadcast 变量避免 join 操作：

```java
Broadcast<Map<String, String>> dimTable = sparkContext.broadcast(dimMap);
stream.mapPartitions(partition -> {
    Map<String, String> table = dimTable.value();
    // 使用维表进行enrich
});
```

### 4. 控制 Key 基数

- 合理设计 groupby 维度，避免 key 爆炸
- 使用采样监控 key 数量
- 设置 key 数量上限告警

### 5. 状态管理

- 使用 Spark Streaming 内置的 stateful 操作
- 配置合适的 checkpoint 间隔
- 定期清理过期状态

## 监控和运维

### 指标监控

监控以下关键指标：

1. **处理延迟**: 每个 batch 的处理时间
2. **输入速率**: 每秒输入的记录数
3. **调度延迟**: batch 在队列中的等待时间
4. **状态大小**: 状态存储的数据量
5. **Shuffle 数据量**: 网络传输的数据量

### 日志配置

```xml
<!-- log4j.properties -->
log4j.rootLogger=INFO, console
log4j.appender.console=org.apache.log4j.ConsoleAppender
log4j.appender.console.layout=org.apache.log4j.PatternLayout
log4j.appender.console.layout.ConversionPattern=%d{yy/MM/dd HH:mm:ss} %p %c{1}: %m%n

log4j.logger.com.sparkstreaming.dsl.rules=DEBUG
log4j.logger.org.apache.spark=WARN
```

### 故障排查

#### 问题 1: OOM (内存溢出)

**原因**: Key 基数过大或状态数据过多

**解决**:
- 减少 groupby 维度
- 缩短窗口时间
- 增加 executor 内存
- 优化状态清理策略

#### 问题 2: 处理延迟过高

**原因**: 数据量过大或算子复杂

**解决**:
- 增加并行度
- 优化算子逻辑
- 使用 map-side 预聚合
- 增加资源

#### 问题 3: 状态恢复失败

**原因**: Checkpoint 数据损坏

**解决**:
- 检查 HDFS 空间
- 验证 checkpoint 完整性
- 清理旧 checkpoint 重新启动

## 扩展开发

### 添加新算子

1. 创建算子类实现 `LogicalPlan` 接口
2. 在 `StreamingExecutor` 中实现访问方法
3. 在 `DslPlanBuilder` 中注册算子

```java
public class CustomOpNode implements LogicalPlan {
    private final LogicalPlan child;
    private final Map<String, Object> params;
    
    @Override
    public <T> T accept(LogicalPlanVisitor<T> visitor) {
        return visitor.visit(this);
    }
}
```

### 自定义数据源

实现 `SourceNode` 接口：

```java
public class CustomSourceNode implements LogicalPlan {
    @Override
    public <T> T accept(LogicalPlanVisitor<T> visitor) {
        return visitor.visit(this);
    }
}
```

## 最佳实践

### 1. 规则设计

- 保持规则简单，避免过深的pipeline
- 合理设置时间窗口大小
- 控制 groupby 的维度数量

### 2. 性能优化

- 优先使用 reduceByKeyAndWindow
- 合理使用 cache 和 persist
- 监控 shuffle 数据量

### 3. 运维管理

- 定期 review 规则性能
- 设置告警阈值
- 做好容量规划

### 4. 测试验证

- 单元测试覆盖核心算子
- 集成测试验证端到端流程
- 性能测试评估资源需求

## 许可证

[Apache License 2.0](LICENSE)

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交代码
4. 创建 Pull Request

## 联系方式

- 问题反馈: [Issues](https://github.com/your-repo/issues)
- 文档完善: [Wiki](https://github.com/your-repo/wiki)