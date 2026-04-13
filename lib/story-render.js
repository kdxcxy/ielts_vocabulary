const SEPARATOR_ONLY_PATTERN = /^[—\-\s]+$/

export function splitRenderableParagraphs(content) {
  return content
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0 && !SEPARATOR_ONLY_PATTERN.test(paragraph))
}
