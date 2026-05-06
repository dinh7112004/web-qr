import React, { useState } from 'react';
import styles from '../page.module.css';

export const OrdersTab = ({ orders = [] }: { orders?: any[] }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Chờ xử lý', class: styles.tagPending };
      case 'confirmed': return { text: 'Đã nhận', class: styles.tagReady };
      case 'preparing': return { text: 'Đang pha', class: styles.tagCooking };
      case 'ready': return { text: 'Xong / Chờ lấy', class: styles.tagReady };
      case 'completed': return { text: 'Hoàn thành', class: styles.tagReady };
      case 'cancelled': return { text: 'Đã huỷ', class: styles.tagPending };
      case 'checking_out': return { text: 'GỌI DỌN BÀN 💨', class: styles.tagCritical };
      default: return { text: status, class: '' };
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchesSearch = 
      o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.tableCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <section className={styles.tableSection}>
      {/* Detail Modal */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
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

              <div style={{ marginTop: '20px' }}>
                <p style={{ margin: '0 0 5px 0', opacity: 0.5, fontSize: '12px', fontWeight: 'bold' }}>GHI CHÚ</p>
                <p style={{ margin: 0, fontStyle: 'italic' }}>&quot;{selectedOrder.note || 'Không có ghi chú nào'}&quot;</p>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setSelectedOrder(null)}>Đóng</button>
              <button className={styles.btnPrimary} style={{ backgroundColor: 'var(--mint)' }}>In hoá đơn 🖨️</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
          <input 
            type="text" 
            className={styles.formInput} 
            placeholder="Tìm theo mã đơn, bàn, khách..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
          <select 
            className={styles.formSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã nhận đơn</option>
            <option value="preparing">Đang chuẩn bị</option>
            <option value="ready">Chờ lấy</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã huỷ</option>
            <option value="checking_out">Đang gọi dọn bàn</option>
          </select>
        </div>
        <div style={{ fontWeight: 'bold', color: 'var(--ink)' }}>
          Tổng: {filteredOrders.length} đơn
        </div>
      </div>

      {/* Orders Data Table */}
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Mã Đơn</th>
            <th>Thời gian</th>
            <th>Bàn</th>
            <th>Khách hàng</th>
            <th>Trạng thái</th>
            <th>Tổng tiền</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '50px', opacity: 0.5 }}>
                Không tìm thấy đơn hàng nào phù hợp 🥺
              </td>
            </tr>
          ) : filteredOrders.map((o) => {
            const status = getStatusInfo(o.status);
            return (
              <tr key={o._id}>
                <td style={{ fontWeight: 'bold' }}>{o.orderId}</td>
                <td style={{ fontSize: '13px' }}>{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</td>
                <td style={{ fontWeight: 'bold' }}>{o.tableCode || 'Takeaway'}</td>
                <td>{o.customerName || 'Khách vãng lai'}</td>
                <td>
                  <span className={`${styles.tableTag} ${status.class}`}>{status.text}</span>
                </td>
                <td style={{ fontWeight: 'bold', color: 'var(--hot)' }}>
                  {(o.total || 0).toLocaleString('vi-VN')}đ
                </td>
                <td>
                  <button 
                    className={styles.btnAction} 
                    onClick={() => setSelectedOrder(o)}
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
};
