// COGS 销售成本计算逻辑

/**
 * 计算销售成本 (COGS)
 * @param {object} inputs - 输入参数
 * @param {number} inputs.beginningInventory - 期初库存成本
 * @param {number} inputs.purchases - 期间采购成本
 * @param {number} inputs.endingInventory - 期末库存成本
 * @returns {object} 计算结果
 */
function calculateCogs(inputs) {
  // 输入验证
  if (inputs.beginningInventory < 0 || inputs.purchases < 0 || inputs.endingInventory < 0) {
    throw new Error('所有数值必须大于等于0');
  }

  try {
    // COGS 公式：COGS = 期初库存 + 采购成本 - 期末库存
    const cogs = inputs.beginningInventory + inputs.purchases - inputs.endingInventory;
    
    const breakdown = [
      { label: '期初库存', value: inputs.beginningInventory, type: 'add' },
      { label: '期间采购', value: inputs.purchases, type: 'add' },
      { label: '期末库存', value: inputs.endingInventory, type: 'subtract' }
    ];

    return {
      cogs,
      breakdown,
      formula: 'COGS = 期初库存 + 期间采购 - 期末库存'
    };
  } catch (error) {
    throw new Error('COGS 计算失败: ' + error.message);
  }
}

/**
 * 获取库存周转分析
 * @param {object} inputs - 输入参数
 * @returns {object} 库存分析
 */
function getInventoryAnalysis(inputs) {
  const result = calculateCogs(inputs);
  
  const analysis = {
    turnoverStatus: '',
    recommendations: [],
    metrics: {}
  };

  // 库存周转分析
  if (result.cogs > inputs.beginningInventory) {
    analysis.turnoverStatus = '库存周转较快，销售情况良好';
    analysis.recommendations.push('当前库存管理效率较高');
  } else if (result.cogs < inputs.beginningInventory) {
    analysis.turnoverStatus = '库存周转较慢，可能需要促销';
    analysis.recommendations.push('考虑促销活动加快库存周转');
  } else {
    analysis.turnoverStatus = '库存周转平稳';
    analysis.recommendations.push('维持当前库存水平');
  }

  // 库存变化分析
  const inventoryChange = inputs.endingInventory - inputs.beginningInventory;
  if (inventoryChange > 0) {
    analysis.metrics.inventoryChange = `库存增加 ${inventoryChange.toLocaleString()}`;
    analysis.recommendations.push('库存增加，注意资金占用情况');
  } else if (inventoryChange < 0) {
    analysis.metrics.inventoryChange = `库存减少 ${Math.abs(inventoryChange).toLocaleString()}`;
    analysis.recommendations.push('库存减少，需要考虑补货');
  } else {
    analysis.metrics.inventoryChange = '库存保持稳定';
  }

  // 财务比率
  const inventoryRatio = inputs.endingInventory / (inputs.beginningInventory + inputs.purchases);
  analysis.metrics.inventoryRatio = inventoryRatio;
  
  return analysis;
}

/**
 * 获取行业基准数据
 * @returns {object} 行业基准
 */
function getIndustryBenchmarks() {
  return {
    '零售业': {
      description: '计算毛利润的基础数据',
      typicalMargin: '20-40%',
      keyMetrics: ['库存周转率', '毛利率', '库存天数']
    },
    '制造业': {
      description: '包括原材料、人工、制造费用',
      typicalMargin: '10-30%',
      keyMetrics: ['材料成本率', '人工成本率', '制造费用率']
    },
    '电商': {
      description: '反映实际销售商品的成本',
      typicalMargin: '15-35%',
      keyMetrics: ['客单价', '转化率', '复购率']
    },
    '批发': {
      description: '大规模销售的库存管理',
      typicalMargin: '5-15%',
      keyMetrics: ['批量折扣', '物流成本', '账期管理']
    }
  };
}

module.exports = {
  calculateCogs,
  getInventoryAnalysis,
  getIndustryBenchmarks
};