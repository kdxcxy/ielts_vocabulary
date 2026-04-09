const fs = require('fs');
const path = require('path');

// 故事1和故事2的完整内容
const stories = {
  1: `那天面试结束，我<span class="vocab" data-word="roughly">roughly</span>（粗略地）收拾好文件，心情<span class="vocab" data-word="meagre">meagre</span>（贫乏的）得像窗外的阴天。

走出大楼时，<span class="vocab" data-word="everywhere">everywhere</span>（到处）都是下班的人群。我在<span class="vocab" data-word="roundabout">roundabout</span>（环岛）等红绿灯，突然有人从身边跑过。

"<span class="vocab" data-word="attention">Attention</span>（注意）！"我下意识喊道。

那人回头，穿着西装，看起来<span class="vocab" data-word="super">super</span>（超级）着急。他<span class="vocab" data-word="sly">slyly</span>（狡猾地）笑了笑："抱歉。"

回家后，妈妈递给我一张<span class="vocab" data-word="poster">poster</span>（海报）大小的相亲资料。我<span class="vocab" data-word="scan">scanned</span>（扫视）一眼，<span class="vocab" data-word="silly">silly</span>（愚蠢地）笑了。

第二天咖啡厅，我又看到了那个男人。

"我叫陆景深。"他<span class="vocab" data-word="serenity">serenely</span>（平静地）说。

<span class="vocab" data-word="conversation">Conversation</span>（对话）很顺利。他说自己做投资，要<span class="vocab" data-word="patrol">patrol</span>（巡视）项目。我说刚面试完盛世集团。

一周后收到<span class="vocab" data-word="rejection">rejection</span>（拒绝）邮件时，他打来电话："要不要<span class="vocab" data-word="salvage">salvage</span>（挽救）一下心情？"

三个月后，他求婚了。"我不想<span class="vocab" data-word="lose">lose</span>（失去）你。"

婚后第一天，车停在盛世集团楼下。

"我是CEO。那天面试，我在观察室看着你。"他说。

我<span class="vocab" data-word="terrify">terrified</span>（惊恐）地瞪着他："所以你故意拒绝我？"

"因为我想以另一种方式聘用你——做我太太。"

从此，我的人生被他的爱<span class="vocab" data-word="immerse">immersed</span>（浸没）了。`,

  2: `婚礼前一天，姐姐突然失踪了。

"你去替她。"妈妈<span class="vocab" data-word="oath">oath</span>（发誓）般说道，"否则我们全家都完了。"

我<span class="vocab" data-word="enquiry">enquired</span>（询问）："为什么是我？"

"因为你们长得像。"她的语气充满<span class="vocab" data-word="degradation">degradation</span>（屈辱）。

婚礼当天，我穿着姐姐的婚纱，心里没有<span class="vocab" data-word="appreciation">appreciation</span>（欣赏），只有恐惧。新郎是商界<span class="vocab" data-word="outstanding">outstanding</span>（杰出的）人物，据说冷酷无情。

仪式开始，牧师问："你愿意吗？"

新郎转过身，看着我。那一刻，整个<span class="vocab" data-word="hemisphere">hemisphere</span>（半球）仿佛都安静了。

"林晚。"他突然叫出我的名字。

我<span class="vocab" data-word="snowbound">snowbound</span>（被雪困住）般僵在原地。他怎么知道我的名字？

"我愿意。"他说，眼里有<span class="vocab" data-word="brightness">brightness</span>（光亮）。

婚礼结束后，他带我回了别墅。

"你知道我不是林雪？"我<span class="vocab" data-word="occur">occurred</span>（想到）问道。

"从你走进教堂那刻起。"他倒了杯<span class="vocab" data-word="honey">honey</span>（蜂蜜）水给我，"你姐姐的眼神从来没有这么清澈过。"

我<span class="vocab" data-word="inject">injected</span>（注入）勇气问："那你为什么..."

"因为我等的就是你。"他递给我一束<span class="vocab" data-word="bouquet">bouquet</span>（花束），"三年前，你在医院救过我。"

记忆如<span class="vocab" data-word="torrent">torrent</span>（激流）般涌来。三年前，我确实救过一个车祸伤者。

"可是我们家欠你的钱..."

"那是你姐姐欠的，与你无关。"他说，"我调查过，你一直在打工还债，虽然<span class="vocab" data-word="insufficient">insufficient</span>（不足），但你从未放弃。"

我突然明白，这场婚姻不是<span class="vocab" data-word="worthless">worthless</span>（无价值的）交易，而是他精心策划的重逢。

"所以，"他<span class="vocab" data-word="invincible">invincibly</span>（无敌地）笑着，"欢迎回家，林晚。"

那一刻，我知道，这个看似<span class="vocab" data-word="gorilla">gorilla</span>（大猩猩）般强悍的男人，内心藏着最温柔的等待。`
};

// 更新mock-stories.ts
const mockStoriesPath = path.join(__dirname, '../lib/db/mock-stories.ts');
let content = fs.readFileSync(mockStoriesPath, 'utf8');

// 解析JSON
const match = content.match(/export const mockStories = (\[[\s\S]*\])/);
if (match) {
  const storiesData = JSON.parse(match[1]);
  
  // 更新故事1和2
  storiesData[0].content = stories[1];
  storiesData[1].content = stories[2];
  
  // 写回文件
  const newContent = `// 自动生成的故事数据\nexport const mockStories = ${JSON.stringify(storiesData, null, 2)}`;
  fs.writeFileSync(mockStoriesPath, newContent, 'utf8');
  
  console.log('✅ 已更新故事1和故事2的内容');
}
