import Link from 'next/link'
import { ArrowLeft, MessageCircle } from 'lucide-react'

export default function ActivationCodePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#fff0f6] via-surface to-surface-container-low px-6 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="mb-10 flex items-center gap-3">
          <Link
            href="/login"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-on-surface shadow-sm backdrop-blur-sm"
            aria-label="返回登录页"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-on-surface">获取激活码</h1>
            <p className="mt-1 text-sm text-on-surface/60">联系开发者微信获取激活码</p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-surface-container-lowest/85 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container shadow-lg">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-4 text-center">
            <p className="text-sm tracking-[0.2em] text-on-surface/45">开发者微信</p>
            <p className="text-3xl font-bold tracking-wide text-primary">looplip</p>
            <p className="text-base leading-7 text-on-surface/70">请添加开发者微信获取激活码</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 text-body-lg text-on-surface/70">
          <Link href="/login" className="font-bold text-primary">
            返回登录
          </Link>
          <span className="text-on-surface/25">|</span>
          <Link href="/register" className="font-bold text-primary">
            去注册页
          </Link>
        </div>
      </div>
    </div>
  )
}
