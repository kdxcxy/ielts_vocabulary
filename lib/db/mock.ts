import { mockStories } from './mock-stories'
import { overrideStoryContent } from '../story-content-overrides.js'

type MockUser = {
  id: number
  username: string
  password_hash: string
  role: string
  status: number
  expires_at?: string | null
}

type MockDb = {
  users: MockUser[]
  activationCodes: any[]
  categories: Array<{ id: number; name: string; slug: string; icon: string }>
  stories: typeof mockStories
  bookmarks: any[]
}

declare global {
  var __ieltsMockDb: MockDb | undefined
}

function createMockDb(): MockDb {
  const users: MockUser[] = [
    {
      id: 1,
      username: 'admin',
      password_hash: 'ddfa6616b186bd99b0d72bceb2c2630cebfb9f7a20d7ceecc52c6a656bc9fe5e',
      role: 'admin',
      status: 1,
      expires_at: null,
    },
  ]

  const activationCodes: any[] = []
  const categories = [
    { id: 1, name: '霸道总裁', slug: 'ceo', icon: '💼' },
    { id: 2, name: '都市言情', slug: 'urban', icon: '💕' },
    { id: 3, name: '现代甜宠', slug: 'sweet', icon: '🌿' },
    { id: 4, name: '玄幻仙侠', slug: 'fantasy', icon: '🗡️' },
    { id: 5, name: '科幻', slug: 'scifi', icon: '🚀' },
  ]
  const stories = mockStories.map((story) => ({
    ...story,
    content: overrideStoryContent(story),
  }))
  const bookmarks: any[] = []

  return {
    users,
    activationCodes,
    categories,
    stories,
    bookmarks,
  }
}

export const mockDb = globalThis.__ieltsMockDb ?? (globalThis.__ieltsMockDb = createMockDb())
