# 故事阅读功能说明

## 故事数据

- 所有故事存放在 `lib/db/mock-stories.ts`，按 `id` 顺序排列
- 每个故事字段：`id`、`categoryId`、`title`、`content`、`wordCount`
- 词汇数据在 `public/data/words.json`，每条有 `story_id` 字段与故事绑定

## 词汇与故事对应

- 写故事N，就用所有 `story_id === N` 的词汇，共94个
- 页面加载时按 `story_id` 过滤，建成 `{ word → meaning_cn }` map
- 点击词汇弹窗优先显示 `words.json` 的完整释义，没有则用故事内嵌中文

## 故事写作规范

### 格式
- 词汇格式严格：`word [中文]`，词前后必须有空格
- 每次出现都必须带 `[中文]` 标注，否则页面无法识别，显示为黑色不可点击
- 段落间用空行（`\n\n`）分隔

### 词汇重复限制
- 94个词每个默认出现1次
- 最多允许2-3个词出现2次（每次都必须带标注）
- 绝不能有词出现3次及以上

### 叙事要求
- 开头强冲突，直接对话切入，第一句抓人
- 段落简短有力，节奏紧凑
- 女性向：男主立体（强势+细腻），情感层次丰富
- 结尾留余韵，不刻意

### 验证方法
写完后用以下脚本验证：
```js
node -e "
const fs = require('fs');
const content = fs.readFileSync('./lib/db/mock-stories.ts', 'utf8');
const story3Start = content.indexOf('\"id\": N,'); // 替换N为故事id
const story3End = content.indexOf('\"id\": N+1,');
const section = content.substring(story3Start, story3End);
const contentMatch = section.match(/\"content\": \"([\s\S]+?)\",\n\s+\"wordCount\"/);
const storyContent = contentMatch[1];
const matches = storyContent.match(/\s\S+\s+\[[^\]]+\]/g) || [];
const words = matches.map(m => m.trim().match(/^(\S+)\s+\[/)[1]);
const uniqueWords = [...new Set(words)];
const counts = {};
words.forEach(w => counts[w] = (counts[w] || 0) + 1);
const repeated = Object.entries(counts).filter(([w,c]) => c > 1);
const over2 = repeated.filter(([w,c]) => c > 2);
if (repeated.length) console.log('重复:', repeated.map(([w,c]) => w+':'+c+'次').join(', '));
if (over2.length) console.log('❌ 超过2次:', over2);
const storyWords = require('./data/words.json').filter(w => w.story_id === N).map(w => w.word);
const missing = storyWords.filter(w => !uniqueWords.includes(w));
if (missing.length) console.log('❌ 遗漏:', missing);
else console.log('✓ 94个词全部覆盖');
"
```

## 三种学习模式实现

页面文件：`app/(main)/stories/[id]/page.tsx`

核心是 `parseContent` 函数，用正则 `/(\S+)\s+\[([^\]]+)\]/g` 扫描故事文本，匹配所有 `word [中文]` 格式，根据当前 `mode` state 决定渲染方式：

| 模式 | 名称 | 单词 | 中文 |
|------|------|------|------|
| `read` | 语境识词 | 彩色显示 | 显示 `[中文]` |
| `recall` | 忆境会词 | 彩色显示 | 隐藏 `[    ]` |
| `apply` | 化境用词 | `______` | 显示 `[中文]` |

切换逻辑：顶部三个按钮点击更新 `mode` state，React 重新渲染 `parseContent` 输出即可。

## 词汇颜色

`tailwind.config` 中 `primary: '#b4005d'`（深玫红色），词汇用 `text-primary` 渲染。
