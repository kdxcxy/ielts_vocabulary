import { readFileSync, writeFileSync } from 'fs'

const titles = JSON.parse(readFileSync('data/story_titles.json', 'utf-8'))

const categoryMap: Record<string, number> = {
  '霸道总裁': 1,
  '都市言情': 2,
  '现代甜宠': 3,
  '玄幻修仙': 4,
  '科幻': 5
}

const stories = titles.map((t: any) => ({
  id: t.story_id,
  categoryId: categoryMap[t.category],
  title: t.title,
  content: `这是《${t.title}》的故事内容占位符。\n\n故事中会包含约94个雅思词汇，以 word [中文] 的格式嵌入。`,
  wordCount: 94
}))

const code = `// 自动生成的故事数据
export const mockStories = ${JSON.stringify(stories, null, 2)}`

writeFileSync('lib/db/mock-stories.ts', code)
console.log(`✓ Generated ${stories.length} stories`)
