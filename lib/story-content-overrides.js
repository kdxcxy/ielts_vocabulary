const STORY_35_NEW_SEGMENT = `我甚至把离婚协议 hereto [对此] 附上的几条备注都写得冷冷清清，天真地以为，只要语气足够冷，就能 neutralize [压制] 胸口那些余震。
可人心哪有那么听话。谢南递来一杯热咖啡时，我脑子里那些 conceptive [有想象力的] 念头就会自作主张，擅自替未来补出轮廓；而旧婚姻里那些碎片，又会在深夜里变成 associative [联想的] 回潮，一点点 tantalize [使干着急] 我，逼我承认自己还没有想象中那么洒脱。
那段婚姻是一个失败的实验，但它也是我 imagination [想象力] 和勇气的一部分，让我后来更清晰地知道自己需要什么。`

function cleanupStory35Separators(content) {
  return content
    .replace(/\n\n——\n\n(?=wooden \[)/, '\n\n')
    .replace(/\n\n——\n\n(?=我现在过得很好。)/, '\n\n')
}

export function overrideStoryContent(story) {
  if (!story?.content) return story?.content ?? ''

  if (story.id !== 35) return story.content

  if (story.content.includes('conceptive [')) {
    return cleanupStory35Separators(story.content)
  }

  const patched = story.content.replace(
    /那段婚姻是一个失败的实验，但它也是我 imagination \[[^\]]+\] 和勇气的一部分，让我后来更清晰地知道自己需要什么。\n\n——/,
    `${STORY_35_NEW_SEGMENT}\n\n——`
  )

  return cleanupStory35Separators(patched)
}
