'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const checkingRef = useRef(false)
  const [showInvalidAccountModal, setShowInvalidAccountModal] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const publicPaths = ['/login', '/register']
    const isPublicPath = publicPaths.includes(pathname)

    if (!token && !isPublicPath) {
      router.push('/login')
      return
    }

    if (token && pathname === '/') {
      router.push('/home')
      return
    }

    if (!token || isPublicPath || checkingRef.current || showInvalidAccountModal) return

    checkingRef.current = true

    fetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const data = await res.json()
        if (data.code === 200) return
        setShowInvalidAccountModal(true)
      })
      .catch(() => {
        setShowInvalidAccountModal(true)
      })
      .finally(() => {
        checkingRef.current = false
      })
  }, [pathname, router, showInvalidAccountModal])

  const handleInvalidAccountConfirm = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setShowInvalidAccountModal(false)
    router.push('/login')
  }

  return (
    <>
      {children}
      {showInvalidAccountModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface">账号提示</h3>
            <p className="mt-3 text-sm leading-7 text-on-surface/70">
              该账号已失效，请绑定新的激活码
            </p>
            <button
              onClick={handleInvalidAccountConfirm}
              className="mt-8 w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-sm font-bold text-white"
            >
              确定
            </button>
          </div>
        </div>
      )}
    </>
  )
}
