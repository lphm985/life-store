-- ==============================================================================
-- LIFE STORE IDLE RPG - ALCHEMY & POTIONS EXTENSION SCHEMA
-- ==============================================================================

-- 1. Bổ sung Category 'potion' và 'herb' vào Item Category
ALTER TYPE item_category ADD VALUE IF NOT EXISTS 'potion';
ALTER TYPE item_category ADD VALUE IF NOT EXISTS 'herb';

-- 2. ENUM CÁC LOẠI HIỆU ỨNG THUỐC
DO $$ BEGIN
  CREATE TYPE potion_effect_type AS ENUM (
    'heal_hp',            -- Hồi máu Minion
    'revive',             -- Hồi sinh Minion khi tử trận
    'temp_dmg_boost',     -- Tăng công cho chuyến thám hiểm tiếp theo (+X hoặc +X%)
    'temp_def_boost',     -- Tăng thủ cho chuyến thám hiểm tiếp theo
    'perm_stat_boost',    -- Tăng vĩnh viễn (power, hp, stamina)
    'level_up'            -- Tăng cấp tức thì cho Minion (+1 Level)
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. BẢNG CÔNG THỨC CHẾ BIẾN DO ADMIN QUẢN LÝ (RECIPES)
-- Phân tách riêng: Dễ quản lý, đánh Index theo type, truy vấn siêu nhanh < 1ms
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,                             -- e.g. 'potion_heal_minor', 'food_bread'
  name TEXT NOT NULL,                              -- Tên hiển thị
  category TEXT NOT NULL CHECK (category IN ('food', 'potion')), -- Phân loại Bếp hay Dược phòng
  description TEXT NOT NULL DEFAULT '',
  craft_time_seconds INT NOT NULL DEFAULT 10 CHECK (craft_time_seconds >= 0),
  ingredients JSONB NOT NULL,                      -- Dạng: [{"itemId": "herb_ginseng", "itemName": "Nhân Sâm", "quantity": 2}]
  result_item_id TEXT NOT NULL,                    -- ID item thành phẩm vào inventory
  result_item_name TEXT NOT NULL,
  result_quantity INT NOT NULL DEFAULT 1 CHECK (result_quantity > 0),
  icon TEXT NOT NULL DEFAULT 'FlaskConical',
  exp_reward INT NOT NULL DEFAULT 10,
  
  -- Thuộc tính hiệu ứng dành riêng cho Thuốc (Potion)
  effect_type potion_effect_type DEFAULT NULL,
  effect_duration_type TEXT DEFAULT 'instant' CHECK (effect_duration_type IN ('instant', 'next_expedition', 'permanent')),
  effect_value INT DEFAULT 0,                      -- Giá trị hiệu ứng (+50 HP, +15 DMG, +1 Level, v.v.)
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index tăng tốc truy vấn lọc theo category
CREATE INDEX IF NOT EXISTS idx_recipes_category_active ON recipes(category, is_active);

-- 4. BỔ SUNG CỘT HP VÀ BUFF VÀO BẢNG MINIONS
ALTER TABLE minions 
  ADD COLUMN IF NOT EXISTS hp INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_hp INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS is_alive BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS temp_dmg_buff INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS temp_def_buff INT NOT NULL DEFAULT 0;

-- 5. RLS POLICIES CHO RECIPES
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active recipes" ON recipes
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "Only admins can insert, update, delete recipes" ON recipes
  FOR ALL USING (public.is_admin());

-- 6. SEED DỮ LIỆU CÔNG THỨC THUỐC MẶC ĐỊNH
INSERT INTO recipes (id, name, category, description, craft_time_seconds, ingredients, result_item_id, result_item_name, result_quantity, icon, exp_reward, effect_type, effect_duration_type, effect_value) VALUES
(
  'potion_heal_minor',
  'Thuốc Trị Thương Nhỏ',
  'potion',
  'Hồi phục 50 Máu (HP) tức thì cho Minion bị thương.',
  15,
  '[{"itemId": "crop_carrot", "itemName": "Cà rốt", "quantity": 2}, {"itemId": "herb_green_leaf", "itemName": "Lá Thảo Dược", "quantity": 1}]'::jsonb,
  'potion_heal_minor',
  'Thuốc Trị Thương Nhỏ',
  1,
  '🧪',
  20,
  'heal_hp',
  'instant',
  50
),
(
  'potion_dmg_boost',
  'Dược Thủy Cuồng Nộ',
  'potion',
  'Tăng +25 Sức mạnh (DMG) cho Minion trong chuyến thám hiểm tiếp theo.',
  30,
  '[{"itemId": "crop_tomato", "itemName": "Cà chua", "quantity": 3}, {"itemId": "herb_fire_bloom", "itemName": "Hỏa Linh Hoa", "quantity": 2}]'::jsonb,
  'potion_dmg_boost',
  'Dược Thủy Cuồng Nộ',
  1,
  '⚗️',
  40,
  'temp_dmg_boost',
  'next_expedition',
  25
),
(
  'potion_perm_elixir',
  'Linh Đan Tẩy Tủy',
  'potion',
  'Tăng vĩnh viễn +5 Sức mạnh cơ bản cho Minion.',
  60,
  '[{"itemId": "crop_pumpkin", "itemName": "Bí ngô", "quantity": 2}, {"itemId": "herb_ginseng", "itemName": "Nhân Sâm Nghìn Năm", "quantity": 2}]'::jsonb,
  'potion_perm_elixir',
  'Linh Đan Tẩy Tủy',
  1,
  '🔮',
  100,
  'perm_stat_boost',
  'permanent',
  5
),
(
  'potion_revive',
  'Thánh Thủy Phục Sinh',
  'potion',
  'Hồi sinh Minion khi tử trận trong chuyến thám hiểm nguy hiểm.',
  120,
  '[{"itemId": "herb_ginseng", "itemName": "Nhân Sâm Nghìn Năm", "quantity": 3}, {"itemId": "crop_wheat", "itemName": "Lúa mì", "quantity": 5}]'::jsonb,
  'potion_revive',
  'Thánh Thủy Phục Sinh',
  1,
  '✨',
  150,
  'revive',
  'instant',
  100
)
ON CONFLICT (id) DO UPDATE SET
  ingredients = EXCLUDED.ingredients,
  effect_type = EXCLUDED.effect_type,
  effect_duration_type = EXCLUDED.effect_duration_type,
  effect_value = EXCLUDED.effect_value;
