'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, Check, ChevronRight, Copy, Plus, Search, Trash2 } from 'lucide-react'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'

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

type DurationFilter = 'all' | '1min' | '24h' | '1year' | 'forever'
type StatusFilter = 'all' | 'used' | 'unused'
type ActivatedTimeFilter = 'all' | 'today' | '7days' | '30days' | 'notActivated'
type DateFieldType = 'start' | 'end'

const durationLabels: Record<string, string> = {
  all: '全部',
  '1min': '1分钟',
  '24h': '24小时',
  '1year': '1年',
  forever: '永久',
}

const statusLabels: Record<string, string> = {
  all: '全部',
  used: '已使用',
  unused: '未使用',
}

const activatedTimeLabels: Record<string, string> = {
  all: '全部',
  today: '今天激活',
  '7days': '7天内',
  '30days': '30天内',
  notActivated: '未激活',
}

const PAGE_SIZE = 10

function formatDateValue(dateValue: string) {
  if (!dateValue) return '年 / 月 / 日'
  const [year, month, day] = dateValue.split('-')
  if (!year || !month || !day) return '年 / 月 / 日'
  return `${year}年${month}月${day}日`
}

function padDateValue(value: number) {
  return value.toString().padStart(2, '0')
}

function parseZhDate(dateText: string | null): Date | null {
  if (!dateText || dateText === '-') return null
  const normalized = dateText.replace(/\//g, '-')
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

function matchActivatedTimeFilter(code: ActivationCode, filter: ActivatedTimeFilter) {
  if (filter === 'all') return true
  if (filter === 'notActivated') return !code.activatedAt

  const activatedDate = parseZhDate(code.activatedAt)
  if (!activatedDate) return false

  const now = new Date()
  const diffMs = now.getTime() - activatedDate.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (filter === 'today') {
    return (
      now.getFullYear() === activatedDate.getFullYear() &&
      now.getMonth() === activatedDate.getMonth() &&
      now.getDate() === activatedDate.getDate()
    )
  }

  if (filter === '7days') return diffDays <= 7
  if (filter === '30days') return diffDays <= 30
  return true
}

export default function ActivationCodesPage() {
  const [allCodes, setAllCodes] = useState<ActivationCode[]>([])
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [activatedTimeFilter, setActivatedTimeFilter] = useState<ActivatedTimeFilter>('all')
  const [activatedStartDate, setActivatedStartDate] = useState('')
  const [activatedEndDate, setActivatedEndDate] = useState('')
  const [activeDateField, setActiveDateField] = useState<DateFieldType | null>(null)
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear())
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1)
  const [pickerDay, setPickerDay] = useState(new Date().getDate())
  const [showGenerate, setShowGenerate] = useState(false)
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([])
  const [showResult, setShowResult] = useState(false)
  const [selectedCode, setSelectedCode] = useState<ActivationCode | null>(null)
  const [pendingDeleteCode, setPendingDeleteCode] = useState<ActivationCode | null>(null)
  const [form, setForm] = useState({ count: 10, durationType: '24h' })
  const [copied, setCopied] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2000)
  }, [])

  const fetchCodes = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const res = await fetch('/api/admin/activation-codes/list', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setAllCodes(data.data || [])
  }, [])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const openDatePicker = (field: DateFieldType) => {
    const currentValue = field === 'start' ? activatedStartDate : activatedEndDate
    const currentDate = currentValue ? new Date(`${currentValue}T00:00:00`) : new Date()

    setPickerYear(currentDate.getFullYear())
    setPickerMonth(currentDate.getMonth() + 1)
    setPickerDay(currentDate.getDate())
    setActiveDateField(field)
  }

  const daysInPickerMonth = new Date(pickerYear, pickerMonth, 0).getDate()

  useEffect(() => {
    if (pickerDay > daysInPickerMonth) {
      setPickerDay(daysInPickerMonth)
    }
  }, [daysInPickerMonth, pickerDay])

  const confirmDatePicker = () => {
    if (!activeDateField) return

    const nextValue = `${pickerYear}-${padDateValue(pickerMonth)}-${padDateValue(pickerDay)}`
    if (activeDateField === 'start') {
      setActivatedStartDate(nextValue)
    } else {
      setActivatedEndDate(nextValue)
    }

    setActiveDateField(null)
  }

  const filtered = allCodes.filter((code) => {
    const matchSearch =
      code.code.toLowerCase().includes(search.toLowerCase()) ||
      (code.username && code.username.includes(search))
    const matchDuration = durationFilter === 'all' || code.durationType === durationFilter
    const matchStatus = statusFilter === 'all' || code.status === statusFilter
    const matchActivatedTime = matchActivatedTimeFilter(code, activatedTimeFilter)
    const activatedDate = parseZhDate(code.activatedAt)
    const rangeStart = activatedStartDate ? new Date(`${activatedStartDate}T00:00:00`) : null
    const rangeEnd = activatedEndDate ? new Date(`${activatedEndDate}T23:59:59`) : null
    const matchActivatedRange =
      !rangeStart && !rangeEnd
        ? true
        : !!activatedDate &&
          (!rangeStart || activatedDate >= rangeStart) &&
          (!rangeEnd || activatedDate <= rangeEnd)

    return !!matchSearch && matchDuration && matchStatus && matchActivatedTime && matchActivatedRange
  })

  const displayed = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore) {
        setDisplayCount((prev) => prev + PAGE_SIZE)
      }
    },
    [hasMore]
  )

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [handleObserver])

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [search, durationFilter, statusFilter, activatedTimeFilter, activatedStartDate, activatedEndDate])

  const handleGenerate = async () => {
    if (!form.count || Number.isNaN(form.count) || form.count < 1) {
      showToast('请输入生成数量')
      return
    }

    const count = Math.max(1, form.count)
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const res = await fetch('/api/admin/activation-codes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...form, count }),
    })
    const data = await res.json()

    if (data.code === 200) {
      setGeneratedCodes(data.data.codes || [])
      setShowGenerate(false)
      setShowResult(true)
      fetchCodes()
      return
    }

    showToast(data.message || '生成失败')
  }

  const executeDelete = async () => {
    if (!pendingDeleteCode) return

    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const res = await fetch(`/api/admin/activation-codes/${pendingDeleteCode.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (data.code !== 200) {
      if (data.message === '激活码不存在') {
        await fetchCodes()
      }
      showToast(data.message || '删除失败')
      return
    }

    setSelectedCode((current) => (current?.id === pendingDeleteCode.id ? null : current))
    setPendingDeleteCode(null)
    await fetchCodes()

    if (data.data?.invalidatedUser?.username) {
      showToast(`激活码已删除，账号 ${data.data.invalidatedUser.username} 已失效`)
      return
    }

    showToast('激活码已删除')
  }

  const handleCopyAll = async () => {
    const text = generatedCodes.join('\n')

    try {
      await navigator.clipboard.writeText(text)
      showToast(`复制成功，已复制 ${generatedCodes.length} 个激活码`)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.cssText = 'position:fixed;left:-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        showToast(`复制成功，已复制 ${generatedCodes.length} 个激活码`)
      } catch {
        showToast('复制失败，请手动复制')
      }
      document.body.removeChild(textarea)
    }
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

    window.setTimeout(() => setCopied(null), 2000)
  }

  const totalCount = allCodes.length
  const usedCount = allCodes.filter((code) => code.status === 'used').length
  const unusedCount = allCodes.filter((code) => code.status === 'unused').length

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-8">
        <div className="mb-4 flex items-center">
          <a
            href="/profile"
            className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </a>
          <h1 className="text-2xl font-bold text-white">激活码管理</h1>
        </div>

        <div className="flex items-center rounded-full bg-white/20 px-4 py-3 backdrop-blur-sm">
          <Search className="mr-3 h-5 w-5 text-white/70" />
          <input
            type="text"
            placeholder="搜索激活码或用户名..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
          />
        </div>
      </div>

      <div className="-mt-4 mb-5 px-6">
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <div className="flex justify-around">
            {[
              { label: '总数', value: totalCount, color: 'text-primary' },
              { label: '已使用', value: usedCount, color: 'text-tertiary' },
              { label: '未使用', value: unusedCount, color: 'text-[#4facfe]' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="mt-1 text-xs text-on-surface/50">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 px-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="mb-2 text-xs font-medium text-on-surface/50">时效类型</p>
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
                  className="w-full rounded-full bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none"
                >
                  {Object.entries(durationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-on-surface/50">使用状态</p>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full rounded-full bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-on-surface/50">激活时间</p>
                <select
                  value={activatedTimeFilter}
                  onChange={(e) => setActivatedTimeFilter(e.target.value as ActivatedTimeFilter)}
                  className="w-full rounded-full bg-surface-container px-4 py-3 text-sm text-on-surface focus:outline-none"
                >
                  {Object.entries(activatedTimeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openDatePicker('start')}
                className="w-full rounded-full bg-surface-container px-4 py-3 text-left text-sm text-on-surface"
              >
                {formatDateValue(activatedStartDate)}
              </button>
              <button
                onClick={() => openDatePicker('end')}
                className="w-full rounded-full bg-surface-container px-4 py-3 text-left text-sm text-on-surface"
              >
                {formatDateValue(activatedEndDate)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 px-6">
        <button
          onClick={() => setShowGenerate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-sm font-bold text-white shadow-lg"
        >
          <Plus className="h-5 w-5" />
          生成激活码
        </button>
      </div>

      <div className="px-6">
        <div className="space-y-2.5">
          {displayed.map((code) => (
            <div
              key={code.id}
              onClick={() => setSelectedCode(code)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedCode(code)
                }
              }}
              role="button"
              tabIndex={0}
              className="w-full rounded-2xl bg-white p-4 text-left shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium text-on-surface">{code.code}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        code.status === 'used'
                          ? 'bg-surface-container-high text-on-surface/50'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {code.status === 'used' ? '已使用' : '未使用'}
                    </span>
                    <span className="text-[11px] text-on-surface/40">
                      {durationLabels[code.durationType] || code.durationType}
                    </span>
                    {code.username && (
                      <span className="text-[11px] text-on-surface/40">{code.username}</span>
                    )}
                  </div>
                </div>

                <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPendingDeleteCode(code)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCopy(code.code)
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container"
                  >
                    {copied === code.code ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-on-surface/50" />
                    )}
                  </button>
                  <ChevronRight className="h-4 w-4 text-on-surface/20" />
                </div>
              </div>
            </div>
          ))}

          <div ref={loaderRef} className="py-4 text-center">
            {hasMore && <p className="text-xs text-on-surface/40">加载更多...</p>}
            {!hasMore && displayed.length > 0 && (
              <p className="text-xs text-on-surface/30">已加载全部</p>
            )}
            {displayed.length === 0 && (
              <p className="py-8 text-sm text-on-surface/40">没有找到匹配的激活码</p>
            )}
          </div>
        </div>
      </div>

      {showResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setShowResult(false)}
        >
          <div
            className="w-full max-w-md rounded-[2rem] bg-white p-8 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface">生成成功</h3>
              <span className="text-sm text-on-surface/50">{generatedCodes.length} 个激活码</span>
            </div>
            <div className="mb-5 max-h-48 overflow-y-auto rounded-xl bg-surface-container p-4">
              {generatedCodes.map((code, i) => (
                <p key={i} className="py-1 font-mono text-sm text-on-surface">
                  {code}
                </p>
              ))}
            </div>
            <div className="space-y-2.5">
              <button
                onClick={handleCopyAll}
                className="w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-sm font-bold text-white"
              >
                复制全部激活码（{generatedCodes.length}个）
              </button>
              <button
                onClick={() => setShowResult(false)}
                className="w-full py-2 text-center text-sm text-on-surface/50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedCode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setSelectedCode(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-md flex-col rounded-[2rem] bg-white p-8 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-6 text-lg font-bold text-on-surface">激活码详情</h3>
            <div className="space-y-4 overflow-y-auto pr-1">
              <div className="rounded-xl bg-surface-container p-4">
                <p className="mb-1 text-xs text-on-surface/50">激活码</p>
                <p className="font-mono text-base font-bold text-on-surface">{selectedCode.code}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-container p-4">
                  <p className="mb-1 text-xs text-on-surface/50">状态</p>
                  <p
                    className={`text-sm font-bold ${
                      selectedCode.status === 'used' ? 'text-on-surface/50' : 'text-primary'
                    }`}
                  >
                    {selectedCode.status === 'used' ? '已使用' : '未使用'}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container p-4">
                  <p className="mb-1 text-xs text-on-surface/50">时效类型</p>
                  <p className="text-sm font-bold text-on-surface">
                    {durationLabels[selectedCode.durationType] || selectedCode.durationType}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <p className="mb-1 text-xs text-on-surface/50">创建时间</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.createdAt || '-'}</p>
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <p className="mb-1 text-xs text-on-surface/50">失效时间</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.expiresAt || '-'}</p>
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <p className="mb-1 text-xs text-on-surface/50">激活时间</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.activatedAt || '-'}</p>
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <p className="mb-1 text-xs text-on-surface/50">账号</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.username || '-'}</p>
              </div>
              <div className="rounded-xl bg-surface-container p-4">
                <p className="mb-1 text-xs text-on-surface/50">密码</p>
                <p className="text-sm font-bold text-on-surface">{selectedCode.password || '-'}</p>
              </div>
              <button
                onClick={() => setPendingDeleteCode(selectedCode)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 py-3.5 text-sm font-bold text-red-500"
              >
                <Trash2 className="h-4 w-4" />
                删除激活码
              </button>
              <button
                onClick={() => handleCopy(selectedCode.code)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-sm font-bold text-white"
              >
                <Copy className="h-4 w-4" />
                复制激活码
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setShowGenerate(false)}
        >
          <div
            className="w-full max-w-md rounded-[2rem] bg-white p-8 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-6 text-lg font-bold text-on-surface">生成激活码</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-on-surface/60">生成数量</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={form.count === 0 ? '' : form.count}
                  onChange={(e) => {
                    const rawValue = e.target.value
                    if (rawValue === '') {
                      setForm({ ...form, count: 0 })
                      return
                    }

                    const nextCount = parseInt(rawValue, 10)
                    setForm({ ...form, count: Number.isNaN(nextCount) ? 0 : Math.max(0, nextCount) })
                  }}
                  className="w-full rounded-full bg-surface-container px-5 py-3.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="请输入数量"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-on-surface/60">时效类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '1min', label: '1分钟' },
                    { value: '24h', label: '24小时' },
                    { value: '1year', label: '1年' },
                    { value: 'forever', label: '永久' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, durationType: opt.value })}
                      className={`rounded-full py-3 text-sm font-medium transition-all ${
                        form.durationType === opt.value
                          ? 'bg-gradient-to-r from-primary to-primary-container text-white'
                          : 'bg-surface-container text-on-surface/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleGenerate}
                className="w-full rounded-full bg-gradient-to-r from-primary to-primary-container py-3.5 text-sm font-bold text-white"
              >
                确认生成
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteCode && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface">确认删除</h3>
            <p className="mt-3 text-sm leading-7 text-on-surface/70">
              删除后，该激活码会立即失效。
              {pendingDeleteCode.username
                ? `已绑定的账号 ${pendingDeleteCode.username} 也会同步失效。`
                : '此操作不可恢复。'}
            </p>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setPendingDeleteCode(null)}
                className="flex-1 rounded-full bg-surface-container py-3 text-sm font-medium text-on-surface/70"
              >
                取消
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-primary-container py-3 text-sm font-bold text-white"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {activeDateField && (
        <div className="fixed inset-0 z-[125] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface">
                {activeDateField === 'start' ? '选择开始日期' : '选择结束日期'}
              </h3>
              <button
                onClick={() => setActiveDateField(null)}
                className="text-sm text-on-surface/50"
              >
                取消
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <select
                value={pickerYear}
                onChange={(e) => setPickerYear(Number(e.target.value))}
                className="rounded-2xl bg-surface-container px-3 py-3 text-sm text-on-surface focus:outline-none"
              >
                {Array.from({ length: 11 }, (_, index) => {
                  const year = new Date().getFullYear() - 5 + index
                  return (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  )
                })}
              </select>

              <select
                value={pickerMonth}
                onChange={(e) => setPickerMonth(Number(e.target.value))}
                className="rounded-2xl bg-surface-container px-3 py-3 text-sm text-on-surface focus:outline-none"
              >
                {Array.from({ length: 12 }, (_, index) => {
                  const month = index + 1
                  return (
                    <option key={month} value={month}>
                      {month}月
                    </option>
                  )
                })}
              </select>

              <select
                value={pickerDay}
                onChange={(e) => setPickerDay(Number(e.target.value))}
                className="rounded-2xl bg-surface-container px-3 py-3 text-sm text-on-surface focus:outline-none"
              >
                {Array.from({ length: daysInPickerMonth }, (_, index) => {
                  const day = index + 1
                  return (
                    <option key={day} value={day}>
                      {day}日
                    </option>
                  )
                })}
              </select>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  if (activeDateField === 'start') {
                    setActivatedStartDate('')
                  } else {
                    setActivatedEndDate('')
                  }
                  setActiveDateField(null)
                }}
                className="flex-1 rounded-full bg-surface-container py-3 text-sm font-medium text-on-surface/70"
              >
                清空
              </button>
              <button
                onClick={confirmDatePicker}
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-primary-container py-3 text-sm font-bold text-white"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-1/2 z-[130] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-on-surface/80 px-6 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-sm">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
