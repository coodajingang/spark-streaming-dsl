import { ReactNode } from 'react';
import Link from 'next/link';
import { getToolById, getRelatedTools } from '../../lib/tools';

interface ToolLayoutProps {
  children: ReactNode;
  params: {
    toolId: string;
  };
}

export default function ToolLayout({ children, params }: ToolLayoutProps) {
  const tool = getToolById(params.toolId);
  
  if (!tool) {
    return <div>Tool not found</div>;
  }

  const relatedTools = getRelatedTools(tool.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">
            首页
          </Link>
          <span>/</span>
          <Link 
            href={`/${tool.category === 'developer' ? 'tools' : 
                  tool.category === 'calculator' ? 'calculators' :
                  tool.category === 'seo' ? 'seo-tools' :
                  tool.category === 'converter' ? 'converters' : 'counters'}`} 
            className="hover:text-blue-600"
          >
            {tool.category === 'developer' && '开发者工具'}
            {tool.category === 'calculator' && '计算器'}
            {tool.category === 'seo' && 'SEO工具'}
            {tool.category === 'converter' && '转换器'}
            {tool.category === 'counter' && '计数器'}
          </Link>
          <span>/</span>
          <span className="text-gray-900">{tool.name}</span>
        </nav>

        {/* 工具内容 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主要内容区 */}
          <div className="lg:col-span-3">
            <div className="card">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  {tool.name}
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {tool.description}
                </p>
              </div>
              
              {children}
            </div>
          </div>

          {/* 侧边栏 - 相关工具 */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                相关工具
              </h3>
              <div className="space-y-3">
                {relatedTools.map((relatedTool) => (
                  <Link
                    key={relatedTool.id}
                    href={relatedTool.path}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1">
                      {relatedTool.name}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {relatedTool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}