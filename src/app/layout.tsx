import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Layout } from "../components/Layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToolHub - 免费在线工具聚合站",
  description: "免费在线工具聚合站，为开发者和营销人员提供实用的工具集合。无广告骚扰、无账户注册、即开即用。",
  keywords: "免费工具, 在线工具, 开发者工具, 计算器, SEO工具, 转换器",
  authors: [{ name: "ToolHub Team" }],
  creator: "ToolHub",
  publisher: "ToolHub",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://toolhub.example.com",
    title: "ToolHub - 免费在线工具聚合站",
    description: "免费在线工具聚合站，为开发者和营销人员提供实用的工具集合。",
    siteName: "ToolHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToolHub - 免费在线工具聚合站",
    description: "免费在线工具聚合站，为开发者和营销人员提供实用的工具集合。",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
