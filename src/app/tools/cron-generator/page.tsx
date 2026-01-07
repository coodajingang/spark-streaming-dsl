import { Metadata } from 'next';
import { CronGenerator } from '../../../components/tools/CronGenerator';

export const metadata: Metadata = {
  title: 'Cron 表达式生成器 - 可视化任务调度器',
  description: '可视化创建和解析 Cron 表达式。支持中英文描述，自动生成执行时间。完全免费使用。',
  keywords: 'cron expression generator, task scheduler, job scheduler, cron',
  openGraph: {
    title: 'Cron 表达式生成器',
    description: '可视化创建 Cron 表达式，支持执行时间预览。',
    url: 'https://toolhub.example.com/tools/cron-generator',
    type: 'website',
  },
};

export default function CronGeneratorPage() {
  return (
    <CronGenerator />
  );
}