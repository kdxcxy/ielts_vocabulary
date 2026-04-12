const fs = require('fs');
const path = require('path');

const words = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/words.json'), 'utf8'));
const titles = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/story_titles.json'), 'utf8'));

// 按故事分组词汇
const wordsByStory = {};
words.forEach(w => {
  if (!wordsByStory[w.story_id]) wordsByStory[w.story_id] = [];
  wordsByStory[w.story_id].push(w);
});

// 分类ID映射
const categoryMap = {
  '霸道总裁': 1, '都市言情': 2, '现代甜宠': 3, '玄幻仙侠': 4, '科幻': 5
};

// 生成简化故事内容
function generateSimpleContent(title, wordList) {
  const vocabSpans = wordList.map(w => 
    `<span class="vocab" data-word="${w.word}" data-meaning="${w.meaning_cn}">${w.word}</span>`
  ).join('、');
  
  return `《${title}》\n\n本故事包含以下雅思词汇：\n\n${vocabSpans}\n\n点击任意词汇查看详细释义和例句。`;
}

// 生成所有故事
const stories = titles.map(t => ({
  id: t.story_id,
  categoryId: categoryMap[t.category],
  title: t.title,
  content: generateSimpleContent(t.title, wordsByStory[t.story_id] || []),
  wordCount: (wordsByStory[t.story_id] || []).length
}));

// 输出
const output = `// 自动生成的故事数据\nexport const mockStories = ${JSON.stringify(stories, null, 2)}`;
fs.writeFileSync(path.join(__dirname, '../lib/db/mock-stories.ts'), output, 'utf8');

console.log(`✅ 已生成 ${stories.length} 个故事内容`);
