'use client'
import { useState } from 'react'

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', activationCode: '' })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) return setError('两次密码不一致')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, password: form.password, activationCode: form.activationCode }),
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
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary-container rounded-full flex items-center justify-center shadow-xl">
            <span className="text-5xl">🌸</span>
          </div>
          <h1 className="text-display-md font-bold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent mb-2">
            雅思词汇花园
          </h1>
          <p className="text-body-lg text-on-surface/60">在故事中遇见词汇</p>
        </div>

        <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl">
          {error && <div className="bg-primary/10 text-primary p-4 rounded-full mb-4 text-center text-body-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" placeholder="请输入用户名" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-6 py-4 bg-surface-container-high rounded-full text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-body-lg" required />
            <input type="password" placeholder="请输入密码" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-6 py-4 bg-surface-container-high rounded-full text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-body-lg" required />
            <input type="password" placeholder="请再次输入密码" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-6 py-4 bg-surface-container-high rounded-full text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-body-lg" required />
            <input type="text" placeholder="请输入激活码 SV-XXXX-XXXX-XXXX-XXXX" value={form.activationCode}
              onChange={(e) => setForm({ ...form, activationCode: e.target.value })}
              className="w-full px-6 py-4 bg-surface-container-high rounded-full text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/30 text-body-lg" required />
            <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full font-bold text-body-lg hover:shadow-2xl hover:scale-[1.02] transition-all mt-4">
              注册
            </button>
          </form>
        </div>
        <p className="text-center mt-8 text-body-lg text-on-surface/70">
          已有账号？<a href="/login" className="text-primary font-bold ml-2">立即登录</a>
        </p>
      </div>
    </div>
  )
}
