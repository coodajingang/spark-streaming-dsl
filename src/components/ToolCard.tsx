import Link from 'next/link';
import { Tool } from '../types/tools';

interface ToolCardProps {
  tool: Tool;
  featured?: boolean;
}

export function ToolCard({ tool, featured = false }: ToolCardProps) {
  const categoryIcons: Record<string, string> = {
    developer: '👨‍💻',
    calculator: '📊',
    seo: '📈',
    converter: '🔄',
    counter: '🔢'
  };

  return (
    <Link 
      href={tool.path}
      className={`
        block card hover:shadow-lg transition-shadow duration-200
        ${featured ? 'ring-2 ring-blue-500' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* 图标 */}
        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
          {categoryIcons[tool.category]}
        </div>
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {tool.name}
            </h3>
            {featured && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                热门
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {tool.description}
          </p>
          
          {/* 优先级标识 */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              优先级 #{tool.priority}
            </span>
            
            <div className="flex items-center space-x-1">
              {tool.keywords.slice(0, 2).map((keyword, index) => (
                <span 
                  key={index}
                  className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}