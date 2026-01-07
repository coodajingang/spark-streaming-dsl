import { Metadata } from 'next';
import { ColorConverter } from '../../../components/tools/ColorConverter';

export const metadata: Metadata = {
  title: '颜色代码转换器 - HEX RGB HSL 互转',
  description: 'HEX、RGB、HSL 颜色格式互转工具。支持颜色预览和取色器，前端设计师必备。',
  keywords: 'color converter, hex rgb, color code converter',
  openGraph: {
    title: '颜色代码转换器',
    description: 'HEX、RGB、HSL 颜色格式互转，支持预览。',
    url: 'https://toolhub.example.com/tools/color-converter',
    type: 'website',
  },
};

export default function ColorConverterPage() {
  return (
    <ColorConverter />
  );
}