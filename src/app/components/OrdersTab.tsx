import React, { useState } from 'react';
import styles from '../page.module.css';
import { motion } from 'framer-motion';
import { API_URL } from '../constants';

const BlinkingDot = () => (
  <motion.span
    animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }}
    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    style={{
      display: 'inline-block',
      width: '10px',
      height: '10px',
      backgroundColor: '#FF4D6D',
      borderRadius: '50%',
      marginRight: '8px',
      boxShadow: '0 0 10px rgba(255, 77, 141, 0.5)'
    }}
  />
);

export const OrdersTab = ({ orders = [], onRefresh }: { orders?: any[], onRefresh?: () => void }) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editModal, setEditModal] = useState({ show: false, orderId: '', status: '', note: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, order: null as any, nextStatus: '', label: '' });

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

  const updateOrderStatus = async (orderId: string, status: string, note: string = '') => {
    try {
      const res = await fetch(`${API_URL}/merchant/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      if (res.ok) {
        onRefresh?.();
        setEditModal({ show: false, orderId: '', status: '', note: '' });
        setConfirmModal({ show: false, order: null, nextStatus: '', label: '' });
      }
    } catch (err) {
      console.error(err);
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
      {/* Confirm Action Modal (From Overview) */}
      {confirmModal.show && confirmModal.order && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--ink)' }}>Đánh dấu {confirmModal.label.toLowerCase()}?</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'rgba(26,26,26,0.6)', lineHeight: '1.5' }}>
              Đơn {confirmModal.order.orderId} sẽ chuyển sang trạng thái &quot;{confirmModal.label}&quot;.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className={styles.btnCancel} onClick={() => setConfirmModal({ show: false, order: null, nextStatus: '', label: '' })} style={{ borderRadius: '8px', padding: '8px 16px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}>Hủy</button>
              <button className={styles.btnSubmit} onClick={() => updateOrderStatus(confirmModal.order.orderId, confirmModal.nextStatus)} style={{ borderRadius: '8px', padding: '8px 16px', backgroundColor: '#2962FF', color: '#fff', fontWeight: 'bold', border: 'none' }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal (From Overview) */}
      {editModal.show && (
        <div className={styles.modalOverlay} style={{ zIndex: 1050 }}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Cập nhật trạng thái</label>
              <select 
                className={styles.formSelect} 
                value={editModal.status} 
                onChange={e => setEditModal({...editModal, status: e.target.value})}
              >
                <option value="pending">Chờ xử lý / Mới</option>
                <option value="confirmed">Đã nhận</option>
                <option value="preparing">Đang pha</option>
                <option value="ready">Sẵn sàng / Chờ lấy</option>
                <option value="completed">Đã phục vụ / Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <textarea 
                rows={4} 
                className={styles.formTextarea} 
                placeholder="Ghi chú nội bộ cho lần cập nhật trạng thái..." 
                value={editModal.note}
                onChange={e => setEditModal({...editModal, note: e.target.value})}
              ></textarea>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setEditModal({ show: false, orderId: '', status: '', note: '' })} style={{ borderRadius: '8px', padding: '10px 20px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}>Hủy</button>
              <button className={styles.btnSubmit} onClick={() => updateOrderStatus(editModal.orderId, editModal.status, editModal.note)} style={{ borderRadius: '8px', padding: '10px 20px', backgroundColor: '#D35400', color: '#fff', fontWeight: 'bold', border: 'none' }}>Lưu trạng thái</button>
            </div>
          </div>
        </div>
      )}

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
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setSelectedOrder(null)}>Đóng</button>
              <button className={styles.btnPrimary} style={{ backgroundColor: 'var(--mint)' }}>In hoá đơn 🖨️</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className={styles.flexResponsive} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px' }}>
        <div className={styles.flexResponsive} style={{ display: 'flex', gap: '10px', flex: 1 }}>
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

      {/* Orders Data Table Wrapped */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Mã Đơn</th>
            <th>Thời gian</th>
            <th>Bàn</th>
            <th>Khách</th>
            <th>Món chọn</th>
            <th>Trạng thái</th>
            <th>Tổng tiền</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '50px', opacity: 0.5 }}>
                Không tìm thấy đơn hàng nào phù hợp 🥺
              </td>
            </tr>
          ) : filteredOrders.map((o) => {
            const status = getStatusInfo(o.status);
            const elapsed = (new Date().getTime() - new Date(o.createdAt).getTime()) / (60 * 1000);
            const isOverdue = ['pending', 'confirmed', 'preparing'].includes(o.status) && elapsed > 10;

            return (
              <tr key={o._id} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                <td>
                  <span className={styles.orderId} style={{ display: 'flex', alignItems: 'center' }}>
                    {isOverdue && <BlinkingDot />}
                    {o.orderId}
                  </span>
                  <span className={styles.orderUuid}>{o._id}</span>
                </td>
                <td style={{ fontSize: '13px', fontWeight: 600 }}>
                  <div>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                  <div style={{ color: 'var(--ink)', opacity: 0.5 }}>{new Date(o.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
                <td style={{ fontWeight: 800 }}>{o.tableCode || 'Takeaway'}</td>
                <td style={{ fontWeight: 600 }}>{o.customerName || 'Khách vãng lai'}</td>
                <td>
                  {o.items?.map((item: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '5px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.quantity}x {item.name}</div>
                      {item.size && <div style={{ fontSize: '11px', color: 'var(--hot)' }}>Size: {item.size === 'x' ? 'XXL' : item.size === 'v' ? 'Vừa' : 'Mini'}</div>}
                      {item.toppings?.length > 0 && (
                        <div style={{ fontSize: '11px', color: 'var(--hot)', fontWeight: 'bold' }}>
                          + {item.toppings.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </td>
                <td>
                  <span className={`${styles.tableTag} ${status.class}`}>{status.text}</span>
                </td>
                <td style={{ fontWeight: 800, color: 'var(--hot)' }}>
                  {(o.total || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td>
                  {['completed', 'cancelled'].includes(o.status) ? (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(26,26,26,0.4)' }}>
                      {o.status === 'completed' ? '✨ Xong' : '❌ Đã huỷ'}
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className={styles.btnAction} 
                        onClick={(e) => { e.stopPropagation(); setEditModal({ show: true, orderId: o.orderId, status: o.status, note: '' }); }}
                      >
                        Sửa
                      </button>
                      {o.status === 'pending' && (
                        <button 
                          className={styles.btnAction} 
                          style={{ backgroundColor: 'var(--mint)' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, order: o, nextStatus: 'confirmed', label: 'Đã nhận' }); }}
                        >
                          Nhận đơn
                        </button>
                      )}
                      {o.status === 'confirmed' && (
                        <button 
                          className={styles.btnAction} 
                          style={{ backgroundColor: 'var(--lavn)' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, order: o, nextStatus: 'preparing', label: 'Đang pha' }); }}
                        >
                          Đang pha
                        </button>
                      )}
                      {o.status === 'preparing' && (
                        <button 
                          className={styles.btnAction} 
                          style={{ backgroundColor: 'var(--peach)' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, order: o, nextStatus: 'ready', label: 'Sẵn sàng' }); }}
                        >
                          Sẵn sàng
                        </button>
                      )}
                      {o.status === 'ready' && (
                        <button 
                          className={styles.btnAction} 
                          style={{ backgroundColor: 'var(--hot)', color: '#fff' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, order: o, nextStatus: 'completed', label: 'Hoàn thành' }); }}
                        >
                          Giao xong
                        </button>
                      )}
                      {o.status === 'checking_out' && (
                        <button 
                          className={styles.btnAction} 
                          style={{ backgroundColor: 'var(--ink)', color: '#fff' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, order: o, nextStatus: 'completed', label: 'Đã dọn xong' }); }}
                        >
                          Dọn xong
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </section>
  );
};
