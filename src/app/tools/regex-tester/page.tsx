import { Metadata } from 'next';
import { RegexTester } from '../../../components/tools/RegexTester';

export const metadata: Metadata = {
  title: '正则表达式测试器 - 在线匹配测试工具',
  description: '强大的正则表达式测试工具。支持多种编程语言语法，实时匹配高亮显示。',
  keywords: 'regex tester, regular expression, pattern matching tool',
  openGraph: {
    title: '正则表达式测试器',
    description: '测试正则表达式匹配结果，实时高亮显示。',
    url: 'https://toolhub.example.com/tools/regex-tester',
    type: 'website',
  },
};

export default function RegexTesterPage() {
  return (
    <RegexTester />
  );
}