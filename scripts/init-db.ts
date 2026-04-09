import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const db = new Database('local.db')

// 执行迁移文件
const migrations = [
  'lib/db/migrations/0001_init.sql',
  'lib/db/migrations/0002_tables.sql',
  'lib/db/migrations/0003_user_data.sql',
  'lib/db/migrations/seed.sql'
]

migrations.forEach(file => {
  const sql = readFileSync(join(process.cwd(), file), 'utf-8')
  db.exec(sql)
  console.log(`✓ Executed ${file}`)
})

console.log('✓ Database initialized')
db.close()
