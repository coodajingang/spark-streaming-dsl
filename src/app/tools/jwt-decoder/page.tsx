import { Metadata } from 'next';
import { JwtDecoder } from '../../../components/tools/JwtDecoder';

export const metadata: Metadata = {
  title: 'JWT Token 解码器 - 在线安全解码工具',
  description: '安全解码 JWT Token，查看 header 和 payload 内容。支持过期时间检测，浏览器本地处理。',
  keywords: 'jwt decoder, jwt token, json web token decoder',
  openGraph: {
    title: 'JWT Token 解码器',
    description: '安全解码 JWT Token，查看详细内容。',
    url: 'https://toolhub.example.com/tools/jwt-decoder',
    type: 'website',
  },
};

export default function JwtDecoderPage() {
  return (
    <JwtDecoder />
  );
}