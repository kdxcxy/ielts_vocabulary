const fs = require('fs');
const path = require('path');

// 读取词汇数据
const words = require('../data/words.json');
const storyTitles = require('../data/story_titles.json');

// 按故事ID分组词汇
const storyWords = {};
words.forEach(w => {
  if (!storyWords[w.story_id]) storyWords[w.story_id] = [];
  storyWords[w.story_id].push(w);
});

console.log('故事总数:', Object.keys(storyWords).length);
console.log('词汇总数:', words.length);
console.log('每个故事平均词汇数:', Math.round(words.length / Object.keys(storyWords).length));

// 生成故事列表
const stories = storyTitles.map(st => ({
  id: st.id,
  title: st.title,
  categoryId: st.categoryId,
  words: storyWords[st.id] || []
}));

console.log('\n故事列表:');
stories.slice(0, 10).forEach(s => {
  console.log(`${s.id}. ${s.title} (${s.words.length}个词汇)`);
});

console.log('\n准备生成100个故事...');
