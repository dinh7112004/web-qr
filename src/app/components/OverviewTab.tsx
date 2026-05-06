import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';

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
  const [dateMode, setDateMode] = useState<'day' | 'month' | 'all'>('day');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [slaFilterLevel, setSlaFilterLevel] = useState<string>('all');
  const [slaSearchQuery, setSlaSearchQuery] = useState<string>('');

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  }, []);

  useEffect(() => {
    if (rawOrders.length > 0) {
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
    }
  }, [rawOrders]);

  const filteredRawOrders = rawOrders.filter(o => {
    // 1. Date/Month Filter
    if (dateMode !== 'all' && o.createdAt) {
      try {
        const d = new Date(o.createdAt);
        const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
        const localDate = isoString.split('T')[0];
        const localMonth = isoString.slice(0, 7);
        
        if (dateMode === 'day' && selectedDate) {
          if (localDate !== selectedDate) return false;
        } else if (dateMode === 'month' && selectedMonth) {
          if (localMonth !== selectedMonth) return false;
        }
      } catch {
        // keep if invalid date
      }
    }

    // 2. Status Filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'preparing' && !['confirmed', 'preparing'].includes(o.status)) return false;
      if (filterStatus !== 'preparing' && o.status !== filterStatus) return false;
    }

    // 3. Search Filter
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

    return {
      id: o.orderId,
      uuid: o._id,
      table: o.tableCode || 'Takeaway',
      customer: o.customerName || o.customerPhone || 'Khách vãng lai',
      status: statusText,
      statusRaw: o.status,
      total: `${(o.total || 0).toLocaleString('vi-VN')} ₫`,
      statusClass: statusClass,
      items: o.items || [],
      createdAt: o.createdAt
    };
  });

  const openEditModal = (order: any) => {
    setEditModal({ show: true, orderId: order.id, status: order.statusRaw, note: '' });
  };

  const closeEditModal = () => {
    setEditModal({ show: false, orderId: '', status: '', note: '' });
  };

  const updateOrderStatus = async (orderId: string, status: string, note: string = '') => {
    try {
      const res = await fetch(`http://192.168.1.186:3000/merchant/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });
      if (res.ok) {
        onRefresh?.();
        closeEditModal();
        setConfirmModal({ show: false, order: null, nextStatus: '', label: '' });
      } else {
        alert('Cập nhật trạng thái thất bại');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi mạng khi cập nhật trạng thái');
    }
  };

  const quickUpdate = (order: any, nextStatus: string, label: string) => {
    setConfirmModal({ show: true, order, nextStatus, label });
  };

  const totalOrders = orders.length;
  const processingOrders = orders.filter(o => ['confirmed', 'preparing'].includes(o.statusRaw)).length;
  const pendingOrders = orders.filter(o => o.statusRaw === 'pending').length;
  const totalRevenue = orders.reduce((sum, o) => {
    const num = parseInt((o.total || '0').replace(/\D/g, ''));
    return sum + num;
  }, 0);

  // Generate SLA alerts from active orders
  const currentTime = new Date().getTime();
  const rawSlas = rawOrders
    .filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status))
    .map(o => {
      const createdAt = o.createdAt ? new Date(o.createdAt).getTime() : currentTime;
      const elapsedMinutes = Math.floor((currentTime - createdAt) / 60000);
      
      if (elapsedMinutes >= 5) {
        const level = elapsedMinutes >= 10 ? 'Nghiêm trọng' : 'Khẩn cấp';
        return {
          id: o.orderId,
          uuid: o._id,
          table: o.tableCode || 'Takeaway',
          customer: o.customerName || o.customerPhone || 'Khách vãng lai',
          level,
          elapsedMinutes,
          target: '10 phút',
          item: 'SLA Thời gian chờ',
          desc: `Đơn chờ hơn ${elapsedMinutes} phút.`,
          assignee: 'Chưa phân công',
          updated: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
        };
      }
      return null;
    })
    .filter(Boolean) as any[];

  // Filter SLAs
  const slas = rawSlas.filter(sla => {
    if (slaFilterLevel !== 'all' && sla.level !== slaFilterLevel) return false;
    if (slaSearchQuery.trim()) {
      const q = slaSearchQuery.toLowerCase();
      if (!sla.id.toLowerCase().includes(q) && !sla.table.toString().toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalSlas = slas.length;
  const criticalSlas = slas.filter(s => s.level === 'Nghiêm trọng').length;
  const highSlas = slas.filter(s => s.level === 'Khẩn cấp').length;

  return (
    <>
      {/* Confirm Action Modal */}
      {confirmModal.show && confirmModal.order && (
        <div className={styles.modalOverlay} style={{ zIndex: 110 }}>
          <div className={styles.modalContent} style={{ maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--ink)' }}>Đánh dấu {confirmModal.label.toLowerCase()}?</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: 'rgba(26,26,26,0.6)', lineHeight: '1.5' }}>
              Đơn {confirmModal.order.id} sẽ chuyển sang trạng thái &quot;{confirmModal.label}&quot;.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className={styles.btnCancel} onClick={() => setConfirmModal({ show: false, order: null, nextStatus: '', label: '' })} style={{ borderRadius: '8px', padding: '8px 16px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}>Hủy</button>
              <button className={styles.btnSubmit} onClick={() => updateOrderStatus(confirmModal.order.id, confirmModal.nextStatus)} style={{ borderRadius: '8px', padding: '8px 16px', backgroundColor: '#2962FF', color: '#fff', fontWeight: 'bold', border: 'none' }}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editModal.show && (
        <div className={styles.modalOverlay} style={{ zIndex: 100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.formGroup}>
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
              <button className={styles.btnCancel} onClick={closeEditModal} style={{ borderRadius: '8px', padding: '10px 20px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}>Hủy</button>
              <button className={styles.btnSubmit} onClick={() => updateOrderStatus(editModal.orderId, editModal.status, editModal.note)} style={{ borderRadius: '8px', padding: '10px 20px', backgroundColor: '#D35400', color: '#fff', fontWeight: 'bold', border: 'none' }}>Lưu trạng thái</button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Operational Overview Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className={styles.sectionTitle} style={{ marginTop: 0 }}>Tổng quan vận hành</h2>
          <p className={styles.sectionDesc}>Theo dõi nhanh trạng thái đơn tại cửa hàng hiện tại.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div 
            onClick={onToggleAutoRefresh}
            style={{ 
              backgroundColor: autoRefresh ? 'var(--mint)' : '#ddd', 
              padding: '8px 16px', 
              borderRadius: '20px', 
              border: '2px solid var(--ink)', 
              fontWeight: 800, 
              fontSize: '13px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            Tự làm mới: {autoRefresh ? 'Bật' : 'Tắt'}
          </div>
          <div style={{ padding: '8px 16px', fontWeight: 600, fontSize: '13px', color: 'rgba(26,26,26,0.5)' }}>
            Lần cập nhật gần nhất: {lastUpdated}
          </div>
        </div>
      </div>

      <section className={styles.statsGrid}>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--peach)' }}>
          <div className={styles.statLabel}>TỔNG ĐƠN HÀNG</div>
          <div className={styles.statValue}>{totalOrders}</div>
          <div className={styles.statTrend} style={{ color: '#D35400' }}>Tất cả trạng thái</div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--lavn)' }}>
          <div className={styles.statLabel}>ĐANG XỬ LÝ (BẾP)</div>
          <div className={styles.statValue}>{processingOrders}</div>
          <div className={styles.statTrend} style={{ color: '#8E44AD' }}>Đã nhận + đang pha</div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--hot)' }}>
          <div className={styles.statLabel} style={{ color: '#fff' }}>CHỜ XÁC NHẬN</div>
          <div className={styles.statValue} style={{ color: '#fff' }}>{pendingOrders}</div>
          <div className={styles.statTrend} style={{ color: '#fff' }}>Đơn mới từ khách</div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--mint)' }}>
          <div className={styles.statLabel}>DOANH THU</div>
          <div className={styles.statValue}>{totalRevenue.toLocaleString('vi-VN')} ₫</div>
          <div className={styles.statTrend} style={{ color: '#27AE60' }}>Theo dữ liệu bảng hiện tại</div>
        </div>
      </section>

      {/* Orders Table */}
      <section className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          {/* LEFT SIDE: Search & Status Filter */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className={styles.formInput} 
              placeholder="Tìm order / bàn / khách" 
              style={{ width: '250px', padding: '10px' }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              className={styles.formSelect} 
              style={{ width: '180px', padding: '10px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="preparing">Đang xử lý (bếp)</option>
              <option value="ready">Chờ phục vụ / Xong</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã huỷ</option>
            </select>
          </div>

          {/* RIGHT SIDE: Date Filter */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              className={styles.formSelect} 
              style={{ padding: '10px', width: '140px' }}
              value={dateMode}
              onChange={(e: any) => setDateMode(e.target.value)}
            >
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="all">Tất cả TG</option>
            </select>

            {dateMode === 'day' && (
              <input 
                type="date" 
                className={styles.formInput} 
                style={{ width: '150px', padding: '10px' }} 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            )}

            {dateMode === 'month' && (
              <input 
                type="month" 
                lang="vi-VN"
                className={styles.formInput} 
                style={{ width: '150px', padding: '10px' }} 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            )}
          </div>
        </div>

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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'rgba(26,26,26,0.5)', fontWeight: 600 }}>
                  Chưa có đơn hàng nào nè 🥺
                </td>
              </tr>
            ) : orders.map((o, i) => (
              <tr key={i}>
                <td>
                  <span className={styles.orderId}>{o.id}</span>
                  <span className={styles.orderUuid}>{o.uuid}</span>
                </td>
                <td style={{ fontSize: '13px', fontWeight: 600 }}>
                  <div>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</div>
                  <div style={{ color: 'var(--ink)', opacity: 0.5 }}>{o.createdAt ? new Date(o.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''}</div>
                </td>
                <td style={{ fontWeight: 800 }}>{o.table}</td>
                <td style={{ fontWeight: 600 }}>{o.customer}</td>
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
                  <span className={`${styles.tableTag} ${o.statusClass}`}>{o.status}</span>
                </td>
                <td style={{ fontWeight: 800, color: 'var(--hot)' }}>{o.total}</td>
                <td>
                  {['completed', 'cancelled'].includes(o.statusRaw) ? (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(26,26,26,0.4)' }}>
                      {o.statusRaw === 'completed' ? '✨ Xong' : '❌ Đã huỷ'}
                    </span>
                  ) : (
                    <>
                      <button className={styles.btnAction} onClick={() => openEditModal(o)}>Sửa</button>
                      {o.statusRaw === 'pending' && <button className={styles.btnAction} onClick={() => quickUpdate(o, 'confirmed', 'Đã nhận')} style={{ backgroundColor: 'var(--mint)' }}>Nhận đơn</button>}
                      {o.statusRaw === 'confirmed' && <button className={styles.btnAction} onClick={() => quickUpdate(o, 'preparing', 'Đang nấu')} style={{ backgroundColor: 'var(--lavn)' }}>Đang nấu</button>}
                      {o.statusRaw === 'preparing' && <button className={styles.btnAction} onClick={() => quickUpdate(o, 'ready', 'Sẵn sàng')} style={{ backgroundColor: 'var(--peach)' }}>Sẵn sàng</button>}
                      {o.statusRaw === 'ready' && <button className={styles.btnAction} onClick={() => quickUpdate(o, 'completed', 'Đã phục vụ')} style={{ backgroundColor: 'var(--hot)', color: '#fff' }}>Đã phục vụ</button>}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(26,26,26,0.5)', fontWeight: 600 }}>
          <span>Tổng {orders.length} bản ghi</span>
          <span>Trang 1/1</span>
        </div>
      </section>

      {/* 2. SLA Alerts Section */}
      <h2 className={styles.sectionTitle}>Cảnh báo SLA vận hành 🚨</h2>
      <p className={styles.sectionDesc}>Theo dõi cảnh báo quá hạn theo mức độ ưu tiên để xử lý nhanh tại ca trực.</p>

      <section className={styles.statsGrid}>
        <div className={styles.statCard} style={{ backgroundColor: '#fff' }}>
          <div className={styles.statLabel}>TỔNG CẢNH BÁO</div>
          <div className={styles.statValue} style={{ color: 'var(--hot)' }}>{totalSlas}</div>
          <div className={styles.statTrend}>Trong bộ lọc hiện tại</div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: '#fff' }}>
          <div className={styles.statLabel}>NGHIÊM TRỌNG</div>
          <div className={styles.statValue} style={{ color: 'var(--hot)' }}>{criticalSlas}</div>
          <div className={styles.statTrend}>Ưu tiên xử lý ngay</div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: '#fff' }}>
          <div className={styles.statLabel}>KHẨN CẤP</div>
          <div className={styles.statValue} style={{ color: '#D35400' }}>{highSlas}</div>
          <div className={styles.statTrend}>Cần xử lý trong ca</div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: '#fff' }}>
          <div className={styles.statLabel}>CHƯA XÁC NHẬN</div>
          <div className={styles.statValue} style={{ color: '#D35400' }}>{totalSlas}</div>
          <div className={styles.statTrend}>Chưa có người nhận xử lý</div>
        </div>
      </section>

      {/* SLA Table */}
      <section className={styles.tableSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select 
              className={styles.formSelect} 
              style={{ width: '200px', padding: '10px' }}
              value={slaFilterLevel}
              onChange={(e) => setSlaFilterLevel(e.target.value)}
            >
              <option value="all">Tất cả mức độ</option>
              <option value="Nghiêm trọng">Nghiêm trọng</option>
              <option value="Khẩn cấp">Khẩn cấp</option>
            </select>
            <input 
              type="text" 
              className={styles.formInput} 
              placeholder="Tìm theo mã đơn, bàn..." 
              style={{ width: '250px', padding: '10px' }} 
              value={slaSearchQuery}
              onChange={(e) => setSlaSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.btnSecondary} onClick={() => onRefresh?.()} style={{ padding: '10px 20px' }}>Tải lại cảnh báo 🔄</button>
        </div>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Mức độ</th>
              <th>Hạng mục</th>
              <th>Đơn liên quan</th>
              <th>Quá hạn</th>
              <th>Phụ trách</th>
              <th>Cập nhật</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {slas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'rgba(26,26,26,0.5)', fontWeight: 600 }}>
                  Tuyệt vời! Không có cảnh báo SLA nào hiện tại 🎉
                </td>
              </tr>
            ) : slas.map((sla, i) => (
              <tr key={i}>
                <td>
                  <span 
                    className={`${styles.tableTag} ${sla.level === 'Nghiêm trọng' ? styles.tagCritical : styles.tagPending}`} 
                    style={sla.level === 'Khẩn cấp' ? { backgroundColor: '#F39C12', color: '#fff' } : {}}
                  >
                    {sla.level}
                  </span>
                </td>
                <td>
                  <span className={styles.orderId}>{sla.item}</span>
                  <span className={styles.orderUuid}>{sla.desc}</span>
                </td>
                <td>
                  <span className={styles.orderId}>{sla.id}</span>
                  <span className={styles.orderUuid}>{sla.table}</span>
                </td>
                <td>
                  <span className={styles.orderId} style={{ color: sla.level === 'Nghiêm trọng' ? 'var(--hot)' : '#D35400' }}>{sla.elapsedMinutes} phút</span>
                  <span className={styles.orderUuid}>Mục tiêu: {sla.target}</span>
                </td>
                <td style={{ fontWeight: 600 }}>{sla.assignee}</td>
                <td style={{ fontWeight: 600, fontSize: '13px' }}>{sla.updated}</td>
                <td>
                  <button className={styles.btnAction} onClick={() => openEditModal({ id: sla.id, statusRaw: 'preparing' })}>Xử lý đơn</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(26,26,26,0.5)', fontWeight: 600 }}>
          <span>Tổng {totalSlas} bản ghi · 10 bản ghi/trang</span>
          <span>Trước · Trang 1/1 · Sau</span>
        </div>
      </section>
    </>
  );
};
