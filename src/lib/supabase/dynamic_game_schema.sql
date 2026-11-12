-- ==============================================================================
-- DYNAMIC GAME CONFIG: MINION TEMPLATES & EXPEDITION MISSIONS
-- ==============================================================================

-- 1. BẢNG MẪU NHÂN VIÊN (Để chiêu mộ & Admin tùy biến)
CREATE TABLE IF NOT EXISTS minion_templates (
  id TEXT PRIMARY KEY,                             -- 'warrior', 'mage', 'archer', 'alchemist'
  name TEXT NOT NULL,                              -- Tên hiển thị
  avatar TEXT NOT NULL DEFAULT '⚔️',               -- Icon hoặc đường dẫn ảnh /assets/minions/...
  base_power INT NOT NULL DEFAULT 15 CHECK (base_power >= 1),
  base_hp INT NOT NULL DEFAULT 100 CHECK (base_hp >= 10),
  base_stamina INT NOT NULL DEFAULT 100 CHECK (base_stamina >= 10),
  recruit_cost_gold BIGINT NOT NULL DEFAULT 500 CHECK (recruit_cost_gold >= 0),
  recruit_cost_gems INT NOT NULL DEFAULT 0 CHECK (recruit_cost_gems >= 0),
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG BẢN ĐỒ THÁM HIỂM (Admin thêm map, chỉnh thời gian và tỷ lệ drop)
CREATE TABLE IF NOT EXISTS expedition_missions (
  id TEXT PRIMARY KEY,                             -- 'forest_edge', 'misty_valley', 'dragon_cave'
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard', 'nightmare')),
  description TEXT DEFAULT '',
  duration_seconds INT NOT NULL CHECK (duration_seconds > 0),
  min_power_required INT NOT NULL DEFAULT 10,
  recommended_power INT NOT NULL DEFAULT 15,
  gold_reward BIGINT NOT NULL DEFAULT 50,
  exp_reward INT NOT NULL DEFAULT 25,
  possible_drops JSONB NOT NULL DEFAULT '[]'::jsonb,
  icon TEXT NOT NULL DEFAULT '🌲',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE minion_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE expedition_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active minion templates" ON minion_templates
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Only admins can modify minion templates" ON minion_templates
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone authenticated can view active missions" ON expedition_missions
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Only admins can modify missions" ON expedition_missions
  FOR ALL USING (public.is_admin());

-- 3. SEED DỮ LIỆU BAN ĐẦU CHO MẪU NHÂN VIÊN
INSERT INTO minion_templates (id, name, avatar, base_power, base_hp, base_stamina, recruit_cost_gold, recruit_cost_gems, description) VALUES
(
  'warrior',
  'Hiệp Sĩ Tập Sự',
  '🛡️',
  15,
  120,
  100,
  300,
  0,
  'Chiến binh cận chiến kiên cường, lượng máu dồi dào phù hợp cho các chuyến thám hiểm đầu tiên.'
),
(
  'ranger',
  'Thợ Săn Rừng Sâu',
  '🏹',
  25,
  90,
  100,
  600,
  5,
  'Nhanh nhẹn và chuẩn xác, tăng cơ hội nhặt được hạt giống tự nhiên.'
),
(
  'alchemist_apprentice',
  'Dược Đồng Tập Sự',
  '🧪',
  18,
  100,
  120,
  500,
  0,
  'Thông thạo thảo mộc, tăng khả năng tìm thấy các loại thảo dược quý hiếm khi đi rừng.'
),
(
  'battle_mage',
  'Ma Đạo Sĩ Tối Thượng',
  '🔮',
  45,
  80,
  100,
  1500,
  20,
  'Sức tấn công phép thuật vượt trội, chuyên chinh phục các hầm ngục nguy hiểm cấp cao.'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  base_power = EXCLUDED.base_power,
  base_hp = EXCLUDED.base_hp,
  recruit_cost_gold = EXCLUDED.recruit_cost_gold;

-- 4. SEED DỮ LIỆU BAN ĐẦU CHO BẢN ĐỒ THÁM HIỂM
INSERT INTO expedition_missions (id, title, difficulty, description, duration_seconds, min_power_required, recommended_power, gold_reward, exp_reward, possible_drops, icon) VALUES
(
  'forest_edge',
  'Rìa Rừng Bí Ẩn',
  'easy',
  'Khu rừng yên tĩnh rìa nông trại, nơi có nhiều loài thảo dược non và hạt giống tự nhiên.',
  30,
  10,
  15,
  50,
  25,
  '[
    {"itemId": "herb_green_leaf", "itemName": "Lá Thảo Dược", "category": "herb", "quantity": 2, "chance": 0.9, "icon": "🌿"},
    {"itemId": "seed_wheat", "itemName": "Hạt Lúa Mì", "category": "seed", "quantity": 3, "chance": 0.8, "icon": "🌾"}
  ]'::jsonb,
  '🌲'
),
(
  'misty_valley',
  'Thung Lũng Sương Mù',
  'medium',
  'Thung lũng phủ đầy sương lạnh, quái vật bắt đầu xuất hiện. Có nhiều Hỏa Linh Hoa mọc bên vách đá.',
  90,
  25,
  35,
  150,
  60,
  '[
    {"itemId": "herb_fire_bloom", "itemName": "Hỏa Linh Hoa", "category": "herb", "quantity": 2, "chance": 0.7, "icon": "🔥"},
    {"itemId": "seed_carrot", "itemName": "Hạt Cà Rốt", "category": "seed", "quantity": 2, "chance": 0.6, "icon": "🥕"}
  ]'::jsonb,
  '🌫️'
),
(
  'dragon_cave',
  'Hang Động Long Huyết',
  'hard',
  'Vùng đất nguy hiểm cao, nơi khai sinh thảo dược quý hiếm Nhân Sâm Nghìn Năm và kho báu cổ xưa.',
  180,
  50,
  70,
  400,
  160,
  '[
    {"itemId": "herb_ginseng", "itemName": "Nhân Sâm Nghìn Năm", "category": "herb", "quantity": 2, "chance": 0.5, "icon": "✨"},
    {"itemId": "seed_pumpkin", "itemName": "Hạt Bí Ngô", "category": "seed", "quantity": 2, "chance": 0.5, "icon": "🎃"}
  ]'::jsonb,
  '🌋'
)
ON CONFLICT (id) DO UPDATE SET
  duration_seconds = EXCLUDED.duration_seconds,
  min_power_required = EXCLUDED.min_power_required,
  recommended_power = EXCLUDED.recommended_power,
  gold_reward = EXCLUDED.gold_reward,
  possible_drops = EXCLUDED.possible_drops;
