import React, { useState, useEffect } from 'react';
import styles from '../page.module.css';
import { API_URL } from '../constants';

export const PromoTab = ({ showModalOverride, onHide }: { showModalOverride?: boolean, onHide?: () => void }) => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModalOverride !== undefined) {
      setShowModal(showModalOverride);
    }
  }, [showModalOverride]);

  const closeModal = () => {
    setShowModal(false);
    if (onHide) onHide();
  };
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    minOrdersRequired: '',
    isHidden: false
  });

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/merchant/vouchers`);
      const data = await res.json();
      setVouchers(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`${API_URL}/merchant/vouchers/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchVouchers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.title || !formData.discountValue) {
      alert('Vui lòng nhập đủ thông tin bắt buộc');
      return;
    }
    
    try {
      await fetch(`${API_URL}/merchant/vouchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase(),
          discountValue: Number(formData.discountValue),
          minOrderValue: Number(formData.minOrderValue) || 0,
          minOrdersRequired: Number(formData.minOrdersRequired) || 0,
          isHidden: formData.isHidden
        })
      });
      closeModal();
      setFormData({ code: '', title: '', description: '', discountType: 'percentage', discountValue: '', minOrderValue: '', minOrdersRequired: '', isHidden: false });
      fetchVouchers();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tạo khuyến mãi');
    }
  };

  return (
    <section className={styles.tableSection} style={{ position: 'relative' }}>

      {loading ? (
        <p>Đang tải...</p>
      ) : vouchers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(26,26,26,0.5)', fontWeight: 600 }}>
          Chưa có chương trình khuyến mãi nào. Hãy tạo mã mới!
        </div>
      ) : (
        <div className={styles.menuTable}>
          {vouchers.map(v => (
            <div key={v._id} className={styles.menuItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemNameRow}>
                  <span className={styles.itemName}>{v.code}</span>
                  <span className={styles.itemBadge} style={{ backgroundColor: v.isActive ? 'var(--hot)' : '#ddd', color: v.isActive ? '#fff' : 'var(--ink)' }}>
                    {v.isActive ? 'Đang chạy' : 'Đã tắt'}
                  </span>
                  {v.isHidden && (
                    <span className={styles.itemBadge} style={{ backgroundColor: '#111', color: '#fff', marginLeft: '5px' }}>
                      Độc quyền VIP
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{v.title}</div>
                <div className={styles.itemSub}>{v.description}</div>
                <div style={{ fontSize: '12px', marginTop: '5px', color: 'var(--ink)', opacity: 0.7 }}>
                  Giảm {v.discountValue}{v.discountType === 'percentage' ? '%' : 'k'} - Đơn tối thiểu: {(v.minOrderValue || 0).toLocaleString()}đ
                </div>
                {v.minOrdersRequired > 0 && (
                  <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--hot)', fontWeight: 'bold' }}>
                    💎 Mở khóa sau: {v.minOrdersRequired} đơn hàng
                  </div>
                )}
              </div>
              <div className={styles.itemSales} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.salesLabel}>Đã dùng</div>
                  <div className={styles.salesValue}>{v.usageCount || 0}</div>
                </div>
                <button 
                  onClick={() => handleToggle(v._id, v.isActive)}
                  style={{ 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    border: 'none', 
                    backgroundColor: v.isActive ? '#ddd' : 'var(--mint)', 
                    color: v.isActive ? 'var(--ink)' : '#fff',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {v.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className={styles.modalOverlay} style={{ zIndex: 100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0 }}>Tạo Khuyến Mãi Mới</h3>
            
            <div className={styles.formGroup}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Mã Khuyến Mãi (Code)*</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="VD: FREESHIP50" 
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Tên hiển thị*</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="VD: Giảm 50k phí ship" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Loại giảm giá</label>
                <select 
                  className={styles.formSelect}
                  value={formData.discountType}
                  onChange={e => setFormData({...formData, discountType: e.target.value})}
                >
                  <option value="percentage">Phần trăm (%)</option>
                  <option value="fixed">Tiền mặt (VND)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Mức giảm*</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  placeholder={formData.discountType === 'percentage' ? "VD: 20" : "VD: 50000"} 
                  value={formData.discountValue}
                  onChange={e => setFormData({...formData, discountValue: e.target.value})}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Đơn tối thiểu (VND)</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  placeholder="VD: 200000" 
                  value={formData.minOrderValue}
                  onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Số đơn để mở khóa (Loyalty)</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  placeholder="VD: 20" 
                  value={formData.minOrdersRequired}
                  onChange={e => setFormData({...formData, minOrdersRequired: e.target.value})}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Mô tả chi tiết</label>
              <textarea 
                rows={2}
                className={styles.formTextarea} 
                placeholder="Nhập mô tả..." 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>

            <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="checkbox" 
                id="isHidden"
                checked={formData.isHidden}
                onChange={e => setFormData({...formData, isHidden: e.target.checked})}
                style={{ width: '18px', height: '18px', accentColor: 'var(--hot)' }}
              />
              <label htmlFor="isHidden" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ink)' }}>
                Ẩn mã này (Mã độc quyền, chỉ áp dụng khi khách tự nhập)
              </label>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={closeModal} style={{ borderRadius: '8px', padding: '10px 20px', border: '1px solid #ccc', backgroundColor: '#fff', fontWeight: 'bold' }}>Hủy</button>
              <button className={styles.btnSubmit} onClick={handleCreate} style={{ borderRadius: '8px', padding: '10px 20px', backgroundColor: '#D35400', color: '#fff', fontWeight: 'bold', border: 'none' }}>Lưu khuyến mãi</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
