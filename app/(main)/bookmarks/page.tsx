'use client'

import { useEffect, useState } from 'react'
import type { UIEvent } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import BookmarkWordModal, { type BookmarkWordDetail } from '@/components/BookmarkWordModal'
import { BookOpen, Search, Star, Trash2 } from 'lucide-react'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'
import { needsDictionaryHydration } from '@/lib/story-word-detail'

type Bookmark = BookmarkWordDetail

const PAGE_SIZE = 20

function parseDictionaryPhonetics(data: any) {
  return {
    phoneticUs: data?.phoneticUs || '',
    phoneticUk: data?.phoneticUk || '',
    audioUs: data?.audioUs || '',
    audioUk: data?.audioUk || '',
  }
}

function containsChinese(text: string) {
  return /[\u4e00-\u9fff]/.test(text)
}

function stripPartOfSpeechMarkers(text: string) {
  return text.replace(/\b(?:adj|adv|n|v|vi|vt|prep|pron|conj|int)\.?(?:\/(?:adj|adv|n|v|vi|vt|prep|pron|conj|int)\.?)*\b/gi, ' ')
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const [pendingDeleteBookmark, setPendingDeleteBookmark] = useState<Bookmark | null>(null)
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null)
  const [loadingWordDetail, setLoadingWordDetail] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)

    fetch('/api/bookmarks', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((data) => setBookmarks(data.data || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [search])

  useEffect(() => {
    if (!toastMessage) return

    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return true

    if (containsChinese(keyword)) {
      const cleanedTranslation = stripPartOfSpeechMarkers(bookmark.translation).toLowerCase()
      return (
        cleanedTranslation.includes(keyword) ||
        bookmark.storyTitle?.toLowerCase().includes(keyword)
      )
    }

    return bookmark.word.toLowerCase().includes(keyword)
  })

  const visibleBookmarks = filteredBookmarks.slice(0, visibleCount)
  const hasMore = visibleCount < filteredBookmarks.length

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const reachedBottom =
      element.scrollTop + element.clientHeight >= element.scrollHeight - 48

    if (reachedBottom && hasMore) {
      setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredBookmarks.length))
    }
  }

  const openBookmarkDetail = async (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark)

    if (!needsDictionaryHydration(bookmark)) {
      return
    }

    setLoadingWordDetail(true)

    try {
      const response = await fetch(`/api/dictionary/${encodeURIComponent(bookmark.word.toLowerCase())}`, {
        cache: 'no-store',
      })
      if (!response.ok) return

      const data = await response.json()
      const parsed = parseDictionaryPhonetics(data.data)

      setSelectedBookmark((current) =>
        current && current.id === bookmark.id ? { ...current, ...parsed } : current
      )

      setBookmarks((current) =>
        current.map((item) => (item.id === bookmark.id ? { ...item, ...parsed } : item))
      )
    } finally {
      setLoadingWordDetail(false)
    }
  }

  const executeRemove = async (bookmarkToDelete = pendingDeleteBookmark) => {
    if (!bookmarkToDelete) return

    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    const response = await fetch(`/api/bookmarks/${bookmarkToDelete.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      setToastMessage('取消收藏失败')
      return
    }

    setBookmarks((current) => current.filter((bookmark) => bookmark.id !== bookmarkToDelete.id))
    setPendingDeleteBookmark(null)
    setSelectedBookmark((current) => (current?.id === bookmarkToDelete.id ? null : current))
    setToastMessage('已取消收藏')
  }

  const handleToggleBookmark = async () => {
    if (!selectedBookmark || bookmarkLoading) return

    setBookmarkLoading(true)
    await executeRemove(selectedBookmark)
    setBookmarkLoading(false)
  }

  return (
    <div className="flex h-screen flex-col bg-surface">
      <div className="flex-shrink-0">
        <div className="bg-gradient-to-br from-primary to-primary-container px-5 pt-14 pb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">我的收藏</h1>
            <span className="text-sm text-white/70">{filteredBookmarks.length} 个单词</span>
          </div>

          <div className="mt-4 flex items-center rounded-full bg-white/20 px-4 py-3 backdrop-blur-sm">
            <Search className="mr-3 h-5 w-5 text-white/70" />
            <input
              type="text"
              placeholder="搜索单词..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-20" onScroll={handleScroll}>
        <div className="pt-3 space-y-3 pb-6">
          {loading ? (
            <div className="py-16 text-center text-sm text-on-surface/40">加载中...</div>
          ) : visibleBookmarks.length > 0 ? (
            visibleBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                onClick={() => openBookmarkDetail(bookmark)}
                className="block w-full rounded-[1.75rem] bg-surface-container-lowest p-4 text-left shadow-sm transition-transform active:scale-[0.99]"
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openBookmarkDetail(bookmark)
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <h3 className="truncate text-lg font-bold text-on-surface">{bookmark.word}</h3>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-7 text-on-surface/70">
                      {bookmark.translation}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setPendingDeleteBookmark(bookmark)
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface/45"
                    aria-label={`删除收藏 ${bookmark.word}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-on-surface/45">
                  <BookOpen className="h-3.5 w-3.5" />
                  {bookmark.storyId ? (
                    <Link
                      href={`/stories/${bookmark.storyId}`}
                      onClick={(event) => event.stopPropagation()}
                      className="truncate font-medium text-primary"
                    >
                      {bookmark.storyTitle || `故事 ${bookmark.storyId}`}
                    </Link>
                  ) : (
                    <span>未关联故事</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center">
              <span className="mb-4 block text-5xl">📎</span>
              <p className="text-sm text-on-surface/40">还没有收藏的单词</p>
              <Link href="/stories" className="mt-2 inline-block text-sm font-medium text-primary">
                去学词
              </Link>
            </div>
          )}

          {!loading && hasMore && (
            <div className="py-4 text-center text-xs text-on-surface/35">继续下滑加载更多</div>
          )}
        </div>
      </div>

      {selectedBookmark && (
        <BookmarkWordModal
          detail={selectedBookmark}
          loadingWordDetail={loadingWordDetail}
          bookmarkLoading={bookmarkLoading}
          onClose={() => setSelectedBookmark(null)}
          onToggleBookmark={handleToggleBookmark}
        />
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 z-[130] -translate-x-1/2 rounded-full bg-on-surface/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
          {toastMessage}
        </div>
      )}

      {pendingDeleteBookmark && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-on-surface">确认删除</h3>
            <p className="mt-3 text-sm leading-7 text-on-surface/70">
              删除后，单词 {pendingDeleteBookmark.word} 会从收藏列表移除，此操作不可恢复。
            </p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteBookmark(null)}
                className="flex-1 rounded-full bg-surface-container py-3 text-sm font-medium text-on-surface/70"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => executeRemove()}
                className="flex-1 rounded-full bg-gradient-to-r from-primary to-primary-container py-3 text-sm font-bold text-white"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
