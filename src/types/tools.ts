export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
  category: 'developer' | 'calculator' | 'seo' | 'converter' | 'counter';
  keywords: string[];
  priority: number; // 1-30, 1 is highest
  metadata: {
    title: string;
    description: string;
    keywords: string;
    openGraph: {
      title: string;
      description: string;
      url: string;
      type: 'website';
    };
  };
  relatedTools: string[];
}

export interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  tools: string[];
}

export interface CalculationResult {
  value: number | string;
  unit?: string;
  formatted: string;
  breakdown?: {
    label: string;
    value: number | string;
  }[];
}