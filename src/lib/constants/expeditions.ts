export interface ExpeditionRewardItem {
  itemId: string;
  itemName: string;
  category: 'herb' | 'seed' | 'crop' | 'material';
  quantity: number;
  chance: number; // 0.0 -> 1.0 (1.0 = 100%)
  icon: string;
}

export interface ExpeditionMission {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  description: string;
  durationSeconds: number; // Thời gian thám hiểm (Idle time)
  minPowerRequired: number; // Sức mạnh tối thiểu để tham gia
  recommendedPower: number; // Sức mạnh khuyến nghị (ảnh hưởng tỷ lệ mất máu/tử trận)
  goldReward: number;
  expReward: number;
  possibleDrops: ExpeditionRewardItem[];
  icon: string;
}

export const EXPEDITION_MISSIONS: ExpeditionMission[] = [
  {
    id: 'forest_edge',
    title: 'Rìa Rừng Bí Ẩn',
    difficulty: 'easy',
    description: 'Khu rừng yên tĩnh rìa nông trại, nơi có nhiều loài thảo dược non và hạt giống tự nhiên.',
    durationSeconds: 30, // 30s để test nhanh gameplay idle
    minPowerRequired: 10,
    recommendedPower: 15,
    goldReward: 50,
    expReward: 25,
    possibleDrops: [
      { itemId: 'herb_green_leaf', itemName: 'Lá Thảo Dược', category: 'herb', quantity: 2, chance: 0.9, icon: '🌿' },
      { itemId: 'seed_wheat', itemName: 'Hạt Lúa Mì', category: 'seed', quantity: 3, chance: 0.8, icon: '🌾' },
    ],
    icon: '🌲',
  },
  {
    id: 'misty_valley',
    title: 'Thung Lũng Sương Mù',
    difficulty: 'medium',
    description: 'Thung lũng phủ đầy sương lạnh, quái vật bắt đầu xuất hiện. Có nhiều Hỏa Linh Hoa mọc bên vách đá.',
    durationSeconds: 90,
    minPowerRequired: 25,
    recommendedPower: 35,
    goldReward: 150,
    expReward: 60,
    possibleDrops: [
      { itemId: 'herb_fire_bloom', itemName: 'Hỏa Linh Hoa', category: 'herb', quantity: 2, chance: 0.7, icon: '🔥' },
      { itemId: 'seed_carrot', itemName: 'Hạt Cà Rốt', category: 'seed', quantity: 2, chance: 0.6, icon: '🥕' },
    ],
    icon: '🌫️',
  },
  {
    id: 'dragon_cave',
    title: 'Hang Động Long Huyết',
    difficulty: 'hard',
    description: 'Vùng đất nguy hiểm cao, nơi khai sinh thảo dược quý hiếm Nhân Sâm Nghìn Năm và kho báu cổ xưa.',
    durationSeconds: 180,
    minPowerRequired: 50,
    recommendedPower: 70,
    goldReward: 400,
    expReward: 160,
    possibleDrops: [
      { itemId: 'herb_ginseng', itemName: 'Nhân Sâm Nghìn Năm', category: 'herb', quantity: 2, chance: 0.5, icon: '✨' },
      { itemId: 'seed_pumpkin', itemName: 'Hạt Bí Ngô', category: 'seed', quantity: 2, chance: 0.5, icon: '🎃' },
    ],
    icon: '🌋',
  },
];
