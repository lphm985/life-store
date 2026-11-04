-- ==============================================================================
-- LIFE STORE IDLE RPG - DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('player', 'admin');
CREATE TYPE crop_type AS ENUM ('wheat', 'corn', 'carrot', 'tomato', 'pumpkin');
CREATE TYPE item_category AS ENUM ('seed', 'crop', 'processed_food', 'material', 'tool');
CREATE TYPE minion_status AS ENUM ('idle', 'expedition');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled');

-- 2. BẢNG PROFILES (Mở rộng từ auth.users của Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'player',
  gold BIGINT NOT NULL DEFAULT 500 CHECK (gold >= 0),
  gems INT NOT NULL DEFAULT 10 CHECK (gems >= 0),
  energy INT NOT NULL DEFAULT 100 CHECK (energy >= 0),
  max_energy INT NOT NULL DEFAULT 100,
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  exp BIGINT NOT NULL DEFAULT 0 CHECK (exp >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger tự động tạo profile khi người dùng đăng ký tài khoản Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, gold, gems, energy, max_energy, level, exp)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'player'),
    500,
    10,
    100,
    100,
    1,
    0
  );
  
  -- Tạo sẵn 6 ô đất ban đầu cho người chơi mới
  FOR i IN 0..5 LOOP
    INSERT INTO public.farm_plots (user_id, plot_index)
    VALUES (NEW.id, i);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. BẢNG FARM_PLOTS (Quản lý các ô đất nông trại)
CREATE TABLE farm_plots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plot_index INT NOT NULL,
  crop_type crop_type DEFAULT NULL,
  planted_at TIMESTAMPTZ DEFAULT NULL,
  is_watered BOOLEAN NOT NULL DEFAULT FALSE,
  is_fertilized BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_plot UNIQUE (user_id, plot_index)
);

-- 4. BẢNG CROP_DEFINITIONS (Thông số cây trồng cấu hình bởi Admin)
CREATE TABLE crop_definitions (
  id crop_type PRIMARY KEY,
  name TEXT NOT NULL,
  grow_time_seconds INT NOT NULL CHECK (grow_time_seconds > 0),
  buy_price INT NOT NULL CHECK (buy_price >= 0),
  sell_price INT NOT NULL CHECK (sell_price >= 0),
  exp_reward INT NOT NULL CHECK (exp_reward >= 0),
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dữ liệu hạt giống mặc định
INSERT INTO crop_definitions (id, name, grow_time_seconds, buy_price, sell_price, exp_reward, icon) VALUES
('wheat', 'Lúa mì', 30, 10, 18, 5, 'Wheat'),
('carrot', 'Cà rốt', 60, 25, 45, 12, 'Carrot'),
('corn', 'Ngô', 120, 50, 95, 25, 'Corn'),
('tomato', 'Cà chua', 300, 120, 240, 60, 'Apple'),
('pumpkin', 'Bí ngô', 600, 250, 520, 140, 'Cherry')
ON CONFLICT (id) DO NOTHING;

-- 5. BẢNG INVENTORY (Kho đồ người chơi)
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  category item_category NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  icon TEXT NOT NULL DEFAULT 'Package',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_item UNIQUE (user_id, item_id)
);

-- 6. BẢNG MINIONS (Nhân viên RPG & thám hiểm)
CREATE TABLE minions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'User',
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  power INT NOT NULL DEFAULT 10 CHECK (power >= 1),
  stamina INT NOT NULL DEFAULT 100 CHECK (stamina >= 0),
  status minion_status NOT NULL DEFAULT 'idle',
  expedition_mission_id TEXT DEFAULT NULL,
  expedition_ends_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. BẢNG MARKETPLACE_LISTINGS (Chợ giao dịch P2P)
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_per_unit BIGINT NOT NULL CHECK (price_per_unit > 0),
  total_price BIGINT GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  status listing_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE minions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Hàm trợ giúp kiểm tra admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies: PROFILES
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own non-sensitive profile info" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view and edit all profiles" ON profiles
  FOR ALL USING (public.is_admin());

-- Policies: FARM_PLOTS
CREATE POLICY "Users can view and manage own plots" ON farm_plots
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all plots" ON farm_plots
  FOR SELECT USING (public.is_admin());

-- Policies: CROP_DEFINITIONS
CREATE POLICY "Anyone can view crop definitions" ON crop_definitions
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify crop definitions" ON crop_definitions
  FOR ALL USING (public.is_admin());

-- Policies: INVENTORY
CREATE POLICY "Users can view and manage own inventory" ON inventory
  FOR ALL USING (auth.uid() = user_id);

-- Policies: MINIONS
CREATE POLICY "Users can view and manage own minions" ON minions
  FOR ALL USING (auth.uid() = user_id);

-- Policies: MARKETPLACE
CREATE POLICY "Anyone authenticated can view active listings" ON marketplace_listings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Sellers can manage own listings" ON marketplace_listings
  FOR ALL USING (auth.uid() = seller_id);
