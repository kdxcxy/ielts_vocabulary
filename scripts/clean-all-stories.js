const fs = require('fs');
const path = require('path');

const mockStoriesPath = path.join(__dirname, '../lib/db/mock-stories.ts');
let content = fs.readFileSync(mockStoriesPath, 'utf-8');

// 移除所有 <span class="vocab" ...> 和 </span> 标签
content = content.replace(/<span class="vocab"[^>]*>/g, '');
content = content.replace(/<\/span>/g, '');

fs.writeFileSync(mockStoriesPath, content, 'utf-8');
console.log('✅ 已清理所有故事的span标签');
