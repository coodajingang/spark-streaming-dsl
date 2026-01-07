'use client';

import { useState, useCallback } from 'react';

interface FbaInput {
  sellingPrice: number;
  purchaseCost: number;
  amazonCommission: number;
  fbaFee: number;
  shippingCost: number;
  otherCost: number;
}

interface FbaResult {
  revenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  breakdown: {
    label: string;
    amount: number;
    type: 'income' | 'cost';
  }[];
}

export function FbaCalculator() {
  const [inputs, setInputs] = useState<FbaInput>({
    sellingPrice: 29.99,
    purchaseCost: 8.50,
    amazonCommission: 15,
    fbaFee: 3.45,
    shippingCost: 2.10,
    otherCost: 0.50
  });

  const [result, setResult] = useState<FbaResult | null>(null);
  const [error, setError] = useState('');
  const [currency] = useState('USD');

  const calculateProfit = useCallback(() => {
    setError('');
    
    // 输入验证
    if (inputs.sellingPrice <= 0) {
      setError('售价必须大于0');
      return;
    }
    if (inputs.purchaseCost < 0) {
      setError('采购成本不能为负数');
      return;
    }
    if (inputs.amazonCommission < 0 || inputs.amazonCommission > 100) {
      setError('亚马逊佣金比例必须在0-100%之间');
      return;
    }

    try {
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
        { label: '销售收入', amount: revenue, type: 'income' as const },
        { label: '采购成本', amount: -inputs.purchaseCost, type: 'cost' as const },
        { label: '亚马逊佣金', amount: -commissionAmount, type: 'cost' as const },
        { label: 'FBA 费用', amount: -inputs.fbaFee, type: 'cost' as const },
        { label: '运费', amount: -inputs.shippingCost, type: 'cost' as const },
        { label: '其他费用', amount: -inputs.otherCost, type: 'cost' as const }
      ];

      const calculationResult: FbaResult = {
        revenue,
        totalCost,
        profit,
        profitMargin,
        breakdown
      };

      setResult(calculationResult);
    } catch (err) {
      setError('计算失败，请检查输入数据');
    }
  }, [inputs]);

  const handleInputChange = (field: keyof FbaInput, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const presetCategories = [
    {
      name: '电子产品',
      commission: 8,
      fbaFee: 2.50
    },
    {
      name: '家居用品',
      commission: 15,
      fbaFee: 3.45
    },
    {
      name: '服装配饰',
      commission: 17,
      fbaFee: 3.95
    },
    {
      name: '书籍文具',
      commission: 15,
      fbaFee: 2.80
    },
    {
      name: '运动户外',
      commission: 12,
      fbaFee: 4.20
    }
  ];

  return (
    <div className="space-y-6">
      {/* 预设分类 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">常用分类预设</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {presetCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => setInputs(prev => ({
                ...prev,
                amazonCommission: category.commission,
                fbaFee: category.fbaFee
              }))}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900">{category.name}</div>
              <div className="text-xs text-gray-500">
                佣金 {category.commission}% | FBA ${category.fbaFee}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 输入表单 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">基本信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                销售价格 (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="29.99"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                采购成本 (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.purchaseCost}
                onChange={(e) => handleInputChange('purchaseCost', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="8.50"
              />
            </div>
          </div>
        </div>

        {/* 费用设置 */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">费用设置</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                亚马逊佣金 (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={inputs.amazonCommission}
                onChange={(e) => handleInputChange('amazonCommission', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="15"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                FBA 费用 (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.fbaFee}
                onChange={(e) => handleInputChange('fbaFee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="3.45"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                运费 (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.shippingCost}
                onChange={(e) => handleInputChange('shippingCost', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="2.10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                其他费用 (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.otherCost}
                onChange={(e) => handleInputChange('otherCost', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="0.50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 计算按钮 */}
      <div className="flex space-x-4">
        <button
          onClick={calculateProfit}
          className="btn-primary flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>计算利润</span>
        </button>
        <button
          onClick={() => setInputs({
            sellingPrice: 29.99,
            purchaseCost: 8.50,
            amazonCommission: 15,
            fbaFee: 3.45,
            shippingCost: 2.10,
            otherCost: 0.50
          })}
          className="btn-secondary"
        >
          重置示例
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* 计算结果 */}
      {result && (
        <div className="space-y-6">
          {/* 利润概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold text-green-900 mb-2">单件利润</h4>
              <div className={`text-3xl font-bold ${result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(result.profit)}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">利润率</h4>
              <div className={`text-3xl font-bold ${result.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {result.profitMargin.toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <h4 className="text-lg font-semibold text-purple-900 mb-2">销售收入</h4>
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(result.revenue)}
              </div>
            </div>
          </div>

          {/* 详细分解 */}
          <div className="bg-white rounded-lg border">
            <div className="border-b border-gray-200 px-6 py-4">
              <h4 className="font-semibold text-gray-900">利润分解</h4>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {result.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-gray-700">{item.label}</span>
                    <span className={`font-semibold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.type === 'income' ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 font-bold text-lg">
                  <span className="text-gray-900">净利润</span>
                  <span className={result.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(result.profit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 盈亏分析 */}
          <div className={`rounded-lg p-6 ${result.profit >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center mb-3">
              <svg className={`w-6 h-6 mr-3 ${result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h4 className={`text-lg font-semibold ${result.profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                盈亏分析
              </h4>
            </div>
            <div className={`text-sm ${result.profit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              {result.profit >= 0 ? (
                <p>恭喜！每件商品可获得 <strong>{formatCurrency(result.profit)}</strong> 的利润，利润率达到了 <strong>{result.profitMargin.toFixed(1)}%</strong>。</p>
              ) : (
                <p>注意！每件商品亏损 <strong>{formatCurrency(Math.abs(result.profit))}</strong>，建议调整售价或降低成本。</p>
              )}
              <p className="mt-2">
                总成本占比: {((result.totalCost / result.revenue) * 100).toFixed(1)}% | 
                利润率: {result.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* 批量销售预测 */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-4">批量销售预测</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {[10, 50, 100, 500].map((quantity) => (
                <div key={quantity} className="bg-white rounded-lg p-4">
                  <div className="text-sm text-blue-800 mb-1">销售 {quantity} 件</div>
                  <div className={`text-lg font-bold ${result.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(result.profit * quantity)}
                  </div>
                  <div className="text-xs text-gray-600">总利润</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 使用预设分类快速设置常见的亚马逊佣金和FBA费用</li>
          <li>• 亚马逊佣金因品类而异，一般在8%-45%之间</li>
          <li>• FBA费用根据商品尺寸和重量计算</li>
          <li>• 建议利润率保持在15%以上才具有竞争力</li>
          <li>• 考虑季节性因素和市场竞争动态调整定价</li>
        </ul>
      </div>
    </div>
  );
}