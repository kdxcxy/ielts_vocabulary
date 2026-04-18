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
  const [resetting, setResetting] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  async function loadHomeData() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) return

    try {
      const [profileRes, statsRes] = await Promise.all([
      fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch('/api/home-stats', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      ])
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
    } catch {}
  }

  useEffect(() => {
    loadHomeData()
  }, [])

  async function handleResetStats() {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token || resetting) return

    setResetting(true)
    try {
      const res = await fetch('/api/home-stats/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('reset failed')
      }

      await loadHomeData()
      setShowResetConfirm(false)
    } catch {
      window.alert('重置失败，请稍后再试')
    } finally {
      setResetting(false)
    }
  }

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
            <div key={item.label} className="rounded-xl bg-white/60 p-4 shadow-md shadow-black/5 backdrop-blur-lg border border-white/40">
              <item.icon className="mb-3 h-6 w-6 text-primary" strokeWidth={1.5} />
              <p className="mb-1 text-xs text-on-surface/60">{item.label}</p>
              <p className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-on-surface">{item.value}</span>
                <span className="text-sm text-on-surface/60">{item.unit}</span>
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
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={resetting}
            className="block w-full rounded-full border border-primary/20 bg-white py-4 text-center text-base font-medium text-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resetting ? '重置中...' : '重置统计'}
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface">确认重置</h3>
            <p className="mt-3 text-sm leading-7 text-on-surface/70">
              重置后，学习进度、连续学习和完成故事会清空，收藏单词不会删除。
            </p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-full bg-surface-container py-3 text-sm font-medium text-on-surface/70"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleResetStats}
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-primary-container py-3 text-sm font-bold text-white"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
