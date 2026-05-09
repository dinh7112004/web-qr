'use client';

import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { API_URL } from '../constants';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

interface Table {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
}

const BlinkingDot = () => (
  <motion.span
    animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    style={{
      display: 'inline-block',
      width: '12px',
      height: '12px',
      backgroundColor: '#FF4D6D',
      borderRadius: '50%',
      marginRight: '8px',
      boxShadow: '0 0 10px rgba(255, 77, 141, 0.6)'
    }}
  />
);

export const TablesTab = ({ orders = [] }: { orders?: any[] }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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

  const handleDeleteTable = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Xác nhận xóa bàn này khỏi hệ thống?')) return;
    try {
      await fetch(`${API_URL}/merchant/tables/${id}/delete`, { method: 'POST' });
      fetchTables();
    } catch (err) {
      console.error('Delete table failed:', err);
    }
  };

  const getQRData = (tableCode: string) => {
    return `https://bobababe.vn/order?s=store-genz-01&t=${tableCode}`;
  };

  const getTableInfo = (tableCode: string) => {
    const tableOrders = orders.filter(o => 
      o.tableCode === tableCode && 
      !['completed', 'cancelled'].includes(o.status)
    );
    
    if (tableOrders.length === 0) return { status: 'available' };

    const earliestOrder = tableOrders.reduce((prev, curr) => {
      return (new Date(prev.createdAt).getTime() < new Date(curr.createdAt).getTime()) ? prev : curr;
    });

    const diffMins = Math.floor((new Date().getTime() - new Date(earliestOrder.createdAt).getTime()) / 60000);
    const isRequestingCheckout = tableOrders.some(o => o.status === 'checking_out');
    const isOverdue = tableOrders.some(o => ['pending', 'confirmed', 'preparing'].includes(o.status) && diffMins > 10);

    return { 
      status: isRequestingCheckout ? 'checking_out' : 'occupied', 
      customer: earliestOrder.customerName || 'Khách tại bàn',
      sittingTime: diffMins,
      activeOrders: tableOrders,
      isOverdue,
      mainOrder: earliestOrder
    };
  };

  if (loading) return <div className={styles.loading}>Đang tải sơ đồ bàn thực tế...</div>;

  return (
    <section className={styles.tableSection}>
      {/* Detail Modal */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)} style={{ zIndex: 1200 }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>Chi tiết đơn {selectedOrder.orderId}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            
            <div style={{ margin: '20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', opacity: 0.5, fontSize: '12px', fontWeight: 'bold' }}>KHÁCH HÀNG</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>{selectedOrder.customerName || 'Khách vãng lai'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', opacity: 0.5, fontSize: '12px', fontWeight: 'bold' }}>BÀN</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>{selectedOrder.tableCode || 'Takeaway'}</p>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--paper)', padding: '20px', borderRadius: '20px', border: '2px solid var(--ink)' }}>
                <p style={{ margin: '0 0 15px 0', fontWeight: 'bold' }}>DANH SÁCH MÓN</p>
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold' }}>{item.quantity}x {item.name || 'Món không tên'}</span>
                      <span style={{ fontWeight: 'bold' }}>{((item.unitPrice || item.price || 0) * item.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: 'var(--hot)', fontWeight: 'bold' }}>
                      {item.size && <span>Size: {item.size === 'x' ? 'XXL (+10k)' : item.size === 'v' ? 'Vừa' : 'Mini'}</span>}
                      {item.toppings && item.toppings.length > 0 && (
                        <span>Topping: {item.toppings.join(', ')}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed var(--ink)', marginTop: '15px', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>TỔNG CỘNG</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--hot)', fontSize: '18px' }}>{(selectedOrder.total || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setSelectedOrder(null)}>Đóng</button>
              <button className={styles.btnPrimary} style={{ backgroundColor: 'var(--mint)' }}>In hoá đơn 🖨️</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>Sơ đồ bàn & QR 📱</h2>
          <p className={styles.sectionDesc}>Quản lý trạng thái phục vụ và mã QR dựa trên dữ liệu thực tế.</p>
        </div>
        <button 
          className={styles.btnPrimary} 
          onClick={() => setShowAddModal(true)}
          style={{ padding: '15px 30px', fontSize: '16px' }}
        >
          + Thêm bàn mới
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {tables.map(t => {
          const info = getTableInfo(t.code);
          const isOccupied = info.status === 'occupied' || info.status === 'checking_out';
          const isCheckingOut = info.status === 'checking_out';

          return (
            <div key={t._id} onClick={() => isOccupied && setSelectedOrder(info.mainOrder)} style={{ 
              padding: '25px', 
              borderRadius: '30px', 
              border: '3px solid var(--ink)', 
              backgroundColor: '#fff',
              textAlign: 'center',
              boxShadow: isCheckingOut ? '8px 8px 0 #2962FF' : (isOccupied ? '8px 8px 0 var(--hot)' : '8px 8px 0 var(--ink)'),
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              cursor: isOccupied ? 'pointer' : 'default'
            }}>
              {isOccupied && (
                <div style={{ 
                  position: 'absolute', top: '15px', right: '-35px', 
                  backgroundColor: isCheckingOut ? '#2962FF' : 'var(--hot)', color: '#fff', 
                  padding: '5px 40px', transform: 'rotate(45deg)',
                  fontSize: '10px', fontWeight: 'bold', border: '2px solid var(--ink)',
                  zIndex: 10
                }}>
                  {isCheckingOut ? 'GỌI DỌN BÀN' : `${info.sittingTime} PHÚT`}
                </div>
              )}

              {isOccupied && info.isOverdue && (
                <div style={{ position: 'absolute', top: '10px', left: '15px' }}>
                  <BlinkingDot />
                </div>
              )}
              
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '5px', color: 'var(--ink)' }}>{t.name}</h3>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: isOccupied ? 'var(--hot)' : 'rgba(26,26,26,0.5)', marginBottom: '20px' }}>
                {isOccupied ? `👤 ${info.customer}` : 'Bàn đang trống'}
              </p>
              
              <div style={{ 
                backgroundColor: 'var(--paper)', 
                padding: '20px', 
                borderRadius: '20px', 
                border: '2px dashed var(--ink)',
                marginBottom: '20px',
                display: 'inline-block',
                opacity: isOccupied ? 0.3 : 1
              }}>
                <QRCodeSVG 
                  value={getQRData(t.code)}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {isOccupied ? (
                  <button className={styles.btnAction} onClick={(e) => e.stopPropagation()} style={{ flex: 1, margin: 0, backgroundColor: isCheckingOut ? '#2962FF' : 'var(--mint)', color: isCheckingOut ? '#fff' : 'var(--ink)' }}>
                    Dọn bàn
                  </button>
                ) : (
                  <button className={styles.btnAction} style={{ flex: 1, margin: 0, color: '#e74c3c' }} onClick={(e) => handleDeleteTable(t._id, e)}>Xóa bàn</button>
                )}
                <button className={styles.btnAction} onClick={(e) => e.stopPropagation()} style={{ flex: 1, margin: 0, backgroundColor: 'var(--lavn)' }}>In mã</button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', border: '3px solid var(--ink)', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '10px 10px 0 var(--ink)' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '20px' }}>Thêm bàn mới</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Tên bàn / Vị trí</label>
              <input 
                type="text" 
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Vd: Bàn 01, Tầng 2..."
                style={{ width: '100%', padding: '15px', border: '2px solid var(--ink)', borderRadius: '15px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '15px', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleAddTable} className={styles.btnPrimary} style={{ flex: 2 }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
