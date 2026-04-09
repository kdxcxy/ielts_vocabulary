'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { Settings, HelpCircle, LogOut, ChevronRight, Ticket, Star, Clock, BookOpen, TrendingUp } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetch('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setUser(data.data))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* 顶部粉色区域 */}
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-20">
        <h1 className="text-2xl font-bold text-white mb-6">我的</h1>
      </div>

      {/* 用户信息卡片 - 浮在粉色区域上 */}
      <div className="px-6 -mt-14 mb-5">
        <div className="bg-white rounded-2xl p-5 shadow-lg flex items-center">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center mr-4 flex-shrink-0">
            <span className="text-3xl">🌸</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-on-surface">{user?.username || '学习者'}</h2>
            <p className="text-xs text-on-surface/50 mt-0.5">IELTS 词汇学习者</p>
          </div>
          <ChevronRight className="w-5 h-5 text-on-surface/30" />
        </div>
      </div>

      {/* 学习数据统计 */}
      <div className="px-6 mb-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface mb-4">学习数据</h3>
          <div className="flex justify-around">
            {[
              { icon: BookOpen, label: '已学词汇', value: '0', color: 'text-primary' },
              { icon: TrendingUp, label: '完成故事', value: '0', color: 'text-tertiary' },
              { icon: Clock, label: '学习时长', value: '0h', color: 'text-[#f5576c]' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <item.icon className={`w-6 h-6 ${item.color} mx-auto mb-1.5`} />
                <p className="text-xl font-bold text-on-surface">{item.value}</p>
                <p className="text-[11px] text-on-surface/50 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 功能列表 */}
      <div className="px-6 space-y-2.5">
        {[
          { icon: Ticket, label: '激活码管理', href: '/activation-codes', gradient: 'from-[#ff6b9d] to-[#c239b3]' },
          { icon: Star, label: '我的收藏', href: '/bookmarks', gradient: 'from-[#f093fb] to-[#f5576c]' },
          { icon: Settings, label: '设置', href: '#', gradient: 'from-tertiary to-[#764ba2]' },
          { icon: HelpCircle, label: '帮助与反馈', href: '#', gradient: 'from-[#4facfe] to-[#00f2fe]' },
        ].map((item, i) => (
          <a key={i} href={item.href} className="block bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center">
              <div className={`w-10 h-10 bg-gradient-to-br ${item.gradient} rounded-full flex items-center justify-center mr-4 flex-shrink-0`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-on-surface flex-1">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-on-surface/30" />
            </div>
          </a>
        ))}

        <button onClick={handleLogout} className="w-full bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center mr-4 flex-shrink-0">
              <LogOut className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-primary flex-1">退出登录</span>
          </div>
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
