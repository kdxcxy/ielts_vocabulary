'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import { ChevronRight, Search } from 'lucide-react'

interface Story {
  id: number
  title: string
  categoryId: number
  wordCount: number
  coverImage?: string
}

const categories = [
  { id: 0, name: '全部', icon: null },
  { id: 1, name: '霸道总裁', icon: null },
  { id: 2, name: '都市言情', icon: null },
  { id: 3, name: '现代甜宠', icon: null },
  { id: 4, name: '玄幻仙侠', icon: null },
  { id: 5, name: '科幻', icon: null },
]

const gradients = [
  'from-[#ff9a9e] to-[#fecfef]',
  'from-[#a18cd1] to-[#fbc2eb]',
  'from-[#ffecd2] to-[#fcb69f]',
  'from-[#667eea] to-[#764ba2]',
  'from-[#f093fb] to-[#f5576c]',
  'from-[#4facfe] to-[#00f2fe]',
  'from-[#43e97b] to-[#38f9d7]',
  'from-[#fa709a] to-[#fee140]',
]

export default function StoriesPage() {
  const [activeCategory, setActiveCategory] = useState(0)
  const [stories, setStories] = useState<Story[]>([])
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const url = activeCategory === 0 ? '/api/stories' : `/api/stories?categoryId=${activeCategory}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => setStories(data.data || []))
  }, [activeCategory])

  const filtered = stories.filter((story) => story.title.includes(searchText))

  return (
    <div className="h-screen flex flex-col bg-surface">
      <div className="flex-shrink-0">
        <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-8">
          <h1 className="mb-4 text-2xl font-bold text-white">故事列表</h1>
          <div className="flex items-center rounded-full bg-white/20 px-4 py-3 backdrop-blur-sm">
            <Search className="mr-3 h-5 w-5 text-white/70" />
            <input
              type="text"
              placeholder="搜索故事..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 focus:outline-none"
            />
          </div>
        </div>

        <div className="-mt-4 mb-4 px-6">
          <div className="rounded-2xl bg-surface-container-lowest p-3 shadow-lg">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === cat.id
                      ? 'bg-gradient-to-r from-primary to-primary-container text-white shadow-md'
                      : 'bg-surface-container text-on-surface/70'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-20">
        <div className="space-y-3">
          {filtered.map((story, i) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="block overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center p-4">
                <div
                  className={`mr-4 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
                    gradients[i % gradients.length]
                  }`}
                >
                  <span className="text-2xl font-bold text-white">{story.id}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-on-surface">{story.title}</h3>
                  <p className="mt-1 text-xs text-on-surface/50">{story.wordCount} 个词汇</p>
                </div>
                <ChevronRight className="ml-2 h-5 w-5 flex-shrink-0 text-on-surface/30" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
