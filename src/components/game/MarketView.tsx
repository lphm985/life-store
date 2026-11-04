'use client';

import React, { useState } from 'react';
import { Store, ShoppingCart, Tag, Coins, ArrowRight, X, Package, CheckCircle2 } from 'lucide-react';
import { buySeedFromShop, createMarketListing, cancelMarketListing, buyFromMarketplace } from '@/server/actions/market.actions';
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
  const [activeTab, setActiveTab] = useState<'npc_shop' | 'p2p_market' | 'my_listings'>('npc_shop');
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedSellItem, setSelectedSellItem] = useState<InventoryItem | null>(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(10);
  const [loading, setLoading] = useState(false);

  // Mua hạt giống từ Shop NPC
  const handleBuySeed = async (cropId: CropDef['id']) => {
    try {
      setLoading(true);
      const res = await buySeedFromShop(cropId, 1);
      if (!res.success) {
        alert(res.error);
      } else {
        alert(res.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mua hàng từ người chơi khác trên Chợ P2P
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

  // Xác nhận đăng bán
  const handleConfirmSell = async () => {
    if (!selectedSellItem) return;
    try {
      setLoading(true);
      const res = await createMarketListing(selectedSellItem.item_id, sellQty, sellPrice);
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

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-400" /> Trung Tâm Thương Mại & Chợ P2P
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mua hạt giống khởi đầu từ NPC hoặc tự do buôn bán nông sản, dược liệu với người chơi khác.
          </p>
        </div>

        {/* Action: Nút Đăng Bán */}
        <button
          onClick={() => setShowSellModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center gap-1.5 self-start"
        >
          <Tag className="w-4 h-4" /> Đăng Bán Vật Phẩm
        </button>
      </div>

      {/* Switcher 3 Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('npc_shop')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'npc_shop'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Shop NPC (Hạt Giống)
        </button>
        <button
          onClick={() => setActiveTab('p2p_market')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'p2p_market'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4" /> Chợ P2P ({activeP2PListings.length})
        </button>
        <button
          onClick={() => setActiveTab('my_listings')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition ${
            activeTab === 'my_listings'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" /> Gian Hàng Của Tôi ({myListings.length})
        </button>
      </div>

      {/* TAB 1: SHOP NPC (HẠT GIỐNG) */}
      {activeTab === 'npc_shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {cropDefs.map((crop) => (
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

                <div className="mt-4 p-2 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Giá Niêm Yết:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> {crop.buy_price} Vàng
                  </span>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={() => handleBuySeed(crop.id)}
                className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" /> Mua 1 Gói (-{crop.buy_price}🪙)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CHỢ P2P (MUA CỦA NGƯỜI CHƠI KHÁC) */}
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
                    className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mua Ngay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GIAN HÀNG CỦA TÔI */}
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
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-red-950/60 hover:text-red-400 hover:border-red-800 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    Hủy Tin & Thu Hồi Đồ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Đăng Bán Vật Phẩm */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                🏷️ Niêm Yết Vật Phẩm Lên Chợ P2P
              </h3>
              <button
                onClick={() => setShowSellModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Chọn vật phẩm từ túi đồ */}
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
                        setSellQty(1);
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
                        value={sellQty}
                        onChange={(e) => setSellQty(Math.min(selectedSellItem.quantity, Math.max(1, Number(e.target.value))))}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Giá mỗi đơn vị (Vàng):</label>
                      <input
                        type="number"
                        min={1}
                        value={sellPrice}
                        onChange={(e) => setSellPrice(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">Tổng tiền bạn sẽ nhận được:</span>
                    <b className="text-amber-400 text-sm font-bold flex items-center gap-1">
                      <Coins className="w-4 h-4" /> {sellQty * sellPrice} Vàng
                    </b>
                  </div>
                </>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowSellModal(false)}
                className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Hủy
              </button>
              <button
                disabled={!selectedSellItem || loading}
                onClick={handleConfirmSell}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-lg active:scale-95 transition"
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
