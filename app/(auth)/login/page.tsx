'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.code === 200) {
      localStorage.setItem('token', data.data.token)
      window.location.href = '/home'
    } else {
      setError(data.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f6] via-surface to-surface-container-low flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center shadow-xl">
            <span className="text-5xl">🌸</span>
          </div>
          <h1 className="text-display-md font-bold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent mb-2">
            雅思词汇花园
          </h1>
          <p className="text-body-lg text-on-surface/60">在故事中遇见词汇</p>
        </div>

        <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl">
          {error && <div className="bg-primary/10 text-primary p-4 rounded-full mb-6 text-center text-body-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名"
              className="w-full px-6 py-4 bg-surface-container-high rounded-full text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-body-lg" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码"
              className="w-full px-6 py-4 bg-surface-container-high rounded-full text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-body-lg" required />
            <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full font-bold text-body-lg hover:shadow-2xl hover:scale-[1.02] transition-all mt-6">
              登录
            </button>
          </form>
        </div>
        <p className="text-center mt-8 text-body-lg text-on-surface/70">
          还没有账号？<a href="/register" className="text-primary font-bold ml-2">立即注册</a>
        </p>
      </div>
    </div>
  )
}
