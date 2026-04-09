import { mockStories } from './mock-stories'

// 模拟数据库（内存）
const users: any[] = []
const activationCodes: any[] = []
const categories = [
  { id: 1, name: '霸道总裁', slug: 'ceo', icon: '💼' },
  { id: 2, name: '都市言情', slug: 'urban', icon: '💕' },
  { id: 3, name: '现代甜宠', slug: 'sweet', icon: '🍬' },
  { id: 4, name: '玄幻修仙', slug: 'fantasy', icon: '⚔️' },
  { id: 5, name: '科幻', slug: 'scifi', icon: '🚀' },
]
const stories = mockStories
const bookmarks: any[] = []

// 初始化管理员账号 (用户名: admin, 密码: admin123)
users.push({
  id: 1,
  username: 'admin',
  password_hash: 'ddfa6616b186bd99b0d72bceb2c2630cebfb9f7a20d7ceecc52c6a656bc9fe5e',
  role: 'admin',
  status: 1
})

export const mockDb = {
  users,
  activationCodes,
  categories,
  stories,
  bookmarks
}
