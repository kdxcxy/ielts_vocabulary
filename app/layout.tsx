import type { Metadata } from 'next'
import './globals.css'
import AuthCheck from '@/components/AuthCheck'

export const metadata: Metadata = {
  title: '\u96c5\u601d\u8bcd\u6c47\u82b1\u56ed',
  description: '\u5728\u6545\u4e8b\u4e2d\u9047\u89c1\u8bcd\u6c47',
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
