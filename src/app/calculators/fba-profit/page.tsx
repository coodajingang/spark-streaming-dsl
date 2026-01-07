import { Metadata } from 'next';
import { FbaCalculator } from '../../../components/tools/FbaCalculator';

export const metadata: Metadata = {
  title: 'FBA 利润计算器 - Amazon 卖家专用工具',
  description: 'Amazon FBA 卖家专用利润计算工具。精确计算各项成本和利润率，帮助制定定价策略。',
  keywords: 'fba calculator, amazon fba, profit calculator',
  openGraph: {
    title: 'FBA 利润计算器',
    description: 'Amazon FBA 利润计算，精确成本分析。',
    url: 'https://toolhub.example.com/calculators/fba-profit',
    type: 'website',
  },
};

export default function FbaCalculatorPage() {
  return (
    <FbaCalculator />
  );
}