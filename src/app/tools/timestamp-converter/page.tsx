import { Metadata } from 'next';
import { TimestampConverter } from '../../../components/tools/TimestampConverter';

export const metadata: Metadata = {
  title: '时间戳转换器 - Unix 时间戳互转工具',
  description: 'Unix 时间戳与日期时间互转工具。支持秒级和毫秒级时间戳，实时转换。',
  keywords: 'timestamp converter, unix timestamp, datetime converter',
  openGraph: {
    title: '时间戳转换器',
    description: 'Unix 时间戳与日期时间互转。',
    url: 'https://toolhub.example.com/tools/timestamp-converter',
    type: 'website',
  },
};

export default function TimestampConverterPage() {
  return (
    <TimestampConverter />
  );
}