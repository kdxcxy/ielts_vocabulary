'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { BookOpen, RotateCcw, TrendingUp } from 'lucide-react'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'

type HomeStats = {
  learnedWords: number
  totalVocabulary: number
  progressPercent: number
  streakDays: number
  completedStories: number
  reviewCount: number
}

const DEFAULT_STATS: HomeStats = {
  learnedWords: 0,
  totalVocabulary: 0,
  progressPercent: 0,
  streakDays: 0,
  completedStories: 0,
  reviewCount: 0,
}

export default function HomePage() {
  const [username, setUsername] = useState('学习者')
  const [stats, setStats] = useState<HomeStats>(DEFAULT_STATS)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) return

    Promise.all([
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch('/api/home-stats', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ])
      .then(async ([profileRes, statsRes]) => {
        const profileData = profileRes.ok ? await profileRes.json() : null
        const statsData = statsRes.ok ? await statsRes.json() : null

        if (profileData?.data?.username) {
          setUsername(profileData.data.username)
        }

        if (statsData?.data) {
          setStats({
            learnedWords: Number(statsData.data.learnedWords || 0),
            totalVocabulary: Number(statsData.data.totalVocabulary || 0),
            progressPercent: Number(statsData.data.progressPercent || 0),
            streakDays: Number(statsData.data.streakDays || 0),
            completedStories: Number(statsData.data.completedStories || 0),
            reviewCount: Number(statsData.data.reviewCount || 0),
          })
        }
      })
      .catch(() => {})
  }, [])

  const statCards = [
    {
      icon: TrendingUp,
      label: '连续学习',
      value: stats.streakDays,
      unit: '天',
      gradient: 'from-[#ff6b9d] to-[#c239b3]',
    },
    {
      icon: BookOpen,
      label: '完成故事',
      value: stats.completedStories,
      unit: '篇',
      gradient: 'from-tertiary to-[#764ba2]',
    },
    {
      icon: RotateCcw,
      label: '待复习',
      value: stats.reviewCount,
      unit: '词',
      gradient: 'from-[#f093fb] to-[#f5576c]',
    },
  ]

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="rounded-b-[2rem] bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-white">Hi, {username}</h1>
            <p className="text-sm text-white/80">今天也要加油哦</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-2xl">🌸</span>
          </div>
        </div>

        <div className="rounded-3xl bg-white/95 p-6 shadow-lg backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">学习进度</h2>
            <span className="text-sm text-on-surface/60">累计</span>
          </div>
          <div className="mb-3 flex items-end gap-2">
            <span className="text-5xl font-bold text-primary">{stats.learnedWords}</span>
            <span className="mb-2 text-lg text-on-surface/60">/ {stats.totalVocabulary} 词</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="-mt-6 mb-6 px-6">
        <div className="grid grid-cols-3 gap-3">
          {statCards.map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-container-lowest p-4 shadow-sm">
              <div
                className={`mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${item.gradient}`}
              >
                <item.icon className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <p className="mb-1 text-xs text-on-surface/60">{item.label}</p>
              <p className="text-base font-bold text-on-surface">
                {item.value}
                <span className="ml-1 text-sm font-normal text-on-surface/60">{item.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6">
        <h3 className="mb-4 text-lg font-bold text-on-surface">快速开始</h3>
        <div className="space-y-3">
          <Link
            href="/stories"
            className="block rounded-full bg-gradient-to-r from-primary to-primary-container py-4 text-center text-base font-bold text-white shadow-lg"
          >
            开始学习
          </Link>
          <Link
            href="/bookmarks"
            className="block rounded-full bg-surface-container-highest py-4 text-center text-base font-medium text-on-surface"
          >
            复习收藏
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
