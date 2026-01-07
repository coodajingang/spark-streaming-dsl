import { tools, getAllCategories, getToolsByCategory } from '../lib/tools';
import { ToolCard } from '../components/ToolCard';
import Link from 'next/link';

export default function HomePage() {
  // 获取热门工具（优先级最高的6个）
  const featuredTools = tools
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 6);

  // 获取所有分类
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              免费在线工具箱
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              开发者和营销人员的必备武器：无广告骚扰、无账户注册、即开即用
            </p>
            
            {/* 搜索框 */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索工具..."
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="absolute right-3 top-3 p-1">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 热门工具 */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            热门工具
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => (
              <ToolCard 
                key={tool.id} 
                tool={tool} 
                featured={tool.priority <= 3}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 分类导航 */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            工具分类
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${category.id === 'developer' ? 'tools' : 
                      category.id === 'calculator' ? 'calculators' :
                      category.id === 'seo' ? 'seo-tools' :
                      category.id === 'converter' ? 'converters' : 'counters'}`}
                className="bg-gray-50 hover:bg-blue-50 rounded-lg p-6 text-center transition-colors"
              >
                <div className="text-3xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                <p className="text-sm text-gray-600">{category.tools.length} 个工具</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 所有工具列表 */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            全部工具
          </h2>
          
          {/* 按分类显示工具 */}
          {categories.map((category) => {
            const categoryTools = getToolsByCategory(category.id);
            if (categoryTools.length === 0) return null;

            return (
              <div key={category.id} className="mb-12">
                <div className="flex items-center mb-6">
                  <span className="text-2xl mr-3">{category.icon}</span>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <span className="ml-auto text-sm text-gray-500">
                    {categoryTools.length} 个工具
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}