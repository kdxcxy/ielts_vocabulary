# IELTS 词汇故事项目说明

## 故事文件位置

- 故事内容：`lib/db/mock-stories.ts`
- 词汇数据：`public/data/words.json`
- 故事阅读页：`app/(main)/stories/[id]/page.tsx`

## 词汇与故事对应关系

每个词汇在 `words.json` 里有 `story_id` 字段，写故事N就用所有 `story_id === N` 的词汇，共94个。

页面加载时按 `story_id` 过滤，建成 `{ word → meaning_cn }` map：

```js
wordsData.filter(w => w.story_id === parseInt(id)).forEach(w => {
  vocabMap[w.word] = w.meaning_cn
})
```

## 故事写作规则

### 词汇要求
- 每个故事必须包含且仅包含该故事 `story_id` 对应的 **94个词汇**，一个不能多，一个不能少
- 每个词汇每次出现都必须用 `word [中文]` 格式标注
- 行内中文释义必须与 `words.json` 中 `meaning_cn` 语义一致，词性要匹配，中文注释只能从 `meaning_cn` 原文里取
- 单词后面的中文释义，需要从`meaning_cn`里完整的中文释义里，只取一个最贴合当前语境的中文义项
- 如果词表里的原始释义不适合这句，就先改句子，再用能成立的义项
- 最终目标不是“把词塞进去”，而是“句子读起来像正常故事” 

### 格式规范
- 词汇格式严格：`word [中文]`，词前后必须有空格
- 每次出现都必须带 `[中文]` 标注，否则页面无法识别，显示为黑色不可点击
- 词前不能紧跟标点（如 `，word` 或 `"word`），需改为 `， word`
- 段落间用空行（`\n\n`）分隔

### 词汇重复限制
- 94个词每个默认出现1次
- 最多允许2-3个词出现2次（每次都必须带标注）
- 绝不能有词出现3次及以上
- **重复词处理方式**：如果某个词需要在故事中再次出现，不能只删掉 `[中文]` 留下裸露英文词，必须把整个英文词也删掉，改用中文表达替换；裸露英文词（有词无注释）页面无法识别且影响阅读

### 叙事要求
- 开头强冲突，直接对话切入，第一句抓人，不要铺垫
- 段落简短有力，节奏紧凑，每段不超过3-4句
- 女性向审美：男主立体，有强势也有细腻，情感层次丰富
- 结尾留余韵，不刻意煽情，点到为止
- 故事要有完整弧线：冲突 → 转折 → 情感升温 → 结局
- 词汇要融入情节，不能生硬堆砌，读起来自然流畅
- 对话推动情节，减少大段叙述
- 标题即核心冲突，故事内容要紧扣标题展开
- **句子必须读起来顺畅，上下文通顺**：把英文词嵌入中文句子后，整句中文要能自然朗读，不能出现"给我一个天""第下一个天"这类读不通的组合；如果某个词嵌入后句子别扭，必须调整句子结构而不是强行保留
- **中文注释必须取自 `words.json` 的 `meaning_cn` 字段**，不能自己造释义；如果 `meaning_cn` 有多个义项，选与当前语境最匹配的那个，但不能超出原字段范围

## 三种学习模式实现

页面核心是 `parseContent` 函数，用正则 `/(\S+)\s+\[([^\]]+)\]/g` 扫描故事文本，匹配所有 `word [中文]` 格式，根据当前 `mode` state 决定渲染方式：

| 模式 | 名称 | 单词 | 中文 |
|------|------|------|------|
| `read` | 语境识词 | 彩色显示 | 显示 `[中文]` |
| `recall` | 忆境会词 | 彩色显示 | 隐藏 `[    ]` |
| `apply` | 化境用词 | `______` | 显示 `[中文]` |

切换逻辑：顶部三个按钮点击后更新 `mode` state，React 重新渲染 `parseContent` 输出。

点击词汇弹窗优先显示 `words.json` 里的完整释义，没有才用故事内嵌中文。

## 写故事的步骤

1. 确认故事id，从 `words.json` 取出所有 `story_id === N` 的94个词
2. 构思故事情节，把94个词自然融入叙事，每个词只用一次
3. 写作时每个词必须用 `word [中文]` 格式标注，词前后留空格
4. 注意词前不能紧跟标点（如 `，word` 或 `"word`），否则正则无法识别，需改为 `， word` 或 `\" word`
5. 写完后运行验证脚本，确认94个词全部覆盖、无超限重复
6. 将故事写入 `lib/db/mock-stories.ts` 对应 id 的 `content` 字段

## 验证脚本

写完故事后运行以下脚本验证（替换 N 为故事id）：

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('./lib/db/mock-stories.ts', 'utf8');
const start = content.indexOf('\"id\": N,');
const end = content.indexOf('\"id\": N+1,');
const section = content.substring(start, end);
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
else console.log('✓ 全部覆盖');
"
```

## 词汇颜色

`tailwind.config.ts` 中 `primary: '#b4005d'`（深玫红色），词汇用 `text-primary` 渲染。
