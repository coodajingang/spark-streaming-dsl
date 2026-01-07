import { Metadata } from 'next';
import { UrlEncoder } from '../../../components/tools/UrlEncoder';

export const metadata: Metadata = {
  title: 'URL 编解码器 - 在线 URL 处理工具',
  description: 'URL 编码与解码工具。支持查询参数和特殊字符处理，实时转换。',
  keywords: 'url encoder, url decoder, url encoding tool',
  openGraph: {
    title: 'URL 编解码器',
    description: 'URL 编码与解码，支持查询参数处理。',
    url: 'https://toolhub.example.com/tools/url-encoder',
    type: 'website',
  },
};

export default function UrlEncoderPage() {
  return (
    <UrlEncoder />
  );
}