export interface RecipeIngredient {
  itemId: string;
  itemName: string;
  quantity: number;
}

export interface FoodRecipe {
  id: string;
  name: string;
  description: string;
  craftTimeSeconds: number;
  ingredients: RecipeIngredient[];
  resultItemId: string;
  resultName: string;
  resultQuantity: number;
  energyRestore: number; // Điểm năng lượng hồi phục khi người chơi ăn
  staminaRestore: number; // Điểm thể lực hồi phục cho Minion
  expReward: number;
  icon: string;
}

export const RECIPES: FoodRecipe[] = [
  {
    id: 'bread',
    name: 'Bánh Mì Nướng Nóng Hổi',
    description: 'Thơm lừng mùi lúa mì mới gặt. Hồi phục 20 năng lượng.',
    craftTimeSeconds: 15,
    ingredients: [
      { itemId: 'crop_wheat', itemName: 'Lúa mì', quantity: 3 },
    ],
    resultItemId: 'food_bread',
    resultName: 'Bánh Mì',
    resultQuantity: 1,
    energyRestore: 20,
    staminaRestore: 10,
    expReward: 15,
    icon: '🥖',
  },
  {
    id: 'carrot_soup',
    name: 'Súp Cà Rốt Bổ Dưỡng',
    description: 'Món súp sánh mịn giàu dinh dưỡng. Hồi phục 35 năng lượng.',
    craftTimeSeconds: 40,
    ingredients: [
      { itemId: 'crop_carrot', itemName: 'Cà rốt', quantity: 2 },
      { itemId: 'crop_wheat', itemName: 'Lúa mì', quantity: 1 },
    ],
    resultItemId: 'food_carrot_soup',
    resultName: 'Súp Cà Rốt',
    resultQuantity: 1,
    energyRestore: 35,
    staminaRestore: 25,
    expReward: 30,
    icon: '🍲',
  },
  {
    id: 'corn_salad',
    name: 'Salad Ngô Tươi Ngọt',
    description: 'Bữa ăn thanh đạm, hồi phục 50 năng lượng.',
    craftTimeSeconds: 60,
    ingredients: [
      { itemId: 'crop_corn', itemName: 'Ngô', quantity: 2 },
      { itemId: 'crop_tomato', itemName: 'Cà chua', quantity: 2 },
    ],
    resultItemId: 'food_corn_salad',
    resultName: 'Salad Ngô',
    resultQuantity: 1,
    energyRestore: 50,
    staminaRestore: 40,
    expReward: 50,
    icon: '🥗',
  },
  {
    id: 'pumpkin_pie',
    name: 'Bánh Bí Ngô Thượng Hạng',
    description: 'Món tráng miệng hoàng gia, hồi phục 100 năng lượng.',
    craftTimeSeconds: 120,
    ingredients: [
      { itemId: 'crop_pumpkin', itemName: 'Bí ngô', quantity: 1 },
      { itemId: 'crop_wheat', itemName: 'Lúa mì', quantity: 4 },
    ],
    resultItemId: 'food_pumpkin_pie',
    resultName: 'Bánh Bí Ngô',
    resultQuantity: 1,
    energyRestore: 100,
    staminaRestore: 80,
    expReward: 100,
    icon: '🥧',
  },
];
