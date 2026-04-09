export function matchChinese(input: string, answer: string): boolean {
  const normalize = (s: string) => s.trim().replace(/[，。、！？；：""''（）\s]/g, '')
  const i = normalize(input)
  const a = normalize(answer)
  if (i === a) return true
  if (i.length >= 2 && (a.includes(i) || i.includes(a))) return true
  return false
}

export function matchEnglish(input: string, answer: string): boolean {
  return input.trim().toLowerCase() === answer.trim().toLowerCase()
}
