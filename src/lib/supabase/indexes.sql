-- TỐI ƯU HÓA CHỈ MỤC CHO TOÀN BỘ BẢNG DỮ LIỆU GAME (HIGH SPEED INDEXING)

CREATE INDEX IF NOT EXISTS idx_farm_plots_user_id ON public.farm_plots(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_minions_user_id ON public.minions(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON public.recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_expeditions_active ON public.expedition_missions(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.minion_templates(is_active);
