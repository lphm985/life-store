export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PotionEffectType =
  | 'heal_hp'
  | 'revive'
  | 'temp_dmg_boost'
  | 'temp_def_boost'
  | 'perm_stat_boost'
  | 'level_up';

export interface RecipeIngredient {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface ExpeditionDropItem {
  itemId: string;
  itemName: string;
  category: 'seed' | 'crop' | 'material' | 'tool' | 'potion' | 'herb';
  quantity: number;
  chance: number;
  icon: string;
}

export interface Database {
  public: {
    Tables: {
      minion_templates: {
        Row: {
          id: string;
          name: string;
          avatar: string;
          base_power: number;
          base_hp: number;
          base_stamina: number;
          recruit_cost_gold: number;
          recruit_cost_gems: number;
          description: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar?: string;
          base_power?: number;
          base_hp?: number;
          base_stamina?: number;
          recruit_cost_gold?: number;
          recruit_cost_gems?: number;
          description?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar?: string;
          base_power?: number;
          base_hp?: number;
          base_stamina?: number;
          recruit_cost_gold?: number;
          recruit_cost_gems?: number;
          description?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      expedition_missions: {
        Row: {
          id: string;
          title: string;
          difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
          description: string;
          duration_seconds: number;
          min_power_required: number;
          recommended_power: number;
          gold_reward: number;
          exp_reward: number;
          possible_drops: ExpeditionDropItem[];
          icon: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          title: string;
          difficulty?: 'easy' | 'medium' | 'hard' | 'nightmare';
          description?: string;
          duration_seconds: number;
          min_power_required?: number;
          recommended_power?: number;
          gold_reward?: number;
          exp_reward?: number;
          possible_drops?: ExpeditionDropItem[] | Json;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          difficulty?: 'easy' | 'medium' | 'hard' | 'nightmare';
          description?: string;
          duration_seconds?: number;
          min_power_required?: number;
          recommended_power?: number;
          gold_reward?: number;
          exp_reward?: number;
          possible_drops?: ExpeditionDropItem[] | Json;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          name: string;
          category: 'food' | 'potion';
          description: string;
          craft_time_seconds: number;
          ingredients: RecipeIngredient[];
          result_item_id: string;
          result_item_name: string;
          result_quantity: number;
          icon: string;
          exp_reward: number;
          effect_type: PotionEffectType | null;
          effect_duration_type: 'instant' | 'next_expedition' | 'permanent' | null;
          effect_value: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          category: 'food' | 'potion';
          description?: string;
          craft_time_seconds?: number;
          ingredients: RecipeIngredient[] | Json;
          result_item_id: string;
          result_item_name: string;
          result_quantity?: number;
          icon?: string;
          exp_reward?: number;
          effect_type?: PotionEffectType | null;
          effect_duration_type?: 'instant' | 'next_expedition' | 'permanent' | null;
          effect_value?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'food' | 'potion';
          description?: string;
          craft_time_seconds?: number;
          ingredients?: RecipeIngredient[] | Json;
          result_item_id?: string;
          result_item_name?: string;
          result_quantity?: number;
          icon?: string;
          exp_reward?: number;
          effect_type?: PotionEffectType | null;
          effect_duration_type?: 'instant' | 'next_expedition' | 'permanent' | null;
          effect_value?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          role: 'player' | 'admin';
          gold: number;
          gems: number;
          energy: number;
          max_energy: number;
          level: number;
          exp: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          role?: 'player' | 'admin';
          gold?: number;
          gems?: number;
          energy?: number;
          max_energy?: number;
          level?: number;
          exp?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          role?: 'player' | 'admin';
          gold?: number;
          gems?: number;
          energy?: number;
          max_energy?: number;
          level?: number;
          exp?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      farm_plots: {
        Row: {
          id: string;
          user_id: string;
          plot_index: number;
          crop_type: 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin' | null;
          planted_at: string | null;
          is_watered: boolean;
          is_fertilized: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plot_index: number;
          crop_type?: 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin' | null;
          planted_at?: string | null;
          is_watered?: boolean;
          is_fertilized?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plot_index?: number;
          crop_type?: 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin' | null;
          planted_at?: string | null;
          is_watered?: boolean;
          is_fertilized?: boolean;
          created_at?: string;
        };
      };
      crop_definitions: {
        Row: {
          id: 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin';
          name: string;
          grow_time_seconds: number;
          buy_price: number;
          sell_price: number;
          exp_reward: number;
          icon: string;
          created_at: string;
        };
        Insert: {
          id: 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin';
          name: string;
          grow_time_seconds: number;
          buy_price: number;
          sell_price: number;
          exp_reward: number;
          icon: string;
          created_at?: string;
        };
        Update: {
          id?: 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin';
          name?: string;
          grow_time_seconds?: number;
          buy_price?: number;
          sell_price?: number;
          exp_reward?: number;
          icon?: string;
          created_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          item_name: string;
          category: 'seed' | 'crop' | 'processed_food' | 'material' | 'tool' | 'potion' | 'herb';
          quantity: number;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          item_name: string;
          category: 'seed' | 'crop' | 'processed_food' | 'material' | 'tool' | 'potion' | 'herb';
          quantity?: number;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          item_name?: string;
          category?: 'seed' | 'crop' | 'processed_food' | 'material' | 'tool' | 'potion' | 'herb';
          quantity?: number;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      minions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          avatar: string;
          level: number;
          power: number;
          stamina: number;
          hp: number;
          max_hp: number;
          is_alive: boolean;
          temp_dmg_buff: number;
          temp_def_buff: number;
          status: 'idle' | 'expedition';
          expedition_mission_id: string | null;
          expedition_ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          avatar?: string;
          level?: number;
          power?: number;
          stamina?: number;
          hp?: number;
          max_hp?: number;
          is_alive?: boolean;
          temp_dmg_buff?: number;
          temp_def_buff?: number;
          status?: 'idle' | 'expedition';
          expedition_mission_id?: string | null;
          expedition_ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          avatar?: string;
          level?: number;
          power?: number;
          stamina?: number;
          hp?: number;
          max_hp?: number;
          is_alive?: boolean;
          temp_dmg_buff?: number;
          temp_def_buff?: number;
          status?: 'idle' | 'expedition';
          expedition_mission_id?: string | null;
          expedition_ends_at?: string | null;
          created_at?: string;
        };
      };
      marketplace_listings: {
        Row: {
          id: string;
          seller_id: string;
          item_id: string;
          item_name: string;
          quantity: number;
          price_per_unit: number;
          total_price: number;
          status: 'active' | 'sold' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          item_id: string;
          item_name: string;
          quantity: number;
          price_per_unit: number;
          status?: 'active' | 'sold' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          item_id?: string;
          item_name?: string;
          quantity?: number;
          price_per_unit?: number;
          status?: 'active' | 'sold' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
