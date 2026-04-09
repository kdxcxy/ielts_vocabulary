-- 插入5个分类
INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
(1, '霸道总裁', 'ceo', '💼', 1),
(2, '都市言情', 'urban', '💕', 2),
(3, '现代甜宠', 'sweet', '🍬', 3),
(4, '玄幻修仙', 'fantasy', '⚔️', 4),
(5, '科幻', 'scifi', '🚀', 5);

-- 插入管理员账号（用户名: admin, 密码: admin123）
-- 密码 hash 需要用 SHA-256('admin123' + 'ielts-salt')
INSERT INTO users (username, password_hash, role, status) VALUES
('admin', 'e10adc3949ba59abbe56e057f20f883e', 'admin', 1);
