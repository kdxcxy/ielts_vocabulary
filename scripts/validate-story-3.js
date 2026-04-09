const fs = require('fs');

// 读取故事3的词汇列表
const words = require('../data/words.json').filter(w => w.story_id === 3);
const storyContent = fs.readFileSync('./lib/stories/story-3.ts', 'utf-8');

// 提取故事中所有标注的词汇
const vocabPattern = /([\w-]+)\s+\[([^\]]+)\]/g;
const foundWords = [];
let match;

while ((match = vocabPattern.exec(storyContent)) !== null) {
  foundWords.push(match[1]);
}

// 统计每个词出现次数
const wordCount = {};
foundWords.forEach(word => {
  wordCount[word] = (wordCount[word] || 0) + 1;
});

console.log('=== 词汇使用统计 ===');
console.log(`应使用词汇数: ${words.length}`);
console.log(`实际标注词汇数: ${foundWords.length}`);
console.log(`去重后词汇数: ${Object.keys(wordCount).length}`);

// 检查缺失的词
const requiredWords = words.map(w => w.word);
const missingWords = requiredWords.filter(w => !wordCount[w]);
if (missingWords.length > 0) {
  console.log('\n❌ 缺失的词汇:');
  missingWords.forEach(w => console.log(`  - ${w}`));
}

// 检查重复超过2次的词
const overused = Object.entries(wordCount).filter(([_, count]) => count > 2);
if (overused.length > 0) {
  console.log('\n❌ 重复超过2次的词汇:');
  overused.forEach(([word, count]) => console.log(`  - ${word}: ${count}次`));
}

// 检查重复2次的词
const usedTwice = Object.entries(wordCount).filter(([_, count]) => count === 2);
console.log(`\n✓ 重复2次的词汇数: ${usedTwice.length} (允许2-3个)`);
if (usedTwice.length > 0) {
  usedTwice.forEach(([word, count]) => console.log(`  - ${word}: ${count}次`));
}

// 检查多余的词（不在词汇表中的）
const extraWords = Object.keys(wordCount).filter(w => !requiredWords.includes(w));
if (extraWords.length > 0) {
  console.log('\n⚠️  不在词汇表中的词:');
  extraWords.forEach(w => console.log(`  - ${w}`));
}

if (missingWords.length === 0 && overused.length === 0) {
  console.log('\n✅ 词汇验证通过！');
} else {
  console.log('\n❌ 词汇验证失败，请修正。');
  process.exit(1);
}
