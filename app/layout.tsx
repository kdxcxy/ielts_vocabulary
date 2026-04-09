import type { Metadata } from 'next'
import './globals.css'
import AuthCheck from '@/components/AuthCheck'

export const metadata: Metadata = {
  title: '雅思词汇花园',
  description: '在故事中遇见词汇',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthCheck>{children}</AuthCheck>
      </body>
    </html>
  )
}
