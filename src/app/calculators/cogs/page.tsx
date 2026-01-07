import { Metadata } from 'next';
import { CogsCalculator } from '../../../components/tools/CogsCalculator';

export const metadata: Metadata = {
  title: '销售成本计算器 - COGS 计算工具',
  description: 'COGS（销售成本）计算工具。帮助企业精确计算产品销售成本，优化库存管理。',
  keywords: 'cogs calculator, cost of goods sold, accounting tool',
  openGraph: {
    title: '销售成本计算器',
    description: '计算销售成本，优化库存管理。',
    url: 'https://toolhub.example.com/calculators/cogs',
    type: 'website',
  },
};

export default function CogsCalculatorPage() {
  return (
    <CogsCalculator />
  );
}