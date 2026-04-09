'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, Plus, Copy, Check, ChevronRight, Search, Download } from 'lucide-react'

interface ActivationCode {
  id: number
  code: string
  durationType: string
  status: string
  activatedAt: string | null
  expiresAt: string | null
  createdAt: string | null
  username: string | null
  password: string | null
}

const durationLabels: Record<string, string> = {
  '1min': '1分钟',
  '24h': '24小时',
  '1year': '1年',
  'forever': '永久',
}

const PAGE_SIZE = 10

export default function ActivationCodesPage() {
  const [allCodes, setAllCodes] = useState<ActivationCode[]>([])
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [showGenerate, setShowGenerate] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [selectedCode, setSelectedCode] = useState<ActivationCode | null>(null)
  const [form, setForm] = useState({ count: 10, durationType: '24h' })
  const [copied, setCopied] = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCodes()
  }, [])

  const fetchCodes = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/activation-codes/list', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    setAllCodes(data.data || [])
  }

  const filtered = allCodes.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.username && c.username.includes(search))
  )

  const displayed = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore) {
      setDisplayCount(prev => prev + PAGE_SIZE)
    }
  }, [hasMore])

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [handleObserver])

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [search])

  const handleGenerate = async () => {
    const count = Math.max(1, form.count)
    const token = localStorage.getItem('token')
    const res = await fetch('/api/admin/activation-codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.code === 200) {
      setGeneratedCodes(data.data.codes)
      setShowGenerate(false)
      setShowResult(true)
      fetchCodes()
    }
  }

  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const handleCopyAll = async () => {
    const text = generatedCodes.join('\n')
    try {
      // 优先用 clipboard API
      await navigator.clipboard.writeText(text)
      showToast('✅ 复制成功！已复制 ' + generatedCodes.length + ' 个激活码')
    } catch {
      // 降级：用 textarea + execCommand
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        showToast('✅ 复制成功！已复制 ' + generatedCodes.length + ' 个激活码')
      } catch {
        showToast('❌ 复制失败，请长按选中文本手动复制')
      }
      document.body.removeChild(textarea)
    }
  }

  const handleDownloadXls = () => {
    // 生成CSV（Excel可打开），带BOM头支持中文
    const BOM = '\uFEFF'
    const header = '激活码,时效类型,状态\n'
    const rows = generatedCodes.map(code =>
      `${code},${durationLabels[form.durationType]},未使用`
    ).join('\n')
    const csv = BOM + header + rows
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `激活码_${form.count}个_${durationLabels[form.durationType]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = code
      textarea.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(code)
    }
    setTimeout(() => setCopied(null), 2000)
  }

  const totalCount = allCodes.length
  const usedCount = allCodes.filter(c => c.status === 'used').length
  const unusedCount = allCodes.filter(c => c.status === 'unused').length

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* 顶部 */}
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-8">
        <div className="flex items-center mb-4">
          <a href="/profile" className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-3">
            <ArrowLeft className="w-5 h-5 text-white" />
          </a>
          <h1 className="text-2xl font-bold text-white">激活码管理</h1>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-full flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-white/70 mr-3" />
          <input type="text" placeholder="搜索激活码或用户名..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-white placeholder:text-white/60 text-sm flex-1 focus:outline-none" />
        </div>
      </div>

      {/* 统计 */}
      <div className="px-6 -mt-4 mb-5">
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex justify-around">
            {[
              { label: '总数', value: totalCount, color: 'text-primary' },
              { label: '已使用', value: usedCount, color: 'text-tertiary' },
              { label: '未使用', value: unusedCount, color: 'text-[#4facfe]' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-on-surface/50 mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="px-6 mb-5">
        <button onClick={() => setShowGenerate(true)}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg">
          <Plus className="w-5 h-5" />
          生成激活码
        </button>
      </div>

      {/* 列表 */}
      <div className="px-6">
        <div className="space-y-2.5">
          {displayed.map(code => (
            <button key={code.id} onClick={() => setSelectedCode(code)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-medium text-on-surface truncate">{code.code}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                      code.status === 'used' ? 'bg-surface-container-high text-on-surface/50' : 'bg-primary/10 text-primary'
                    }`}>
                      {code.status === 'used' ? '已使用' : '未使用'}
                    </span>
                    <span className="text-[11px] text-on-surface/40">{durationLabels[code.durationType]}</span>
                    {code.username && <span className="text-[11px] text-on-surface/40">{code.username}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(code.code) }}
                    className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center">
                    {copied === code.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-on-surface/50" />}
                  </button>
                  <ChevronRight className="w-4 h-4 text-on-surface/20" />
                </div>
              </div>
            </button>
          ))}
          <div ref={loaderRef} className="py-4 text-center">
            {hasMore && <p className="text-xs text-on-surface/40">加载更多...</p>}
            {!hasMore && displayed.length > 0 && <p className="text-xs text-on-surface/30">已加载全部</p>}
            {displayed.length === 0 && <p className="text-sm text-on-surface/40 py-8">没有找到匹配的激活码</p>}
          </div>
        </div>
      </div>

      {/* 生成结果弹窗 */}
      {showResult && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowResult(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[2rem] p-8 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-on-surface/20 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-on-surface">生成成功</h3>
              <span className="text-sm text-on-surface/50">{generatedCodes.length} 个激活码</span>
            </div>
            <div className="bg-surface-container rounded-xl p-4 mb-5 max-h-48 overflow-y-auto">
              {generatedCodes.map((code, i) => (
                <p key={i} className="text-sm font-mono text-on-surface py-1">{code}</p>
              ))}
            </div>
            <div className="space-y-2.5">
              <button onClick={handleCopyAll}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3.5 rounded-full font-bold text-sm text-center">
                复制全部激活码（{generatedCodes.length}个）
              </button>
              <button onClick={handleDownloadXls}
                className="w-full bg-surface-container-highest text-on-surface py-3.5 rounded-full font-medium text-sm text-center">
                下载为 Excel 文件
              </button>
              <button onClick={() => setShowResult(false)}
                className="w-full text-on-surface/50 py-2 text-sm text-center">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedCode && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setSelectedCode(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2rem] p-8 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-on-surface/20 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-on-surface mb-6">激活码详情</h3>
            <div className="space-y-4">
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-xs text-on-surface/50 mb-1">激活码</p>
                <p className="text-base font-mono font-bold text-on-surface">{selectedCode.code}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container rounded-xl p-4">
                  <p className="text-xs text-on-surface/50 mb-1">状态</p>
                  <p className={`text-sm font-bold ${selectedCode.status === 'used' ? 'text-on-surface/50' : 'text-primary'}`}>
                    {selectedCode.status === 'used' ? '已使用' : '未使用'}
                  </p>
                </div>
                <div className="bg-surface-container rounded-xl p-4">
                  <p className="text-xs text-on-surface/50 mb-1">时效类型</p>
                  <p className="text-sm font-bold text-on-surface">{durationLabels[selectedCode.durationType]}</p>
                </div>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-xs text-on-surface/50 mb-1">创建时间</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.createdAt || '-'}</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-xs text-on-surface/50 mb-1">失效时间</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.expiresAt || '-'}</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-xs text-on-surface/50 mb-1">激活时间</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.activatedAt || '-'}</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-xs text-on-surface/50 mb-1">账号</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.username || '-'}</p>
              </div>
              <div className="bg-surface-container rounded-xl p-4">
                <p className="text-xs text-on-surface/50 mb-1">密码</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.password || '-'}</p>
              </div>
              <button onClick={() => handleCopy(selectedCode.code)}
                className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2">
                <Copy className="w-4 h-4" />复制激活码
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生成激活码弹窗 */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end justify-center z-50" onClick={() => setShowGenerate(false)}>
          <div className="bg-white w-full max-w-md rounded-t-[2rem] p-8 pb-10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-on-surface/20 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-on-surface mb-6">生成激活码</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-on-surface/60 mb-2 block">生成数量</label>
                <input type="number" value={form.count === 0 ? '' : form.count} onChange={(e) => setForm({...form, count: parseInt(e.target.value) || 0})}
                  className="w-full px-5 py-3.5 bg-surface-container rounded-full text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm" placeholder="请输入数量" />
              </div>
              <div>
                <label className="text-sm text-on-surface/60 mb-2 block">时效类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '1min', label: '1分钟' },
                    { value: '24h', label: '24小时' },
                    { value: '1year', label: '1年' },
                    { value: 'forever', label: '永久' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setForm({...form, durationType: opt.value})}
                      className={`py-3 rounded-full text-sm font-medium transition-all ${
                        form.durationType === opt.value ? 'bg-gradient-to-r from-primary to-primary-container text-white' : 'bg-surface-container text-on-surface/70'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleGenerate} className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3.5 rounded-full font-bold text-sm">
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-on-surface/80 text-white px-6 py-3 rounded-2xl text-sm font-medium shadow-xl backdrop-blur-sm">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
