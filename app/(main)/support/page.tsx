'use client'

import Link from 'next/link'
import { ArrowLeft, Copy, HelpCircle, MessageCircle, Sparkles } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function SupportPage() {
  const wechatId = 'looplip'

  const copyWechatId = async () => {
    try {
      await navigator.clipboard.writeText(wechatId)
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff0f6] via-surface to-surface-container-low pb-20">
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-24">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
            aria-label="返回我的页面"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">帮助与反馈</h1>
            <p className="mt-1 text-sm text-white/75">使用过程中遇到问题，请联系开发者</p>
          </div>
        </div>
      </div>

      <main className="-mt-14 px-6">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-xl">
          <div className="relative px-6 pt-8 pb-7">
            <div className="absolute right-6 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4facfe] to-[#00f2fe] shadow-lg shadow-sky-200/70">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <p className="text-sm font-medium text-on-surface/55">开发者微信</p>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-surface-container-high px-5 py-4">
              <span className="text-2xl font-bold tracking-wide text-on-surface">{wechatId}</span>
              <button
                type="button"
                onClick={copyWechatId}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm transition-transform active:scale-95"
                aria-label="复制微信号"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-5 text-sm leading-6 text-on-surface/60">
              如果你在登录、注册、背词、播放录音、收藏记录等功能中遇到问题，可以添加微信反馈。请简单描述你遇到的问题，最好附上截图，方便快速定位。
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-[1.75rem] bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">反馈建议</h2>
              <p className="mt-1 text-sm leading-6 text-on-surface/60">
                欢迎反馈词汇释义、故事内容、页面卡顿、发音播放等问题。你的反馈会帮助这个词汇花园变得更好用。
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
