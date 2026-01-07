import { Metadata } from 'next';
import { JsonFormatter } from '../../../components/tools/JsonFormatter';

export const metadata: Metadata = {
  title: '免费在线 JSON 格式化器 - 即时美化和验证',
  description: '强大的 JSON 格式化、校验和转换工具。支持 TypeScript Interface 和 Go Struct 生成。无需注册，完全免费。',
  keywords: 'json formatter, json beautifier, json validator, json minify, free online tool',
  openGraph: {
    title: '免费 JSON 格式化器',
    description: '在线格式化、验证 JSON 数据。支持语法高亮和错误检测。',
    url: 'https://toolhub.example.com/tools/json-formatter',
    type: 'website',
  },
};

export default function JsonFormatterPage() {
  return (
    <JsonFormatter />
  );
}