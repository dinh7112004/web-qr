import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { API_URL } from '../constants';

interface Stat {
  label: string;
  value: string;
  trend: string;
  color: string;
  trendColor: string;
  textColor?: string;
}

export const OverviewTab = ({ orders: rawOrders = [], onRefresh, autoRefresh = true, onToggleAutoRefresh }: { orders?: any[], onRefresh?: () => void, autoRefresh?: boolean, onToggleAutoRefresh?: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editModal, setEditModal] = useState({ show: false, orderId: '', status: '', note: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, order: null as any, nextStatus: '', label: '' });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [dateMode, setDateMode] = useState<'day' | 'month' | 'all'>('day');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [slaFilterLevel, setSlaFilterLevel] = useState<string>('all');
  const [slaSearchQuery, setSlaSearchQuery] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString('vi-VN'));
    
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const localMonth = localDate.slice(0, 7);
    
    setSelectedDate(localDate);
    setSelectedMonth(localMonth);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      const now = new Date();
      const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      if (localDate !== selectedDate) {
        setSelectedDate(localDate);
        setSelectedMonth(localDate.slice(0, 7));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDate]);

  useEffect(() => {
    if (rawOrders.length > 0) {
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    }
  }, [rawOrders]);

  const filteredRawOrders = rawOrders.filter(o => {
    if (dateMode !== 'all' && o.createdAt) {
      try {
        const d = new Date(o.createdAt);
        const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
        const localDate = isoString.split('T')[0];
        const localMonth = isoString.slice(0, 7);
        if (dateMode === 'day' && selectedDate && localDate !== selectedDate) return false;
        if (dateMode === 'month' && selectedMonth && localMonth !== selectedMonth) return false;
      } catch { }
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'preparing' && !['confirmed', 'preparing'].includes(o.status)) return false;
      if (filterStatus !== 'preparing' && o.status !== filterStatus) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (o.orderId || '').toLowerCase().includes(q);
      const matchTable = (o.tableCode || '').toString().toLowerCase().includes(q);
      const matchCustomer = (o.customerName || o.customerPhone || '').toLowerCase().includes(q);
      if (!matchId && !matchTable && !matchCustomer) return false;
    }
    return true;
  });

  const orders = filteredRawOrders.map((o: any) => {
    let statusText = 'Mới';
    let statusClass = styles.tagPending;
    switch (o.status) {
      case 'pending': statusText = 'Chờ xử lý'; statusClass = styles.tagPending; break;
      case 'confirmed': statusText = 'Đã nhận'; statusClass = styles.tagReady; break;
      case 'preparing': statusText = 'Đang pha'; statusClass = styles.tagCooking; break;
      case 'ready': statusText = 'Xong / Chờ lấy'; statusClass = styles.tagReady; break;
      case 'completed': statusText = 'Hoàn thành'; statusClass = styles.tagReady; break;
      case 'cancelled': statusText = 'Đã huỷ'; statusClass = styles.tagPending; break;
      case 'checking_out': statusText = 'GỌI DỌN BÀN 💨'; statusClass = styles.tagCritical; break;
      default: statusText = o.status;
    }
    return { ...o, id: o.orderId, statusText, statusClass };
  });

  const openEditModal = (order: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditModal({ show: true, orderId: order.orderId, status: order.status, note: order.note || '' });
  };

  const closeEditModal = () => setEditModal({ show: false, orderId: '', status: '', note: '' });

  const updateOrderStatus = async (orderId: string, status: string, note: string = '') => {
    try {
      const res = await fetch(`${API_URL}/merchant/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      if (res.ok) {
        onRefresh?.();
        closeEditModal();
        setConfirmModal({ show: false, order: null, nextStatus: '', label: '' });
      }
    } catch (err) { console.error(err); }
  };

  const quickUpdate = (order: any, nextStatus: string, label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ show: true, order, nextStatus, label });
  };

  const totalOrders = orders.length;
  const processingOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.status)).length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  const currentTime = new Date().getTime();
  const rawSlas = rawOrders
    .filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status))
    .map(o => {
      const createdAt = o.createdAt ? new Date(o.createdAt).getTime() : currentTime;
      const elapsedMinutes = Math.floor((currentTime - createdAt) / 60000);
      if (elapsedMinutes >= 5) {
        return {
          id: o.orderId,
          uuid: o._id,
          table: o.tableCode || 'Takeaway',
          customer: o.customerName || 'Khách vãng lai',
          level: elapsedMinutes >= 10 ? 'Nghiêm trọng' : 'Khẩn cấp',
          elapsedMinutes,
          item: 'SLA Thời gian chờ',
          desc: `Đơn chờ hơn ${elapsedMinutes} phút.`,
        };
      }
      return null;
    }).filter(Boolean) as any[];

  const slas = rawSlas.filter(sla => {
    if (slaFilterLevel !== 'all' && sla.level !== slaFilterLevel) return false;
    if (slaSearchQuery.trim()) {
      const q = slaSearchQuery.toLowerCase();
      if (!sla.id.toLowerCase().includes(q) && !sla.table.toString().toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <>
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
                  </div>
                ))}
                <div style={{ borderTop: '1px dashed var(--ink)', marginTop: '15px', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>TỔNG CỘNG</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--hot)', fontSize: '18px' }}>{(selectedOrder.total || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
              {selectedOrder.note && (
                <div style={{ marginTop: '20px' }}>
                  <p style={{ margin: '0 0 5px 0', opacity: 0.5, fontSize: '12px', fontWeight: 'bold' }}>GHI CHÚ</p>
                  <p style={{ margin: 0, fontStyle: 'italic' }}>&quot;{selectedOrder.note}&quot;</p>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setSelectedOrder(null)}>Đóng</button>
              <button className={styles.btnPrimary} style={{ backgroundColor: 'var(--mint)' }}>In hoá đơn 🖨️</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.show && confirmModal.order && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--ink)' }}>Đánh dấu {confirmModal.label.toLowerCase()}?</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'rgba(26,26,26,0.6)', lineHeight: '1.5' }}>Đơn {confirmModal.order.orderId} sẽ chuyển sang &quot;{confirmModal.label}&quot;.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className={styles.btnCancel} onClick={() => setConfirmModal({ show: false, order: null, nextStatus: '', label: '' })} style={{ borderRadius: '8px', padding: '8px 16px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}>Hủy</button>
              <button className={styles.btnSubmit} onClick={() => updateOrderStatus(confirmModal.order.orderId, confirmModal.nextStatus)} style={{ borderRadius: '8px', padding: '8px 16px', backgroundColor: '#2962FF', color: '#fff', fontWeight: 'bold', border: 'none' }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && (
        <div className={styles.modalOverlay} style={{ zIndex: 1050 }}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.formGroup}><select className={styles.formSelect} value={editModal.status} onChange={e => setEditModal({...editModal, status: e.target.value})}><option value="pending">Chờ xử lý / Mới</option><option value="confirmed">Đã nhận</option><option value="preparing">Đang pha</option><option value="ready">Sẵn sàng / Chờ lấy</option><option value="completed">Đã phục vụ / Hoàn thành</option><option value="cancelled">Đã hủy</option></select></div>
            <div className={styles.formGroup}><textarea rows={4} className={styles.formTextarea} placeholder="Ghi chú..." value={editModal.note} onChange={e => setEditModal({...editModal, note: e.target.value})}></textarea></div>
            <div className={styles.modalActions}><button className={styles.btnCancel} onClick={closeEditModal} style={{ borderRadius: '8px', padding: '10px 20px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}>Hủy</button><button className={styles.btnSubmit} onClick={() => updateOrderStatus(editModal.orderId, editModal.status, editModal.note)} style={{ borderRadius: '8px', padding: '10px 20px', backgroundColor: '#D35400', color: '#fff', fontWeight: 'bold', border: 'none' }}>Lưu</button></div>
          </div>
        </div>
      )}

      <div className={styles.flexResponsive} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>Tổng quan vận hành</h2><p className={styles.sectionDesc}>Theo dõi nhanh trạng thái đơn hàng.</p></div>
        <div className={styles.flexResponsive} style={{ display: 'flex', gap: '10px' }}><div onClick={onToggleAutoRefresh} className={styles.btnSecondary} style={{ backgroundColor: autoRefresh ? 'var(--mint)' : '#ddd', padding: '8px 16px', borderRadius: '20px', border: '2px solid var(--ink)', fontWeight: 800, fontSize: '13px', cursor: 'pointer', userSelect: 'none', boxShadow: '2px 2px 0 var(--ink)' }}>Tự làm mới: {autoRefresh ? 'Bật' : 'Tắt'}</div><div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '13px', color: 'rgba(26,26,26,0.5)' }}>Cập nhật: {lastUpdated}</div></div>
      </div>

      <section className={styles.statsGrid}>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--peach)' }}><div className={styles.statLabel}>TỔNG ĐƠN HÀNG</div><div className={styles.statValue}>{totalOrders}</div></div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--lavn)' }}><div className={styles.statLabel}>ĐANG XỬ LÝ</div><div className={styles.statValue}>{processingOrders}</div></div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--hot)' }}><div className={styles.statLabel} style={{ color: '#fff' }}>CHỜ XÁC NHẬN</div><div className={styles.statValue} style={{ color: '#fff' }}>{pendingOrders}</div></div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--mint)' }}><div className={styles.statLabel}>DOANH THU</div><div className={styles.statValue}>{totalRevenue.toLocaleString('vi-VN')} ₫</div></div>
      </section>

      <section className={styles.tableSection}>
        <div className={styles.flexResponsive} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '15px' }}>
          <div className={styles.flexResponsive} style={{ display: 'flex', gap: '10px', flex: 1 }}><input type="text" className={styles.formInput} placeholder="Tìm đơn..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '250px' }} /><select className={styles.formSelect} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '180px' }}><option value="all">Tất cả</option><option value="pending">Chờ xử lý</option><option value="preparing">Đang pha</option><option value="ready">Chờ phục vụ</option><option value="completed">Hoàn thành</option></select></div>
          <div className={styles.flexResponsive} style={{ display: 'flex', gap: '10px' }}><select className={styles.formSelect} value={dateMode} onChange={(e: any) => setDateMode(e.target.value)} style={{ width: '120px' }}><option value="day">Theo ngày</option><option value="month">Theo tháng</option><option value="all">Tất cả</option></select>{dateMode === 'day' && <input type="date" className={styles.formInput} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />}{dateMode === 'month' && <input type="month" className={styles.formInput} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />}</div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead><tr><th>Mã Đơn</th><th>Thời gian</th><th>Bàn</th><th>Khách</th><th>Món chọn</th><th>Trạng thái</th><th>Tổng tiền</th><th>Thao tác</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (<tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>Chưa có đơn hàng nào 🥺</td></tr>) : orders.map((o, i) => (
                <tr key={i} onClick={() => setSelectedOrder(o)} style={{ cursor: 'pointer' }}>
                  <td><span className={styles.orderId}>{o.orderId}</span><span className={styles.orderUuid}>{o._id}</span></td>
                  <td style={{ fontSize: '13px' }}><div>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</div><div style={{ opacity: 0.5 }}>{new Date(o.createdAt).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div></td>
                  <td style={{ fontWeight: 800 }}>{o.tableCode || 'Takeaway'}</td>
                  <td>{o.customerName || 'Khách vãng lai'}</td>
                  <td>{o.items?.map((item: any, idx: number) => (<div key={idx} style={{ fontSize: '12px' }}><b>{item.quantity}x</b> {item.name}</div>))}</td>
                  <td><span className={`${styles.tableTag} ${o.statusClass}`}>{o.statusText}</span></td>
                  <td style={{ fontWeight: 800, color: 'var(--hot)' }}>{o.total?.toLocaleString('vi-VN')}₫</td>
                  <td>
                    {['completed', 'cancelled'].includes(o.status) ? (<span style={{ opacity: 0.4 }}>Xong ✨</span>) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className={styles.btnAction} onClick={(e) => openEditModal(o, e)}>Sửa</button>
                        {o.status === 'pending' && <button className={styles.btnAction} onClick={(e) => quickUpdate(o, 'confirmed', 'Đã nhận', e)} style={{ backgroundColor: 'var(--mint)' }}>Nhận</button>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className={styles.sectionTitle}>Cảnh báo SLA vận hành 🚨</h2>
      <section className={styles.tableSection}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead><tr><th>Mức độ</th><th>Đơn hàng</th><th>Quá hạn</th><th>Thao tác</th></tr></thead>
            <tbody>
              {slas.length === 0 ? (<tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>Không có cảnh báo 🎉</td></tr>) : slas.map((sla, i) => (
                <tr key={i} onClick={() => {
                  const fullOrder = rawOrders.find(ord => ord.orderId === sla.id);
                  if (fullOrder) setSelectedOrder(fullOrder);
                }} style={{ cursor: 'pointer' }}>
                  <td><span className={`${styles.tableTag} ${sla.level === 'Nghiêm trọng' ? styles.tagCritical : styles.tagPending}`}>{sla.level}</span></td>
                  <td><b>{sla.id}</b><br/><small>{sla.customer} - {sla.table}</small></td>
                  <td><span style={{ color: 'var(--hot)', fontWeight: 'bold' }}>{sla.elapsedMinutes} phút</span></td>
                  <td>
                    <button className={styles.btnAction} onClick={(e) => { 
                      e.stopPropagation(); 
                      const fullOrder = rawOrders.find(ord => ord.orderId === sla.id);
                      if (fullOrder) setSelectedOrder(fullOrder);
                    }}>Xử lý đơn</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};
