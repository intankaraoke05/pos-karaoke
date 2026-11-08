import React, { useState } from 'react';
import { Utensils, Plus, Search, Edit2, Trash2, ArrowUpDown, Check, AlertCircle, X } from 'lucide-react';
import { FnbItem } from '../types';
import { formatRupiah } from '../utils/formatters';

interface FnbManagementProps {
  fnbCatalog: FnbItem[];
  isAdmin: boolean;
  onUpdateItem: (item: FnbItem) => void;
  onAddItem: (item: FnbItem) => void;
  onDeleteItem: (id: string) => void;
}

export const FnbManagement: React.FC<FnbManagementProps> = ({
  fnbCatalog,
  isAdmin,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FnbItem | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<FnbItem['category']>('Minuman');
  const [formPrice, setFormPrice] = useState<number>(20000);
  const [formCostPrice, setFormCostPrice] = useState<number>(10000);
  const [formStock, setFormStock] = useState<number>(50);
  const [formUnit, setFormUnit] = useState('Porsi');
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string>('');

  const categories = ['Semua', 'Minuman', 'Snack & Bites', 'Makanan Berat', 'Paket Combo', 'Rokok & Lainnya'];

  const filteredItems = fnbCatalog.filter((item) => {
    const matchCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalItems = fnbCatalog.length;
  const lowStockCount = fnbCatalog.filter((i) => i.stock < 10).length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    const nextCode = `MNU-${String(fnbCatalog.length + 1).padStart(2, '0')}`;
    setFormCode(nextCode);
    setFormName('');
    setFormCategory('Minuman');
    setFormPrice(20000);
    setFormCostPrice(8000);
    setFormStock(50);
    setFormUnit('Porsi');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FnbItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormCostPrice(item.costPrice);
    setFormStock(item.stock);
    setFormUnit(item.unit);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Nama menu wajib diisi');
      return;
    }
    setFormError('');

    if (editingItem) {
      onUpdateItem({
        ...editingItem,
        code: formCode.trim(),
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice),
        costPrice: Number(formCostPrice),
        stock: Number(formStock),
        unit: formUnit.trim(),
      });
    } else {
      const newItem: FnbItem = {
        id: 'fnb-' + Date.now(),
        code: formCode.trim(),
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice),
        costPrice: Number(formCostPrice),
        stock: Number(formStock),
        unit: formUnit.trim(),
        isAvailable: true,
      };
      onAddItem(newItem);
    }

    setIsModalOpen(false);
  };

  const handleQuickAddStock = (item: FnbItem, delta: number) => {
    onUpdateItem({ ...item, stock: Math.max(0, item.stock + delta) });
  };

  const handleToggleAvailable = (item: FnbItem) => {
    onUpdateItem({ ...item, isAvailable: !item.isAvailable });
  };

  return (
    <div className="space-y-5">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">TOTAL ITEM MENU</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">{totalItems} Menu</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">STOK MENIPIS (&lt;10)</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{lowStockCount} Item</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">KATEGORI TERPOPULER</div>
          <div className="text-sm font-bold text-white mt-1">Minuman Dingin & Bir</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">STATUS INVENTORY</div>
          <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
            <Check className="w-4 h-4" />
            <span>Tersinkron Lokal & Apps Script</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode atau nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-sm shadow-amber-400/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Menu Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                <th className="py-3 px-4 font-semibold">KODE & NAMA MENU</th>
                <th className="py-3 px-4 font-semibold">KATEGORI</th>
                <th className="py-3 px-4 font-semibold text-right">HARGA JUAL</th>
                {isAdmin && <th className="py-3 px-4 font-semibold text-right">MODAL (HPP)</th>}
                <th className="py-3 px-4 font-semibold text-center">STOK</th>
                <th className="py-3 px-4 font-semibold text-center">STATUS</th>
                <th className="py-3 px-4 font-semibold text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{item.name}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{item.code}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{item.category}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                    {formatRupiah(item.price)}
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatRupiah(item.costPrice)}
                    </td>
                  )}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className={`font-mono font-bold ${
                          item.stock < 10 ? 'text-red-400' : 'text-slate-200'
                        }`}
                      >
                        {item.stock} {item.unit}
                      </span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleQuickAddStock(item, 10)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700"
                          title="Tambah +10 stok"
                        >
                          +10
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailable(item)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                        item.isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {item.isAvailable ? 'Tersedia' : 'Habis'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Menu"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        confirmDeleteItemId === item.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteItem(item.id);
                                setConfirmDeleteItemId(null);
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 hover:bg-red-500 rounded transition-colors shadow-sm"
                            >
                              Hapus?
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteItemId(null)}
                              className="px-1 py-0.5 text-[10px] text-slate-400 hover:text-white"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteItemId(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    Tidak ada menu yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Menu Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span>{editingItem ? 'Edit Menu F&B' : 'Tambah Menu Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Kode Menu</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nama Menu <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Es Teh Manis Jumbo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Minuman">Minuman</option>
                    <option value="Snack & Bites">Snack & Bites</option>
                    <option value="Makanan Berat">Makanan Berat</option>
                    <option value="Paket Combo">Paket Combo</option>
                    <option value="Rokok & Lainnya">Rokok & Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Satuan</label>
                  <input
                    type="text"
                    placeholder="Porsi, Gelas, Botol"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Harga Modal HPP (Rp)</label>
                  <input
                    type="number"
                    step="1000"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Jumlah Stok Awal</label>
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
