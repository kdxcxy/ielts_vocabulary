'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    const publicPaths = ['/login', '/register']
    
    // 未登录且不在公开页面，跳转到登录页
    if (!token && !publicPaths.includes(pathname)) {
      router.push('/login')
    }
    
    // 已登录且在根路径，跳转到首页
    if (token && pathname === '/') {
      router.push('/home')
    }
  }, [pathname, router])
  
  return <>{children}</>
}
