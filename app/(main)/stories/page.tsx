'use client'
import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'
import { Search, ChevronRight } from 'lucide-react'

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
      .then(res => res.json())
      .then(data => setStories(data.data || []))
  }, [activeCategory])

  const filtered = stories.filter(s => s.title.includes(searchText))

  return (
    <div className="min-h-screen bg-surface pb-20">
      {/* 顶部 */}
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-8">
        <h1 className="text-2xl font-bold text-white mb-4">故事列表</h1>
        {/* 搜索框 */}
        <div className="bg-white/20 backdrop-blur-sm rounded-full flex items-center px-4 py-3">
          <Search className="w-5 h-5 text-white/70 mr-3" />
          <input
            type="text"
            placeholder="搜索故事..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-transparent text-white placeholder:text-white/60 text-sm flex-1 focus:outline-none"
          />
        </div>
      </div>

      {/* 分类标签 */}
      <div className="px-6 -mt-4 mb-4">
        <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-lg">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
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

      {/* 故事列表 */}
      <div className="px-6 space-y-3">
        {filtered.map((story, i) => (
          <a
            key={story.id}
            href={`/stories/${story.id}`}
            className="block bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center p-4">
              {/* 左侧渐变色块 */}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex-shrink-0 flex items-center justify-center mr-4`}>
                <span className="text-white text-2xl font-bold">{story.id}</span>
              </div>
              {/* 右侧内容 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-on-surface truncate">{story.title}</h3>
                <p className="text-xs text-on-surface/50 mt-1">{story.wordCount} 个词汇</p>
              </div>
              <ChevronRight className="w-5 h-5 text-on-surface/30 flex-shrink-0 ml-2" />
            </div>
          </a>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
