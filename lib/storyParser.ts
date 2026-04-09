export interface StorySegment {
  type: 'text' | 'word'
  content: string
  translation?: string
  position?: number
}

// 从API获取词汇列表
export async function parseStoryContent(rawText: string, storyId: number): Promise<StorySegment[]> {
  // 获取该故事的词汇列表
  const wordsRes = await fetch(`/api/stories/${storyId}/words`)
  const wordsData = await wordsRes.json()
  const words = wordsData.data || []
  
  // 创建词汇映射
  const wordMap = new Map<string, string>()
  words.forEach((w: any) => {
    wordMap.set(w.word.toLowerCase(), w.meaning_cn)
  })
  
  // 匹配词汇的正则
  const wordPattern = Array.from(wordMap.keys()).join('|')
  const regex = new RegExp(`\\b(${wordPattern})\\b`, 'gi')
  
  const segments: StorySegment[] = []
  let lastIndex = 0
  let match
  
  while ((match = regex.exec(rawText)) !== null) {
    // 添加前面的文本
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: rawText.slice(lastIndex, match.index) })
    }
    
    // 添加词汇
    const word = match[1]
    segments.push({
      type: 'word',
      content: word,
      translation: wordMap.get(word.toLowerCase()) || ''
    })
    
    lastIndex = regex.lastIndex
  }
  
  // 添加剩余文本
  if (lastIndex < rawText.length) {
    segments.push({ type: 'text', content: rawText.slice(lastIndex) })
  }
  
  return segments
}
