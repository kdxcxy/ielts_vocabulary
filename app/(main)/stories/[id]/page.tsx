import StoryReadClient from './StoryReadClient'

export default async function StoryReadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <StoryReadClient storyId={id} />
}
