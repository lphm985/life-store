'use client';

import React, { useState } from 'react';
import { Store, ShoppingCart, Tag, Coins, ArrowRight, X, Package, CheckCircle2, DollarSign, Plus, Minus } from 'lucide-react';
import { buySeedFromShop, sellItemToNpcShop, createMarketListing, cancelMarketListing, buyFromMarketplace } from '@/server/actions/market.actions';
import type { Database } from '@/types/database.types';

type CropDef = Database['public']['Tables']['crop_definitions']['Row'];
type MarketplaceListing = Database['public']['Tables']['marketplace_listings']['Row'];
type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface MarketViewProps {
  cropDefs: CropDef[];
  listings: MarketplaceListing[];
  userInventory: InventoryItem[];
  currentUserId: string;
}

export function MarketView({ cropDefs, listings, userInventory, currentUserId }: MarketViewProps) {
  const [activeTab, setActiveTab] = useState<'npc_shop' | 'npc_sell' | 'p2p_market' | 'my_listings'>('npc_shop');
  
  // State mua số lượng tùy chỉnh từ Shop NPC
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});
  
  // State bán số lượng tùy chỉnh cho Shop NPC
  const [sellQuantities, setSellQuantities] = useState<Record<string, number>>({});

  // State Modal bán P2P
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedSellItem, setSelectedSellItem] = useState<InventoryItem | null>(null);
  const [sellP2pQty, setSellP2pQty] = useState(1);
  const [sellP2pPrice, setSellP2pPrice] = useState(10);
  
  const [loading, setLoading] = useState(false);

  // Helper thay đổi số lượng mua
  const handleBuyQtyChange = (cropId: string, delta: number, current: number = 1) => {
    const newQty = Math.max(1, current + delta);
    setBuyQuantities((prev) => ({ ...prev, [cropId]: newQty }));
  };

  const handleBuyQtyInput = (cropId: string, val: number) => {
    const cleanVal = Math.max(1, val || 1);
    setBuyQuantities((prev) => ({ ...prev, [cropId]: cleanVal }));
  };

  // Helper thay đổi số lượng bán cho NPC
  const handleSellQtyChange = (itemId: string, delta: number, maxQty: number, current: number = 1) => {
    const newQty = Math.min(maxQty, Math.max(1, current + delta));
    setSellQuantities((prev) => ({ ...prev, [itemId]: newQty }));
  };

  const handleSellQtyInput = (itemId: string, val: number, maxQty: number) => {
    const cleanVal = Math.min(maxQty, Math.max(1, val || 1));
    setSellQuantities((prev) => ({ ...prev, [itemId]: cleanVal }));
  };

  // Mua hạt giống từ Shop NPC
  const handleBuySeed = async (cropId: CropDef['id']) => {
    const qty = buyQuantities[cropId] || 1;
    try {
      setLoading(true);
      const res = await buySeedFromShop(cropId, qty);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Bán vật phẩm cho Shop NPC
  const handleSellToNpc = async (item: InventoryItem, qty?: number) => {
    const targetQty = qty !== undefined ? qty : (sellQuantities[item.id] || 1);
    try {
      setLoading(true);
      const res = await sellItemToNpcShop(item.item_id, targetQty);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(res.message);
        // Reset lại số lượng bán về 1
        setSellQuantities((prev) => ({ ...prev, [item.id]: 1 }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Mua hàng từ Chợ P2P
  const handleBuyP2P = async (listingId: string) => {
    try {
      setLoading(true);
      const res = await buyFromMarketplace(listingId);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Hủy tin đăng bán
  const handleCancelListing = async (listingId: string) => {
    try {
      setLoading(true);
      const res = await cancelMarketListing(listingId);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận đăng bán P2P
  const handleConfirmSellP2P = async () => {
    if (!selectedSellItem) return;
    try {
      setLoading(true);
      const res = await createMarketListing(selectedSellItem.item_id, sellP2pQty, sellP2pPrice);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(res.message);
        setShowSellModal(false);
        setSelectedSellItem(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeP2PListings = listings.filter((l) => l.status === 'active' && l.seller_id !== currentUserId);
  const myListings = listings.filter((l) => l.seller_id === currentUserId && l.status === 'active');

  const getEstimatedNpcPrice = (item: InventoryItem) => {
    if (item.item_id.startsWith('crop_')) {
      const crop = cropDefs.find((c) => `crop_${c.id}` === item.item_id);
      return crop ? crop.sell_price : 15;
    }
    if (item.category === 'herb') return 25;
    if (item.category === 'processed_food') return 40;
    if (item.category === 'potion') return 60;
    return 10;
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-400" /> Trung Tâm Thương Mại & Cửa Hàng
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hỗ trợ mua bán số lượng tùy chỉnh (x1, x5, x10 hoặc nhập tự do).
          </p>
        </div>

        {/* Nút Đăng Bán P2P */}
        <button
          onClick={() => setShowSellModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Tag className="w-4 h-4" /> Đăng Bán Chợ P2P
        </button>
      </div>

      {/* Switcher 4 Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs flex-wrap">
        <button
          onClick={() => setActiveTab('npc_shop')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'npc_shop'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Cửa Hàng NPC (Mua Hạt)
        </button>

        <button
          onClick={() => setActiveTab('npc_sell')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'npc_sell'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-300" /> Bán Đồ Cho NPC
        </button>

        <button
          onClick={() => setActiveTab('p2p_market')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'p2p_market'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4" /> Chợ P2P ({activeP2PListings.length})
        </button>

        <button
          onClick={() => setActiveTab('my_listings')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
            activeTab === 'my_listings'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" /> Gian Hàng Của Tôi ({myListings.length})
        </button>
      </div>

      {/* TAB 1: SHOP NPC (MUA HẠT GIỐNG VỚI SỐ LƯỢNG TÙY CHỈNH) */}
      {activeTab === 'npc_shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cropDefs.map((crop) => {
            const currentBuyQty = buyQuantities[crop.id] || 1;
            const totalBuyCost = crop.buy_price * currentBuyQty;

            return (
              <div
                key={crop.id}
                className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between shadow-md transition"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-2 bg-slate-800 rounded-xl border border-slate-700">🌱</span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">Gói Hạt {crop.name}</h3>
                      <span className="text-xs text-slate-400">Thời gian lớn: {crop.grow_time_seconds}s</span>
                    </div>
                  </div>

                  <div className="mt-4 p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Đơn giá:</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" /> {crop.buy_price} Vàng/gói
                    </span>
                  </div>

                  {/* Thanh chỉnh số lượng tùy biến */}
                  <div className="mt-3 bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">Số lượng:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleBuyQtyChange(crop.id, -1, currentBuyQty)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 font-bold active:scale-95 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min={1}
                        value={currentBuyQty}
                        onChange={(e) => handleBuyQtyInput(crop.id, parseInt(e.target.value, 10))}
                        className="w-14 text-center bg-slate-900 border border-slate-700/80 rounded-lg py-1 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      />

                      <button
                        type="button"
                        onClick={() => handleBuyQtyChange(crop.id, 1, currentBuyQty)}
                        className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-300 font-bold active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {/* Phím tắt +5, +10 */}
                      <button
                        type="button"
                        onClick={() => handleBuyQtyChange(crop.id, 5, currentBuyQty)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] rounded-md text-amber-300 font-bold cursor-pointer"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBuyQtyChange(crop.id, 10, currentBuyQty)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] rounded-md text-amber-300 font-bold cursor-pointer"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={() => handleBuySeed(crop.id)}
                  className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" /> Mua {currentBuyQty} Gói (-{totalBuyCost}🪙)
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: BÁN ĐỒ CHO SHOP NPC VỚI SỐ LƯỢNG TÙY CHỈNH */}
      {activeTab === 'npc_sell' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            💡 Tùy chỉnh số lượng bán hoặc bấm "Tất Cả" để quy đổi nông sản, thảo dược thành Vàng tức thì.
          </div>

          {userInventory.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <p className="text-sm text-slate-400">Túi đồ của bạn đang trống! Hãy trồng trọt hoặc đi thám hiểm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {userInventory.map((item) => {
                const estPrice = getEstimatedNpcPrice(item);
                const currentSellQty = Math.min(item.quantity, sellQuantities[item.id] || 1);
                const totalGoldEarned = estPrice * currentSellQty;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                          Có sẵn: x{item.quantity}
                        </span>
                      </div>

                      <h4 className="font-semibold text-xs text-slate-200 mt-2 truncate">{item.item_name}</h4>
                      <div className="text-[11px] text-amber-400 mt-0.5 font-medium">
                        Giá: {estPrice} Vàng/cái
                      </div>

                      {/* Thanh chỉnh số lượng bán tùy chỉnh */}
                      <div className="mt-3 bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between gap-1.5">
                        <span className="text-[11px] text-slate-400">Bán:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSellQtyChange(item.id, -1, item.quantity, currentSellQty)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-slate-300 text-xs active:scale-95 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={currentSellQty}
                            onChange={(e) => handleSellQtyInput(item.id, parseInt(e.target.value, 10), item.quantity)}
                            className="w-12 text-center bg-slate-900 border border-slate-700 rounded py-0.5 text-xs font-bold text-white focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => handleSellQtyChange(item.id, 1, item.quantity, currentSellQty)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center text-slate-300 text-xs active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSellQuantities((prev) => ({ ...prev, [item.id]: item.quantity }))}
                            className="px-1.5 py-0.5 bg-emerald-950/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-300 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Max
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <button
                        disabled={loading || item.quantity <= 0}
                        onClick={() => handleSellToNpc(item, currentSellQty)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Bán {currentSellQty} cái (+{totalGoldEarned}🪙)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CHỢ P2P (MUA CỦA NGƯỜI CHƠI KHÁC) */}
      {activeTab === 'p2p_market' && (
        <div>
          {activeP2PListings.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Chợ hiện chưa có người chơi nào treo bán vật phẩm.</p>
              <p className="text-xs text-slate-500 mt-1">Hãy là người đầu tiên đăng bán bằng nút phía trên!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {activeP2PListings.map((listing) => (
                <div
                  key={listing.id}
                  className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between shadow-lg transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl p-2 bg-slate-800 rounded-xl border border-slate-700">📦</span>
                      <span className="text-xs bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full">
                        x{listing.quantity}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-100 mt-3">{listing.item_name}</h3>
                    <span className="text-xs text-slate-500">Đơn giá: {listing.price_per_unit} Vàng/cái</span>

                    <div className="mt-4 p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Tổng thanh toán:</span>
                      <b className="text-amber-400 text-sm flex items-center gap-1">
                        <Coins className="w-4 h-4" /> {listing.total_price} Vàng
                      </b>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={() => handleBuyP2P(listing.id)}
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mua Ngay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GIAN HÀNG CỦA TÔI */}
      {activeTab === 'my_listings' && (
        <div>
          {myListings.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
              <p className="text-sm text-slate-400">Bạn không có tin đăng bán nào đang hoạt động.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myListings.map((listing) => (
                <div
                  key={listing.id}
                  className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl p-2 bg-slate-800 rounded-xl border border-slate-700">📦</span>
                      <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Đang treo bán: x{listing.quantity}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-100 mt-3">{listing.item_name}</h3>
                    <div className="text-xs text-amber-400 mt-2 font-medium">
                      Tổng tiền nhận về: {listing.total_price} Vàng
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    onClick={() => handleCancelListing(listing.id)}
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-red-950/60 hover:text-red-400 hover:border-red-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    Hủy Tin & Thu Hồi Đồ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Đăng Bán Vật Phẩm P2P */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                🏷️ Niêm Yết Vật Phẩm Lên Chợ P2P
              </h3>
              <button
                onClick={() => setShowSellModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5 font-medium">
                  1. Chọn vật phẩm từ túi đồ:
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                  {userInventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedSellItem(item);
                        setSellP2pQty(1);
                      }}
                      className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center gap-2 transition ${
                        selectedSellItem?.id === item.id
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="truncate">
                        <div className="font-semibold truncate">{item.item_name}</div>
                        <div className="text-[10px] text-slate-400">Có: {item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSellItem && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Số lượng bán:</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedSellItem.quantity}
                        value={sellP2pQty}
                        onChange={(e) => setSellP2pQty(Math.min(selectedSellItem.quantity, Math.max(1, Number(e.target.value))))}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Giá mỗi đơn vị (Vàng):</label>
                      <input
                        type="number"
                        min={1}
                        value={sellP2pPrice}
                        onChange={(e) => setSellP2pPrice(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Tổng tiền bạn sẽ nhận được:</span>
                    <b className="text-amber-400 text-sm font-bold flex items-center gap-1">
                      <Coins className="w-4 h-4" /> {sellP2pQty * sellP2pPrice} Vàng
                    </b>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowSellModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={!selectedSellItem || loading}
                onClick={handleConfirmSellP2P}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-lg active:scale-95 transition cursor-pointer"
              >
                {loading ? 'Đang niêm yết...' : 'Xác Nhận Đăng Bán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
