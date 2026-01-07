import { Metadata } from 'next';
import { MarkdownToHtml } from '../../../components/tools/MarkdownToHtml';

export const metadata: Metadata = {
  title: 'Markdown 转 HTML - 在线 Markdown 转换器',
  description: 'Markdown 文档转 HTML 工具。支持实时预览和多种 Markdown 语法，完全免费。',
  keywords: 'markdown to html, markdown converter, html generator',
  openGraph: {
    title: 'Markdown 转 HTML',
    description: 'Markdown 文档转 HTML，支持实时预览。',
    url: 'https://toolhub.example.com/tools/markdown-to-html',
    type: 'website',
  },
};

export default function MarkdownToHtmlPage() {
  return (
    <MarkdownToHtml />
  );
}