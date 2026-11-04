export type UserRole = 'player' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  gold: number;
  gems: number;
  energy: number;
  maxEnergy: number;
  level: number;
  exp: number;
  createdAt: string;
}

export type CropType = 'wheat' | 'corn' | 'carrot' | 'tomato' | 'pumpkin';

export interface CropDefinition {
  id: CropType;
  name: string;
  growTimeSeconds: number; // Thời gian sinh trưởng
  buyPrice: number;
  sellPrice: number;
  expReward: number;
  waterRequired: boolean;
  icon: string;
}

export interface FarmPlot {
  id: string;
  userId: string;
  plotIndex: number;
  cropType: CropType | null;
  plantedAt: string | null; // ISO string
  isWatered: boolean;
  isFertilized: boolean;
  isHarvestable: boolean;
}

export type ItemCategory = 'seed' | 'crop' | 'processed_food' | 'material' | 'tool';

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  icon: string;
}

export interface ProcessingRecipe {
  id: string;
  name: string;
  resultItemId: string;
  resultQuantity: number;
  craftTimeSeconds: number;
  ingredients: {
    itemId: string;
    quantity: number;
  }[];
  icon: string;
}

export interface Minion {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  level: number;
  power: number;
  stamina: number;
  status: 'idle' | 'expedition';
  expeditionEndsAt: string | null;
}

export interface ExpeditionMission {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  minPowerRequired: number;
  goldReward: number;
  expReward: number;
  itemRewards: { itemId: string; quantity: number; chance: number }[];
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
}
