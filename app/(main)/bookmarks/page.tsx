'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { Search, Trash2, Volume2, BookOpen } from 'lucide-react'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'

interface Bookmark {
  id: number
  word: string
  translation: string
  storyId: number
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    fetch('/api/bookmarks', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBookmarks(data.data || []))
  }, [])

  const filtered = bookmarks.filter(b =>
    b.word.toLowerCase().includes(search.toLowerCase()) ||
    b.translation.includes(search)
  )

  const handleRemove = async (id: number) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    await fetch(`/api/bookmarks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    setBookmarks(bookmarks.filter(b => b.id !== id))
  }

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* 顶部 */}
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">我的收藏</h1>
          <span className="text-sm text-white/70">{filtered.length} 个单词</span>
        </div>
        {/* 搜索框 */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full flex items-center px-4 py-3 mt-4">
          <Search className="w-5 h-5 text-white/70 mr-3" />
          <input
            type="text"
            placeholder="搜索单词..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-white placeholder:text-white/60 text-sm flex-1 focus:outline-none"
          />
        </div>
      </div>

      {/* 收藏列表 */}
      <div className="px-6 -mt-4 space-y-3">
        {filtered.map(b => (
          <div key={b.id} className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-on-surface">{b.word}</h3>
                <p className="text-xs text-on-surface/40 mt-1">/example/</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-primary" />
                </button>
                <button onClick={() => handleRemove(b.id)} className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-on-surface/40" />
                </button>
              </div>
            </div>
            <p className="text-sm text-on-surface/70">{b.translation}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-on-surface/40">
              <BookOpen className="w-3 h-3" />
              <span>故事 #{b.storyId}</span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📚</span>
            <p className="text-on-surface/40 text-sm">还没有收藏的单词</p>
            <a href="/stories" className="text-primary text-sm font-medium mt-2 inline-block">去学习 →</a>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
