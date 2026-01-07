// FBA 利润计算逻辑

/**
 * 计算 FBA 利润
 * @param {object} inputs - 输入参数
 * @param {number} inputs.sellingPrice - 销售价格
 * @param {number} inputs.purchaseCost - 采购成本
 * @param {number} inputs.amazonCommission - 亚马逊佣金百分比
 * @param {number} inputs.fbaFee - FBA 费用
 * @param {number} inputs.shippingCost - 运费
 * @param {number} inputs.otherCost - 其他费用
 * @returns {object} 计算结果
 */
function calculateFbaProfit(inputs) {
  // 输入验证
  if (inputs.sellingPrice <= 0) {
    throw new Error('售价必须大于0');
  }
  
  if (inputs.purchaseCost < 0) {
    throw new Error('采购成本不能为负数');
  }
  
  if (inputs.amazonCommission < 0 || inputs.amazonCommission > 100) {
    throw new Error('亚马逊佣金比例必须在0-100%之间');
  }

  if (inputs.fbaFee < 0 || inputs.shippingCost < 0 || inputs.otherCost < 0) {
    throw new Error('所有费用不能为负数');
  }

  // 计算总收入
  const revenue = inputs.sellingPrice;
  
  // 计算各项成本
  const commissionAmount = revenue * (inputs.amazonCommission / 100);
  const totalCost = inputs.purchaseCost + commissionAmount + inputs.fbaFee + inputs.shippingCost + inputs.otherCost;
  
  // 计算利润
  const profit = revenue - totalCost;
  
  // 计算利润率
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const breakdown = [
    { label: '销售收入', amount: revenue, type: 'income' },
    { label: '采购成本', amount: -inputs.purchaseCost, type: 'cost' },
    { label: '亚马逊佣金', amount: -commissionAmount, type: 'cost' },
    { label: 'FBA 费用', amount: -inputs.fbaFee, type: 'cost' },
    { label: '运费', amount: -inputs.shippingCost, type: 'cost' },
    { label: '其他费用', amount: -inputs.otherCost, type: 'cost' }
  ];

  return {
    revenue,
    totalCost,
    profit,
    profitMargin,
    breakdown
  };
}

/**
 * 计算批量销售预测
 * @param {object} inputs - 输入参数
 * @param {number[]} quantities - 销售数量数组
 * @returns {object} 批量销售预测结果
 */
function calculateBulkSales(inputs, quantities = [10, 50, 100, 500]) {
  const profit = calculateFbaProfit(inputs);
  const predictions = quantities.map(quantity => ({
    quantity,
    totalRevenue: profit.revenue * quantity,
    totalProfit: profit.profit * quantity,
    totalMargin: profit.profitMargin
  }));

  return {
    perUnit: profit,
    bulk: predictions
  };
}

/**
 * 获取利润分析
 * @param {object} profitResult - 利润计算结果
 * @returns {object} 利润分析
 */
function getProfitAnalysis(profitResult) {
  const analysis = {
    isProfitable: profitResult.profit > 0,
    profitLevel: '',
    recommendations: []
  };

  if (profitResult.profitMargin > 30) {
    analysis.profitLevel = '优秀';
    analysis.recommendations.push('利润率超过30%，具有很强的竞争力');
  } else if (profitResult.profitMargin > 15) {
    analysis.profitLevel = '良好';
    analysis.recommendations.push('利润率适中，可以考虑进一步优化成本');
  } else if (profitResult.profitMargin > 0) {
    analysis.profitLevel = '一般';
    analysis.recommendations.push('利润率偏低，建议优化定价或降低成本');
  } else {
    analysis.profitLevel = '亏损';
    analysis.recommendations.push('当前定价导致亏损，需要重新评估定价策略');
  }

  // 成本结构分析
  const totalCost = Math.abs(profitResult.breakdown.reduce((sum, item) => {
    return sum + (item.type === 'cost' ? Math.abs(item.amount) : 0);
  }, 0));

  const commissionPercentage = (Math.abs(profitResult.breakdown.find(item => item.label === '亚马逊佣金').amount) / totalCost * 100);
  
  if (commissionPercentage > 40) {
    analysis.recommendations.push('亚马逊佣金占比过高，考虑调整品类或寻找替代平台');
  }

  return analysis;
}

/**
 * 获取预设品类配置
 * @returns {object} 预设配置
 */
function getPresetCategories() {
  return {
    '电子产品': { commission: 8, fbaFee: 2.50 },
    '家居用品': { commission: 15, fbaFee: 3.45 },
    '服装配饰': { commission: 17, fbaFee: 3.95 },
    '书籍文具': { commission: 15, fbaFee: 2.80 },
    '运动户外': { commission: 12, fbaFee: 4.20 }
  };
}

module.exports = {
  calculateFbaProfit,
  calculateBulkSales,
  getProfitAnalysis,
  getPresetCategories
};