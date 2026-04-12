'use client'
import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { ArrowLeft, Bookmark, Volume2, Share2, BookOpen, Pen, Brain } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { TOKEN_STORAGE_KEY } from '@/lib/constants'

type Mode = 'read' | 'recall' | 'apply'

export default function StoryReadPage({ params }: { params: Promise<{ id: string }> }) {
  const [story, setStory] = useState<{ id: number; title: string; content: string } | null>(null)
  const [mode, setMode] = useState<Mode>('read')
  const [selectedWord, setSelectedWord] = useState<{ word: string; translation: string } | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [storyId, setStoryId] = useState<string>('')
  const [vocabularies, setVocabularies] = useState<Record<string, string>>({})

  useEffect(() => {
    params.then(async p => {
      setStoryId(p.id)
      const res = await fetch(`/api/stories/${p.id}`)
      const data = await res.json()
      if (data.data) {
        setStory(data.data)
      }
      
      // 加载词汇完整释义
      const wordsRes = await fetch('/data/words.json')
      const wordsData = await wordsRes.json()
      const vocabMap: Record<string, string> = {}
      wordsData.filter((w: any) => w.story_id === parseInt(p.id)).forEach((w: any) => {
        vocabMap[w.word] = w.meaning_cn
      })
      setVocabularies(vocabMap)
    })
  }, [params])

  const handleBookmark = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (bookmarked) {
      fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ wordId: 0, storyId: +storyId })
      })
    }
    setBookmarked(!bookmarked)
  }

  // 解析故事内容，识别词汇
  const parseContent = (content: string) => {
    const paragraphs = content.split('\n\n')
    
    return paragraphs.map((para, pIndex) => {
      // 匹配格式：word [中文]
      const regex = /([A-Za-z][A-Za-z.\/-]*(?:\s+[A-Za-z][A-Za-z.\/-]*)*)\s+\[([^\]]+)\]/g
      const parts: JSX.Element[] = []
      let lastIndex = 0
      let match

      while ((match = regex.exec(para)) !== null) {
        // 添加词汇前的文本
        if (match.index > lastIndex) {
          parts.push(<span key={`text-${pIndex}-${lastIndex}`}>{para.slice(lastIndex, match.index)}</span>)
        }

        const word = match[1]
        const translation = match[2]

        // 根据模式显示不同内容
        if (mode === 'read') {
          // 语境识词：word [中文]
          parts.push(
            <span key={`word-${pIndex}-${match.index}`}>
              <span 
                onClick={() => setSelectedWord({ word, translation: vocabularies[word] || translation })}
                className="text-primary cursor-pointer hover:text-primary-container font-medium mx-1"
              >
                {word}
              </span>
              <span className="text-on-surface/60 text-sm mx-1">[{translation}]</span>
            </span>
          )
        } else if (mode === 'recall') {
          // 忆境会词：word [  ]
          parts.push(
            <span key={`word-${pIndex}-${match.index}`}>
              <span 
                onClick={() => setSelectedWord({ word, translation: vocabularies[word] || translation })}
                className="text-primary cursor-pointer hover:text-primary-container font-medium mx-1"
              >
                {word}
              </span>
              <span className="text-on-surface/30 text-sm mx-1">[    ]</span>
            </span>
          )
        } else {
          // 化境用词：     [中文]
          parts.push(
            <span key={`word-${pIndex}-${match.index}`}>
              <span 
                onClick={() => setSelectedWord({ word, translation: vocabularies[word] || translation })}
                className="text-primary/30 cursor-pointer hover:text-primary-container font-medium mx-1"
              >
                ______
              </span>
              <span className="text-on-surface/60 text-sm mx-1">[{translation}]</span>
            </span>
          )
        }

        lastIndex = regex.lastIndex
      }

      // 添加剩余文本
      if (lastIndex < para.length) {
        parts.push(<span key={`text-${pIndex}-${lastIndex}`}>{para.slice(lastIndex)}</span>)
      }

      return (
        <p key={`para-${pIndex}`} className="mb-6 last:mb-0">
          {parts}
        </p>
      )
    })
  }

  if (!story) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="text-on-surface/60">加载中...</p>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* 固定顶部 */}
      <div className="flex-shrink-0">
        {/* 顶部导航 */}
        <div className="bg-gradient-to-br from-primary to-primary-container px-4 pt-14 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center">
              <a href="/stories" className="w-10 h-10 shrink-0 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mr-3">
                <ArrowLeft className="w-5 h-5 text-white" />
              </a>
              <h1 className="text-base leading-snug font-bold text-white break-words whitespace-normal">
                {story.title}
              </h1>
            </div>
            {/* <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleBookmark} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Bookmark className={`w-5 h-5 ${bookmarked ? 'text-yellow-300 fill-yellow-300' : 'text-white'}`} />
              </button>
              <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div> */}
          </div>
        </div>

        {/* 学习模式切换 */}
        <div className="px-4 -mt-3 mb-2">
          <div className="bg-surface-container-lowest rounded-2xl p-2 shadow-lg flex">
            {[
              { icon: BookOpen, label: '语境识词', value: 'read' as Mode },
              { icon: Brain, label: '忆境会词', value: 'recall' as Mode },
              { icon: Pen, label: '化境用词', value: 'apply' as Mode },
            ].map(item => (
              <button
                key={item.value}
                onClick={() => setMode(item.value)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 rounded-xl transition-colors ${
                  mode === item.value ? 'bg-primary text-white' : 'text-on-surface/50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 可滚动的故事内容 */}
      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-2">
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm leading-loose text-base text-on-surface">
          {parseContent(story.content)}
        </div>
      </div>

      {/* 词汇弹窗 */}
      {selectedWord && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedWord(null)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-on-surface">{selectedWord.word}</h3>
                <p className="text-sm text-on-surface/50 mt-1">/example/</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-primary" />
                </button>
                <button className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>
            <div className="bg-surface-container rounded-xl p-4 mb-6">
              <p className="text-base text-on-surface">{selectedWord.translation}</p>
            </div>
            <button onClick={() => setSelectedWord(null)} className="w-full bg-gradient-to-r from-primary to-primary-container text-white py-3.5 rounded-full font-bold text-base">
              我记住了
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
