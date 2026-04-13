'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Star, User } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const tabs = [
    { name: '\u9996\u9875', path: '/home', Icon: Home },
    { name: '\u6545\u4e8b', path: '/stories', Icon: BookOpen },
    { name: '\u6536\u85cf', path: '/bookmarks', Icon: Star },
    { name: '\u6211\u7684', path: '/profile', Icon: User },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white shadow-[0_-4px_20px_rgba(180,0,93,0.08)] safe-area-inset-bottom">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around">
        {tabs.map(({ name, path, Icon }) => {
          const isActive = pathname === path

          return (
            <Link
              key={path}
              href={path}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface/40'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
