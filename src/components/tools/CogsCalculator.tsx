'use client';

import { useState, useCallback } from 'react';

interface CogsInput {
  beginningInventory: number;
  purchases: number;
  endingInventory: number;
}

interface CogsResult {
  cogs: number;
  breakdown: {
    label: string;
    value: number;
    type: 'add' | 'subtract';
  }[];
  formula: string;
}

export function CogsCalculator() {
  const [inputs, setInputs] = useState<CogsInput>({
    beginningInventory: 15000,
    purchases: 25000,
    endingInventory: 12000
  });

  const [result, setResult] = useState<CogsResult | null>(null);
  const [error, setError] = useState('');

  const calculateCogs = useCallback(() => {
    setError('');
    
    // 输入验证
    if (inputs.beginningInventory < 0 || inputs.purchases < 0 || inputs.endingInventory < 0) {
      setError('所有数值必须大于等于0');
      return;
    }

    try {
      // COGS 公式：COGS = 期初库存 + 采购成本 - 期末库存
      const cogs = inputs.beginningInventory + inputs.purchases - inputs.endingInventory;
      
      const breakdown = [
        { label: '期初库存', value: inputs.beginningInventory, type: 'add' as const },
        { label: '期间采购', value: inputs.purchases, type: 'add' as const },
        { label: '期末库存', value: inputs.endingInventory, type: 'subtract' as const }
      ];

      const calculationResult: CogsResult = {
        cogs,
        breakdown,
        formula: 'COGS = 期初库存 + 期间采购 - 期末库存'
      };

      setResult(calculationResult);
    } catch (err) {
      setError('计算失败，请检查输入数据');
    }
  }, [inputs]);

  const handleInputChange = (field: keyof CogsInput, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const presetScenarios = [
    { name: '正常库存', values: { beginningInventory: 15000, purchases: 25000, endingInventory: 12000 } },
    { name: '库存增加', values: { beginningInventory: 10000, purchases: 30000, endingInventory: 18000 } },
    { name: '库存减少', values: { beginningInventory: 20000, purchases: 20000, endingInventory: 8000 } },
    { name: '零库存', values: { beginningInventory: 0, purchases: 10000, endingInventory: 0 } }
  ];

  return (
    <div className="space-y-6">
      {/* 预设场景 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">常用场景</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {presetScenarios.map((scenario) => (
            <button
              key={scenario.name}
              onClick={() => setInputs(scenario.values)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900">{scenario.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 输入表单 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">输入数据</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期初库存成本 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.beginningInventory}
                onChange={(e) => handleInputChange('beginningInventory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="15000"
              />
              <p className="text-xs text-gray-500 mt-1">年初或期初的库存价值</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期间采购成本 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.purchases}
                onChange={(e) => handleInputChange('purchases', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="25000"
              />
              <p className="text-xs text-gray-500 mt-1">该期间的采购总额</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期末库存成本 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputs.endingInventory}
                onChange={(e) => handleInputChange('endingInventory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="12000"
              />
              <p className="text-xs text-gray-500 mt-1">年末或期末的库存价值</p>
            </div>
          </div>
        </div>

        {/* 计算说明 */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">计算说明</h3>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">COGS 公式</h4>
              <div className="bg-white rounded p-3 font-mono text-sm">
                COGS = 期初库存 + 期间采购 - 期末库存
              </div>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">含义解释</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 期初库存：年初/期初的库存价值</li>
                <li>• 期间采购：该期间新采购的库存</li>
                <li>• 期末库存：年末/期末的库存价值</li>
                <li>• COGS：销售成本，反映实际销售掉的成本</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col justify-center space-y-4">
          <button
            onClick={calculateCogs}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>计算 COGS</span>
          </button>
          <button
            onClick={() => setInputs({
              beginningInventory: 15000,
              purchases: 25000,
              endingInventory: 12000
            })}
            className="btn-secondary"
          >
            重置示例
          </button>
        </div>
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
          {/* COGS 总额 */}
          <div className="bg-white rounded-lg border p-6 text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">销售成本 (COGS)</h4>
            <div className="text-4xl font-bold text-green-600 mb-2">
              {formatCurrency(result.cogs)}
            </div>
            <p className="text-sm text-gray-600">该期间销售掉的商品成本</p>
          </div>

          {/* 详细分解 */}
          <div className="bg-white rounded-lg border">
            <div className="border-b border-gray-200 px-6 py-4">
              <h4 className="font-semibold text-gray-900">计算分解</h4>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {result.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span className="text-gray-700">
                      {item.type === 'add' ? '+' : '-'} {item.label}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="text-gray-900">销售成本 (COGS)</span>
                    <span className="text-green-600">
                      {formatCurrency(result.cogs)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 财务分析 */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-900 mb-3">财务分析</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-800">库存周转情况:</span>
                <div className="mt-1">
                  {result.cogs > inputs.beginningInventory ? (
                    <span className="text-green-700">库存周转较快，销售情况良好</span>
                  ) : (
                    <span className="text-yellow-700">库存周转较慢，可能需要促销</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-green-800">库存变化:</span>
                <div className="mt-1">
                  {inputs.endingInventory > inputs.beginningInventory ? (
                    <span className="text-blue-700">库存增加 ({formatCurrency(inputs.endingInventory - inputs.beginningInventory)})</span>
                  ) : inputs.endingInventory < inputs.beginningInventory ? (
                    <span className="text-orange-700">库存减少 ({formatCurrency(inputs.beginningInventory - inputs.endingInventory)})</span>
                  ) : (
                    <span className="text-gray-700">库存保持稳定</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 行业基准 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">行业应用</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• <strong>零售业</strong>：计算毛利润的基础数据</p>
              <p>• <strong>制造业</strong>：包括原材料、人工、制造费用</p>
              <p>• <strong>电商</strong>：反映实际销售商品的成本</p>
              <p>• <strong>库存管理</strong>：评估库存效率和资金占用</p>
            </div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">使用说明</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• COGS 是计算毛利润的关键指标，用于财务报表分析</li>
          <li>• 期初和期末库存价值应基于成本计价原则</li>
          <li>• 采购成本应包括所有相关费用（运费、关税等）</li>
          <li>• 适用于月度、季度或年度的财务分析</li>
          <li>• 结合毛利率分析可评估企业经营效率</li>
        </ul>
      </div>
    </div>
  );
}