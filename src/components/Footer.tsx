import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ToolHub</span>
            </div>
            <p className="text-gray-600 mb-4">
              免费在线工具聚合站，为开发者和营销人员提供实用的工具集合。
              无广告骚扰、无账户注册、即开即用。
            </p>
          </div>

          {/* 工具分类 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">工具分类</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tools" className="text-gray-600 hover:text-blue-600 transition-colors">
                  开发者工具
                </Link>
              </li>
              <li>
                <Link href="/calculators" className="text-gray-600 hover:text-blue-600 transition-colors">
                  计算器
                </Link>
              </li>
              <li>
                <Link href="/seo-tools" className="text-gray-600 hover:text-blue-600 transition-colors">
                  SEO 工具
                </Link>
              </li>
              <li>
                <Link href="/converters" className="text-gray-600 hover:text-blue-600 transition-colors">
                  转换器
                </Link>
              </li>
            </ul>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors">
                  使用条款
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2024 ToolHub. 保留所有权利。
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a 
                href="mailto:contact@toolhub.example.com" 
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm"
              >
                contact@toolhub.example.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}