const fs = require('fs');
const path = require('path');

const mockStoriesPath = path.join(__dirname, '../lib/db/mock-stories.ts');
let content = fs.readFileSync(mockStoriesPath, 'utf-8');

// 强力清除所有span标签及其属性
content = content.replace(/<span[^>]*>/g, '');
content = content.replace(/<\/span>/g, '');

fs.writeFileSync(mockStoriesPath, content, 'utf-8');
console.log('✅ 已强力清理所有span标签');
