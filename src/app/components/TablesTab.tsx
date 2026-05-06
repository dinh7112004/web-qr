import React from 'react';
import styles from '../page.module.css';
import { API_URL } from '../constants';
import { QRCodeSVG } from 'qrcode.react';

export const TablesTab = ({ orders = [] }: { orders?: any[] }) => {
  const storeId = 'store-genz-01';
  const tables = [
    { id: 'A12', name: 'Bàn Cửa Sổ ✨' },
    { id: 'B01', name: 'Bàn Góc Chill 🌿' },
    { id: 'B05', name: 'Bàn Sofa Êm Ái 🛋️' },
    { id: 'C10', name: 'Bàn Hội Nhóm 👯' },
    { id: 'T01', name: 'Bàn VIP 👑' },
  ];

  const getQRData = (tableCode: string) => {
    return `https://smartmenu.com/scan?s=${storeId}&t=${tableCode}`;
  };

  const getTableInfo = (tableId: string) => {
    const tableOrders = orders.filter(o => 
      o.tableCode === tableId && 
      !['completed', 'cancelled'].includes(o.status)
    );
    
    if (tableOrders.length === 0) return { status: 'available' };

    // Tìm đơn sớm nhất để tính thời gian ngồi
    const earliestOrder = tableOrders.reduce((prev, curr) => {
      return (new Date(prev.createdAt).getTime() < new Date(curr.createdAt).getTime()) ? prev : curr;
    });

    const diffMs = new Date().getTime() - new Date(earliestOrder.createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    // Check if any order is requesting checkout
    const isRequestingCheckout = tableOrders.some(o => o.status === 'checking_out');

    return { 
      status: isRequestingCheckout ? 'checking_out' : 'occupied', 
      customer: earliestOrder.customerName,
      sittingTime: diffMins,
      activeOrders: tableOrders
    };
  };

  const clearTable = async (tableId: string, activeOrders: any[]) => {
    if (!confirm(`Xác nhận dọn bàn ${tableId}? Tất cả đơn hàng của bàn này sẽ được đánh dấu Hoàn thành.`)) return;

    try {
      for (const order of activeOrders) {
        await fetch(`${API_URL}/merchant/orders/${order.orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      }
      alert(`Đã dọn bàn ${tableId} sạch sẽ! ✨`);
      // Dashboard will auto-refresh every 5s
    } catch (error) {
      alert('Lỗi khi dọn bàn rồi sếp ơi! 😢');
    }
  };

  return (
    <section className={styles.tableSection}>
      <div style={{ marginBottom: '30px' }}>
        <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>Quản lý Bàn & Mã QR 📱</h2>
        <p className={styles.sectionDesc}>Trạng thái bàn cập nhật tự động. Bấm &quot;Dọn bàn&quot; khi khách đã thanh toán và ra về.</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
        {tables.map(t => {
          const info = getTableInfo(t.id);
          const isOccupied = info.status === 'occupied' || info.status === 'checking_out';
          const isCheckingOut = info.status === 'checking_out';

          return (
            <div key={t.id} style={{ 
              padding: '25px', 
              borderRadius: '30px', 
              border: '3px solid var(--ink)', 
              backgroundColor: '#fff',
              textAlign: 'center',
              boxShadow: isCheckingOut ? '8px 8px 0 #2962FF' : (isOccupied ? '8px 8px 0 var(--hot)' : '8px 8px 0 var(--ink)'),
              transition: 'all 0.2s',
              position: 'relative',
              overflow: 'hidden',
              animation: isCheckingOut ? 'pulse-blue 1.5s infinite' : 'none'
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
              
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', marginBottom: '5px', color: 'var(--ink)' }}>{t.id}</h3>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: isOccupied ? 'var(--hot)' : 'rgba(26,26,26,0.5)', marginBottom: '20px' }}>
                {isOccupied ? `👤 ${info.customer || 'Khách đang ngồi'}` : t.name}
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
                  value={getQRData(t.id)}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                {isOccupied ? (
                  <button 
                    className={styles.btnAction} 
                    style={{ flex: 1, margin: 0, backgroundColor: isCheckingOut ? '#2962FF' : 'var(--mint)', color: isCheckingOut ? '#fff' : 'var(--ink)' }}
                    onClick={() => clearTable(t.id, info.activeOrders || [])}
                  >
                    {isCheckingOut ? 'Dọn bàn ngay ✨' : 'Dọn bàn'}
                  </button>
                ) : (
                  <button className={styles.btnAction} style={{ flex: 1, margin: 0 }}>Tải ảnh QR</button>
                )}
                <button className={styles.btnAction} style={{ flex: 1, margin: 0, backgroundColor: 'var(--lavn)' }}>In mã</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
