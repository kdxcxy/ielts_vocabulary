'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import {
  ChevronRight,
  HelpCircle,
  LogOut,
  Settings,
  Star,
  Ticket,
} from 'lucide-react'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'

type ProfileMenuItem = {
  icon: typeof Ticket
  label: string
  href: string
  gradient: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) return
    fetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setUser(data.data))
  }, [])
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.location.href = '/login'
  }
  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-20">
        <h1 className="mb-6 text-2xl font-bold text-white">我的</h1>
      </div>
      <div className="-mt-14 mb-5 px-6">
        <div className="flex items-center rounded-2xl bg-white p-5 shadow-lg">
          <div className="mr-4 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container">
            <span className="text-3xl">🌭</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-on-surface">{user?.username || '学习者'}</h2>
            <p className="mt-0.5 text-xs text-on-surface/50">IELTS 词汇学习者</p>
          </div>
          <ChevronRight className="h-5 w-5 text-on-surface/30" />
        </div>
      </div>
      <div className="space-y-2.5 px-6">
        {[
          user?.username === 'kongdx'
            ? { icon: Ticket, label: '激活码管理', href: '/activation-codes', gradient: 'from-[#ff6b9d] to-[#c239b3]' }
            : null,
          { icon: Star, label: '我的收藏', href: '/bookmarks', gradient: 'from-[#f093fb] to-[#f5576c]' },
          { icon: HelpCircle, label: '帮助与反馈', href: '#', gradient: 'from-[#4facfe] to-[#00f2fe]' },
        ].filter((item): item is ProfileMenuItem => item !== null).map((item) => (
          <a key={item.label} href={item.href} className="block rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div
                className={`mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient}`}
              >
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <span className="flex-1 text-sm font-medium text-on-surface">{item.label}</span>
              <ChevronRight className="h-5 w-5 text-on-surface/30" />
            </div>
          </a>
        ))}
        <button onClick={handleLogout} className="w-full rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-high">
              <LogOut className="h-5 w-5 text-primary" />
            </div>
            <span className="flex-1 text-left text-sm font-medium text-primary">退出登录</span>
          </div>
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
