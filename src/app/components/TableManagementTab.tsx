'use client';

import React, { useEffect, useState } from 'react';
import { API_URL } from '../constants';
import { QRCodeSVG } from 'qrcode.react';

interface Table {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export function TableManagementTab() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_URL}/merchant/tables`);
      const data = await res.json();
      setTables(data.items || []);
    } catch (err) {
      console.error('Fetch tables failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTableName) return;
    try {
      const res = await fetch(`${API_URL}/merchant/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTableName,
          code: `table-${Date.now()}`
        })
      });
      if (res.ok) {
        setNewTableName('');
        setShowAddModal(false);
        fetchTables();
      }
    } catch (err) {
      console.error('Add table failed:', err);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bàn này?')) return;
    try {
      await fetch(`${API_URL}/merchant/tables/${id}/delete`, { method: 'POST' });
      fetchTables();
    } catch (err) {
      console.error('Delete table failed:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải danh sách bàn...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Bàn & QR</h2>
          <p className="text-gray-500">Quản lý không gian quán và mã QR đặt món</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-black transition-all shadow-lg"
        >
          + Thêm bàn mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div key={table._id} className="bg-white border-2 border-black rounded-3xl p-6 shadow-[4px_4px_0px_#000] relative group">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <QRCodeSVG 
                  value={`https://bobababe.vn/order?table=${table.code}`} 
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{table.name}</h3>
                <p className="text-xs text-gray-400 font-mono mt-1 uppercase">{table.code}</p>
              </div>
              <div className="flex gap-2 w-full mt-2">
                <button 
                  onClick={() => handleDeleteTable(table._id)}
                  className="flex-1 py-2 text-red-600 font-bold text-sm border-2 border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                >
                  Xóa
                </button>
                <button className="flex-1 py-2 bg-gray-100 font-bold text-sm rounded-xl hover:bg-gray-200 transition-colors">
                  In QR
                </button>
              </div>
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
            <p className="text-gray-400">Chưa có bàn nào. Hãy thêm bàn đầu tiên để bắt đầu!</p>
          </div>
        )}
      </div>

      {/* Modal Thêm Bàn */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black rounded-[32px] p-8 w-full max-w-md shadow-[8px_8px_0px_#000]">
            <h3 className="text-2xl font-bold mb-6">Thêm bàn mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Tên bàn / Vị trí</label>
                <input 
                  type="text" 
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Vd: Bàn 01, Khu vực cửa sổ..."
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-black outline-none transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 font-bold text-gray-500 hover:text-gray-800"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleAddTable}
                  className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
