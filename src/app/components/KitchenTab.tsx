import React, { useState } from 'react';
import styles from '../page.module.css';
import { API_URL } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface KitchenTabProps {
  orders?: any[];
  onRefresh?: () => void;
}

const BlinkingDot = () => (
  <motion.span
    animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    style={{
      display: 'inline-block',
      width: '12px',
      height: '12px',
      backgroundColor: '#FF4D6D',
      borderRadius: '50%',
      marginRight: '10px',
      boxShadow: '0 0 12px rgba(255, 77, 141, 0.6)'
    }}
  />
);

export const KitchenTab = ({ orders = [], onRefresh }: KitchenTabProps) => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const updateStatus = async (orderId: string, status: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${API_URL}/merchant/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        onRefresh?.();
      } else {
        alert('Cập nhật trạng thái thất bại');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pending = orders.filter(o => o.status === 'pending');
  const preparing = orders.filter(o => ['confirmed', 'preparing'].includes(o.status));
  const ready = orders.filter(o => o.status === 'ready');

  const OrderCard = ({ order, nextStatus, nextLabel, btnColor, accentColor }: { order: any, nextStatus?: string, nextLabel?: string, btnColor: string, accentColor: string }) => {
    const elapsedMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
    const isOverdue = elapsedMinutes >= 15;
    
    return (
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={() => setSelectedOrder(order)}
        style={{ 
          backgroundColor: '#fff',
          borderRadius: '32px',
          padding: '24px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.04)',
          marginBottom: '20px',
          border: `2px solid ${isOverdue ? '#FF4D6D22' : '#F8F9FA'}`,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
      >
        {isOverdue && (
          <div style={{ 
            position: 'absolute', top: 0, right: 0, 
            background: '#FF4D6D', color: '#fff', 
            padding: '4px 12px', fontSize: '10px', fontWeight: 900,
            borderRadius: '0 0 0 16px'
          }}>
            TRỄ NÈ SẾP 🚨
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isOverdue && <BlinkingDot />}
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--ink)' }}>{order.orderId}</div>
              <div style={{ fontSize: '12px', color: '#6c757d', fontWeight: 700, marginTop: '2px' }}>
                ⏱ {elapsedMinutes} phút trước
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '11px', fontWeight: 800, 
              color: accentColor, background: `${accentColor}15`,
              padding: '4px 10px', borderRadius: '12px',
              textTransform: 'uppercase', marginBottom: '4px'
            }}>
              {order.tableCode ? `Bàn ${order.tableCode}` : 'Mang đi 🛍️'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} style={{ 
              display: 'flex', gap: '12px',
              marginBottom: '10px', paddingBottom: '10px',
              borderBottom: idx < order.items.length - 1 ? '1px dashed #f0f0f0' : 'none'
            }}>
              <div style={{ 
                minWidth: '28px', height: '28px', 
                backgroundColor: 'var(--ink)', color: '#fff',
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900
              }}>
                {item.quantity}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px' }}>{item.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>
                    {item.size === 'x' ? 'XXL' : item.size === 'v' ? 'Vừa' : 'M'}
                  </span>
                </div>
                {item.toppings?.length > 0 && (
                  <div style={{ fontSize: '12px', color: accentColor, fontWeight: 600, marginTop: '2px' }}>
                    + {item.toppings.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {order.note && (
          <div style={{ 
            padding: '12px', backgroundColor: '#FFF9F0', 
            borderRadius: '16px', marginBottom: '20px',
            border: '1px solid #FFEED6'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 900, color: '#D4A373', textTransform: 'uppercase', marginBottom: '4px' }}>Ghi chú</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{order.note}</div>
          </div>
        )}

        {nextStatus && (
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              width: '100%', padding: '16px', fontSize: '14px', fontWeight: 900, 
              backgroundColor: isOverdue ? '#FF4D6D' : btnColor, color: '#fff', 
              border: 'none', borderRadius: '20px', cursor: 'pointer',
              boxShadow: `0 8px 20px ${btnColor}33`,
              textTransform: 'uppercase', letterSpacing: '1px'
            }}
            onClick={(e) => updateStatus(order.orderId, nextStatus, e)}
          >
            {nextLabel} ✨
          </motion.button>
        )}
      </motion.div>
    );
  };

  return (
    <section style={{ padding: '20px' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px' }}>
        
        {/* Column 1: Chờ xác nhận */}
        <div style={{ background: 'rgba(255, 77, 141, 0.03)', padding: '24px', borderRadius: '40px', border: '2px solid rgba(255, 77, 141, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#FF4D6D' }}>ĐƠN MỚI 🎀</h3>
            <span style={{ background: '#FF4D6D', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 900 }}>{pending.length}</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '4px' }}>
            <AnimatePresence mode="popLayout">
              {pending.map(o => (
                <OrderCard key={o._id} order={o} nextStatus="confirmed" nextLabel="Nhận đơn ngay" btnColor="#FF4D6D" accentColor="#FF4D6D" />
              ))}
            </AnimatePresence>
            {pending.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: '#FF4D6D44', fontWeight: 700, fontSize: '14px' }}>Đang đợi đơn mới nè...</div>}
          </div>
        </div>

        {/* Column 2: Đang chuẩn bị */}
        <div style={{ background: 'rgba(114, 9, 183, 0.03)', padding: '24px', borderRadius: '40px', border: '2px solid rgba(114, 9, 183, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#7209B7' }}>ĐANG PHA CHẾ ☕️</h3>
            <span style={{ background: '#7209B7', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 900 }}>{preparing.length}</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '4px' }}>
            <AnimatePresence mode="popLayout">
              {preparing.map(o => (
                <OrderCard key={o._id} order={o} nextStatus="ready" nextLabel="Xong rồi nè" btnColor="#7209B7" accentColor="#7209B7" />
              ))}
            </AnimatePresence>
            {preparing.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: '#7209B744', fontWeight: 700, fontSize: '14px' }}>Bếp đang rảnh rang ✨</div>}
          </div>
        </div>

        {/* Column 3: Sẵn sàng */}
        <div style={{ background: 'rgba(45, 106, 79, 0.03)', padding: '24px', borderRadius: '40px', border: '2px solid rgba(45, 106, 79, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#2D6A4F' }}>SẴN SÀNG GIAO ✅</h3>
            <span style={{ background: '#2D6A4F', color: '#fff', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 900 }}>{ready.length}</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '4px' }}>
            <AnimatePresence mode="popLayout">
              {ready.map(o => (
                <OrderCard key={o._id} order={o} nextStatus="completed" nextLabel="Giao xong" btnColor="#2D6A4F" accentColor="#2D6A4F" />
              ))}
            </AnimatePresence>
            {ready.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: '#2D6A4F44', fontWeight: 700, fontSize: '14px' }}>Chưa có món chờ lấy</div>}
          </div>
        </div>

      </div>
    </section>
  );
};
