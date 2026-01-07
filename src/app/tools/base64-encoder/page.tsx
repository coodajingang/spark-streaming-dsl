import { Metadata } from 'next';
import { Base64Encoder } from '../../../components/tools/Base64Encoder';

export const metadata: Metadata = {
  title: 'Base64 编解码器 - 在线编码解码工具',
  description: '文本与 Base64 格式互转工具。支持中文和特殊字符编码，实时转换。',
  keywords: 'base64 encoder, base64 decoder, data encoding tool',
  openGraph: {
    title: 'Base64 编解码器',
    description: '文本与 Base64 格式互转，支持特殊字符。',
    url: 'https://toolhub.example.com/tools/base64-encoder',
    type: 'website',
  },
};

export default function Base64EncoderPage() {
  return (
    <Base64Encoder />
  );
}