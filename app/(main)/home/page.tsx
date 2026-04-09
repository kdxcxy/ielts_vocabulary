'use client'
import BottomNav from '@/components/BottomNav'
import { TrendingUp, Clock, BookOpen } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="bg-gradient-to-br from-primary to-primary-container px-6 pt-14 pb-12 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Hi, 学习者</h1>
            <p className="text-sm text-white/80">今天也要加油哦 💪</p>
          </div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <span className="text-2xl">🌸</span>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface">学习进度</h2>
            <span className="text-sm text-on-surface/60">本周</span>
          </div>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-5xl font-bold text-primary">0</span>
            <span className="text-lg text-on-surface/60 mb-2">/ 9400 词</span>
          </div>
          <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full" style={{width: '0%'}}></div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, label: '连续学习', value: '0', unit: '天', gradient: 'from-[#ff6b9d] to-[#c239b3]' },
            { icon: Clock, label: '学习时长', value: '0', unit: '分钟', gradient: 'from-tertiary to-[#764ba2]' },
            { icon: BookOpen, label: '完成故事', value: '0', unit: '篇', gradient: 'from-[#f093fb] to-[#f5576c]' },
          ].map((item, i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-4 shadow-sm">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-3`}>
                <item.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <p className="text-xs text-on-surface/60 mb-1">{item.label}</p>
              <p className="text-base font-bold text-on-surface">{item.value}<span className="text-sm font-normal text-on-surface/60 ml-1">{item.unit}</span></p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6">
        <h3 className="text-lg font-bold text-on-surface mb-4">快速开始</h3>
        <div className="space-y-3">
          <a href="/stories" className="block bg-gradient-to-r from-primary to-primary-container text-white py-4 rounded-full text-center font-bold text-base shadow-lg">
            开始学习
          </a>
          <a href="/bookmarks" className="block bg-surface-container-highest text-on-surface py-4 rounded-full text-center font-medium text-base">
            复习收藏
          </a>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
