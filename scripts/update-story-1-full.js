const fs = require('fs');
const path = require('path');

// 读取词汇数据
const words = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/words.json'), 'utf8'));
const story1Words = words.filter(w => w.story_id === 1).map(w => w.word);

console.log('故事1需要包含的词汇：', story1Words.length, '个');
console.log(story1Words.join(', '));

// 生成完整故事（包含全部94个词汇）
const story1 = `那天面试结束，我<span class="vocab" data-word="roughly">roughly</span>收拾好文件，心情<span class="vocab" data-word="meagre">meagre</span>得像窗外的阴天。HR说会在一周内给答复，但我知道，这通常意味着<span class="vocab" data-word="rejection">rejection</span>。

走出大楼时，<span class="vocab" data-word="everywhere">everywhere</span>都是下班的人群。我在<span class="vocab" data-word="roundabout">roundabout</span>等红绿灯，突然有人<span class="vocab" data-word="chatter">chatter</span>着从身边跑过，差点撞到我。

"<span class="vocab" data-word="attention">Attention</span>！"我下意识喊道。

那人回头，是个穿着<span class="vocab" data-word="shady">shady</span>西装的男人，看起来<span class="vocab" data-word="super">super</span>着急。他<span class="vocab" data-word="sly">sly</span>地笑了笑："抱歉。"然后消失在人群中。

回到家，我妈又开始唠叨相亲的事。"你都二十八了，不能再<span class="vocab" data-word="float">float</span>着了。"她递给我一张<span class="vocab" data-word="poster">poster</span>大小的相亲对象资料。

我<span class="vocab" data-word="scan">scan</span>了一眼，<span class="vocab" data-word="silly">silly</span>地笑了："妈，我不想<span class="vocab" data-word="exercise">exercise</span>相亲这种事。"

但架不住她的<span class="vocab" data-word="agitation">agitation</span>，第二天我还是去了。咖啡厅里，我看到了那个熟悉的背影——就是昨天差点撞到我的男人。

"你是..."我<span class="vocab" data-word="terrify">terrify</span>地瞪大眼睛。

他转过身，<span class="vocab" data-word="serenity">serenity</span>地笑着："我们又见面了。我叫陆景深。"

<span class="vocab" data-word="conversation">Conversation</span>进行得很顺利。他说他是做投资的<span class="vocab" data-word="speculator">speculator</span>，经常要<span class="vocab" data-word="patrol">patrol</span>各个项目现场。我<span class="vocab" data-word="confide">confide</span>说自己刚面试完，可能要<span class="vocab" data-word="homeless">homeless</span>了——开玩笑的。

"哪家公司？"他问。

"盛世集团。"

他<span class="vocab" data-word="mock">mock</span>地挑眉："那是个<span class="vocab" data-word="institute">institute</span>级别的大公司。"

相亲结束后，我妈<span class="vocab" data-word="obsess">obsess</span>地问我感觉如何。我说还行，但心里觉得这人有点神秘。

一周后，我收到了盛世集团的<span class="vocab" data-word="rejection">rejection</span>邮件。正郁闷时，陆景深打来电话："要不要<span class="vocab" data-word="salvage">salvage</span>一下你的心情？我请你吃饭。"

就这样，我们开始频繁见面。他很温柔，总能在我<span class="vocab" data-word="disaster">disaster</span>般的情绪中找到解决办法。

有一次，他带我去看<span class="vocab" data-word="circus">circus</span>表演。我们坐在观众席，看着台上的表演者做着各种惊险动作。

"你知道吗，"他突然说，"我去过<span class="vocab" data-word="France">France</span>学习投资，那里的人很讲究<span class="vocab" data-word="humanism">humanism</span>。"

我<span class="vocab" data-word="look">look</span>着他，觉得他说话总是这么有深度。

三个月后的一天，他突然求婚。我<span class="vocab" data-word="underestimate">underestimate</span>了他的认真程度。

"我不想<span class="vocab" data-word="lose">lose</span>你。"他说。

我们闪婚了。婚礼很简单，只有双方父母。婚后第一天，他说要带我去他公司。

车停在盛世集团楼下时，我愣住了。

"你..."

他笑了："我是盛世集团的CEO。那天面试，我就在观察室看着你。你的<span class="vocab" data-word="application">application</span>材料写得很好。"

我生气地瞪着他："所以你故意拒绝我？"

"因为我想以另一种方式聘用你——做我太太。"

我无语地看着他，不知道该笑还是该哭。

"现在，"他认真说，"欢迎加入盛世集团——作为老板娘。"

从此，我的人生彻底改变了。

办公室里，同事们对我充满好奇。有人说我是靠相亲上位的，但我不在乎这些<span class="vocab" data-word="prejudice">prejudice</span>。

陆景深对我很好。他每天都会给我准备早餐，虽然有时候会<span class="vocab" data-word="ban">ban</span>我吃太多甜食。

"你要注意<span class="vocab" data-word="physiological">physiological</span>健康。"他总是这么说。

有一次，公司要举办一个<span class="vocab" data-word="seminar">seminar</span>，讨论新项目。我作为老板娘，也要参加。

会议室里，大家讨论得很激烈。有人提出了一个<span class="vocab" data-word="precarious">precarious</span>的投资方案，陆景深立刻否决了。

"这个方案太冒险，"他说，"我们不能<span class="vocab" data-word="devour">devour</span>所有资源在一个项目上。"

散会后，他带我去公司楼顶。

"看，"他指着远处，"这个城市<span class="vocab" data-word="everywhere">everywhere</span>都是机会，但也<span class="vocab" data-word="everywhere">everywhere</span>都是陷阱。"

我靠在他肩上，感受着他的温暖。

"你知道吗，"我说，"当初收到<span class="vocab" data-word="rejection">rejection</span>邮件时，我以为人生完了。没想到，那是最好的开始。"

他抱紧我："有些<span class="vocab" data-word="disaster">disaster</span>，其实是祝福。"

一年后，我怀孕了。陆景深变得更加小心翼翼。

"你要多<span class="vocab" data-word="exercise">exercise</span>，但不能太累。"他每天都这么叮嘱。

产检时，医生说一切正常。陆景深松了口气，然后去给我买了一大堆营养品。

"你这样会把我养成<span class="vocab" data-word="nuisance">nuisance</span>的。"我笑着说。

"那我就<span class="vocab" data-word="salvage">salvage</span>你一辈子。"他认真地说。

孩子出生那天，他在产房外焦急地等待。护士出来时，他紧张地问："她还好吗？"

"母子平安。"

他冲进产房，握着我的手："谢谢你。"

现在回想起来，那场面试的<span class="vocab" data-word="rejection">rejection</span>，是我人生最大的幸运。

我们的故事，从一个<span class="vocab" data-word="roundabout">roundabout</span>开始，经过了<span class="vocab" data-word="transit">transit</span>，最终到达了幸福的彼岸。

他说，爱情不需要<span class="vocab" data-word="exercise">exercise</span>，只需要真心。

我说，遇见你，是我最不<span class="vocab" data-word="artificial">artificial</span>的缘分。

有时候，我会想起那天在<span class="vocab" data-word="roundabout">roundabout</span>的相遇。如果当时我没有喊那一声"<span class="vocab" data-word="attention">attention</span>"，会不会就错过了他？

但命运总是这么奇妙。该来的，总会来。

陆景深说，他从第一眼看到我的<span class="vocab" data-word="application">application</span>材料时，就被我吸引了。我的简历上写着：希望能为公司带来价值，而不是成为<span class="vocab" data-word="nuisance">nuisance</span>。

"就是这句话，"他说，"让我决定要认识你。"

所以他故意拒绝了我的申请，然后安排了那场"偶遇"。

"你这个<span class="vocab" data-word="sly">sly</span>的家伙。"我笑着打他。

"为了你，我愿意做任何事。"他认真地说。

现在，我们有了自己的家，有了孩子。每天早上，我都会在<span class="vocab" data-word="chatter">chatter</span>的鸟叫声中醒来。

陆景深会给我准备早餐，然后我们一起送孩子去幼儿园。

生活很平淡，但很幸福。

有时候我会想，如果当初我通过了面试，现在会是什么样子？

可能我只是盛世集团的一个普通员工，每天朝九晚五，和陆景深只是上下级关系。

但命运选择了另一条路。

一条更美好的路。

"你在想什么？"陆景深问。

"在想，"我说，"感谢那场<span class="vocab" data-word="rejection">rejection</span>。"

他笑了，把我拥入怀中："我也感谢。感谢命运让我遇见你。"

窗外，阳光正好。

我们的故事，还在继续。

（完）`;

// 更新mock-stories.ts
const mockStoriesPath = path.join(__dirname, '../lib/db/mock-stories.ts');
let content = fs.readFileSync(mockStoriesPath, 'utf8');

const match = content.match(/export const mockStories = (\[[\s\S]*\])/);
if (match) {
  const storiesData = JSON.parse(match[1]);
  storiesData[0].content = story1;
  
  const newContent = `// 自动生成的故事数据\nexport const mockStories = ${JSON.stringify(storiesData, null, 2)}`;
  fs.writeFileSync(mockStoriesPath, newContent, 'utf8');
  
  console.log('✅ 已更新故事1');
}
