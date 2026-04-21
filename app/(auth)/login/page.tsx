'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const lockSubmitForFiveSeconds = () => {
    setIsSubmitting(true)
    window.setTimeout(() => setIsSubmitting(false), 5000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setError('')
    lockSubmitForFiveSeconds()

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()

    if (data.code === 200) {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.data.token)
      window.location.href = '/home'
      return
    }

    setError(data.message)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#fff0f6] via-surface to-surface-container-low px-6">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container shadow-xl">
            <span className="text-5xl">🌟</span>
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-primary to-primary-container bg-clip-text text-display-md font-bold text-transparent">
            雅思词汇花园
          </h1>
          <p className="text-body-lg text-on-surface/60">在故事中遇见词汇</p>
        </div>

        <div className="rounded-[2rem] bg-surface-container-lowest/80 p-8 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-6 rounded-full bg-primary/10 p-4 text-center text-body-sm text-primary">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full rounded-full bg-surface-container-high px-6 py-4 text-body-lg text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full rounded-full bg-surface-container-high px-6 py-4 pr-14 text-body-lg text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-on-surface/45 transition-colors hover:text-primary"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-4 text-body-lg font-bold text-white transition-all hover:scale-[1.02] hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {isSubmitting ? '请稍候...' : '登录'}
            </button>
          </form>
        </div>

        <p className="mt-8 flex items-center justify-center gap-3 text-center text-body-lg text-on-surface/70" style={{"paddingBottom": "25px"}}>
          <span>还没有账号？</span>
          <Link href="/register" className="font-bold text-primary">
            立即注册
          </Link>
          <span className="text-on-surface/25">|</span>
          <Link href="/activation-code" className="font-bold text-primary">
            获取激活码
          </Link>
        </p>
      </div>
    </div>
  )
}
