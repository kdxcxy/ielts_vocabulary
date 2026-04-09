'use client'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Star, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { name: '首页', path: '/home', Icon: Home },
    { name: '故事', path: '/stories', Icon: BookOpen },
    { name: '收藏', path: '/bookmarks', Icon: Star },
    { name: '我的', path: '/profile', Icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(180,0,93,0.08)] safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ name, path, Icon }) => {
          const isActive = pathname === path
          return (
            <a
              key={path}
              href={path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface/40'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{name}</span>
            </a>
          )
        })}
      </div>
    </div>
  )
}
