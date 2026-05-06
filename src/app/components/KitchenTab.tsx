import React from 'react';
import styles from '../page.module.css';

interface KitchenTabProps {
  orders?: any[];
  onRefresh?: () => void;
}

export const KitchenTab = ({ orders = [], onRefresh }: KitchenTabProps) => {
  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`http://192.168.1.186:3000/merchant/orders/${orderId}/status`, {
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
      alert('Lỗi kết nối máy chủ');
    }
  };

  const pending = orders.filter(o => o.status === 'pending');
  const preparing = orders.filter(o => ['confirmed', 'preparing'].includes(o.status));
  const ready = orders.filter(o => o.status === 'ready');

  const OrderCard = ({ order, nextStatus, nextLabel, btnColor, headerBg }: { order: any, nextStatus?: string, nextLabel?: string, btnColor: string, headerBg: string }) => {
    const elapsedMinutes = Math.floor((new Date().getTime() - new Date(order.createdAt).getTime()) / 60000);
    const isOverdue = elapsedMinutes >= 10;
    const isWarning = elapsedMinutes >= 5 && !isOverdue;

    const currentHeaderBg = isOverdue ? '#E74C3C' : isWarning ? '#F39C12' : headerBg;

    return (
      <div style={{ 
        display: 'flex', flexDirection: 'column', 
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        marginBottom: '20px',
        border: '1px solid rgba(0,0,0,0.05)'
      }}>
        {/* Ticket Header */}
        <div style={{ 
          backgroundColor: currentHeaderBg, 
          padding: '12px 16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#fff'
        }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>{order.orderId}</div>
            <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>⏱ {elapsedMinutes} phút</span>
              {isOverdue && <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>QUÁ HẠN</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', opacity: 0.9, textTransform: 'uppercase' }}>{order.tableCode ? 'Tại Bàn' : 'Mang đi'}</div>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>{order.tableCode || 'Takeaway'}</div>
          </div>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: '16px' }}>
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} style={{ 
              display: 'flex', 
              marginBottom: '12px', 
              borderBottom: idx < order.items.length - 1 ? '1px dashed #ddd' : 'none', 
              paddingBottom: idx < order.items.length - 1 ? '12px' : '0' 
            }}>
              <div style={{ 
                width: '32px', height: '32px', 
                backgroundColor: 'var(--paper)', 
                borderRadius: '8px', 
                display: 'flex', justifyContent: 'center', alignItems: 'center', 
                fontWeight: 900, fontSize: '16px', 
                marginRight: '12px', color: 'var(--ink)'
              }}>
                {item.quantity}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--ink)', lineHeight: '1.2' }}>{item.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#8E44AD', backgroundColor: 'rgba(142, 68, 173, 0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                    {item.size === 'x' ? 'XXL' : item.size === 'v' ? 'Vừa' : 'M'}
                  </span>
                </div>
                {item.toppings?.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#D35400', fontWeight: 600, marginTop: '4px' }}>
                    + {item.toppings.join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}

          {order.note && (
            <div style={{ 
              marginTop: '16px', 
              padding: '10px 12px', 
              backgroundColor: 'rgba(243, 156, 18, 0.1)', 
              borderRadius: '8px', 
              borderLeft: '4px solid #F39C12' 
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#F39C12', marginBottom: '2px', textTransform: 'uppercase' }}>Ghi chú KH</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>{order.note}</div>
            </div>
          )}
        </div>

        {/* Ticket Footer / Action */}
        {nextStatus && (
          <div style={{ padding: '0 16px 16px 16px' }}>
            <button 
              style={{ 
                width: '100%', padding: '14px', fontSize: '15px', fontWeight: 800, 
                backgroundColor: isOverdue ? '#E74C3C' : btnColor, color: '#fff', 
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}
              onClick={() => updateStatus(order.orderId, nextStatus)}
            >
              {nextLabel}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={styles.tableSection}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Column 1: Chờ xác nhận */}
        <div style={{ backgroundColor: '#F8F9FA', padding: '20px', borderRadius: '16px', border: '1px solid #E9ECEF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #DEE2E6' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#495057', textTransform: 'uppercase' }}>Đơn Mới</h3>
            <span style={{ backgroundColor: '#495057', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 800 }}>{pending.length}</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '4px' }}>
            {pending.map(o => (
              <OrderCard key={o._id} order={o} nextStatus="confirmed" nextLabel="Nhận đơn" headerBg="#343A40" btnColor="#343A40" />
            ))}
            {pending.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#ADB5BD', fontWeight: 600 }}>Không có đơn mới</div>}
          </div>
        </div>

        {/* Column 2: Đang chuẩn bị */}
        <div style={{ backgroundColor: '#F4F0F8', padding: '20px', borderRadius: '16px', border: '1px solid #E8DAEF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #D7BDE2' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#8E44AD', textTransform: 'uppercase' }}>Đang Pha Chế</h3>
            <span style={{ backgroundColor: '#8E44AD', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 800 }}>{preparing.length}</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '4px' }}>
            {preparing.map(o => (
              <OrderCard key={o._id} order={o} nextStatus="ready" nextLabel="Hoàn thành món" headerBg="#8E44AD" btnColor="#8E44AD" />
            ))}
            {preparing.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#C39BD3', fontWeight: 600 }}>Khu vực bếp đang rảnh</div>}
          </div>
        </div>

        {/* Column 3: Sẵn sàng */}
        <div style={{ backgroundColor: '#E9F7EF', padding: '20px', borderRadius: '16px', border: '1px solid #D4EFDF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #A9DFBF' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#27AE60', textTransform: 'uppercase' }}>Sẵn Sàng Giao</h3>
            <span style={{ backgroundColor: '#27AE60', color: '#fff', padding: '2px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 800 }}>{ready.length}</span>
          </div>
          <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: '4px' }}>
            {ready.map(o => (
              <OrderCard key={o._id} order={o} nextStatus="completed" nextLabel="Xác nhận đã giao" headerBg="#27AE60" btnColor="#27AE60" />
            ))}
            {ready.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#7DCEA0', fontWeight: 600 }}>Chưa có món chờ lấy</div>}
          </div>
        </div>

      </div>
    </section>
  );
};
