import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';
import { API_URL } from '../constants';
import { Icon } from './Icon';

interface MenuItem {
  id: string;
  name: string;
  sub: string;
  price: string;
  sales: number;
  badge: string;
  badgeColor: string;
  image: string;
  isActive: boolean;
  rawPrice: number;
  tags: string[];
  categoryCode: string;
}

export const MenuTab = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [metrics, setMetrics] = useState({
    scansToday: 0,
    scansTrend: 0,
    completedOrdersToday: 0,
    ordersTrend: 0,
    revenueToday: 0,
    revenueTrend: 0,
    storyTagsToday: 0,
    storyTagsTrend: 0
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    price: '', 
    category: 'tea', 
    desc: '', 
    image: '', 
    tags: '', 
    status: 'active' 
  });

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_URL}/merchant/menu/items?storeId=store-genz-01&includeInactive=true`);
      const data = await res.json();
      
      if (data.items) {
        const formattedItems = data.items.map((item: any) => ({
          id: item._id,
          name: item.name['vi-VN'],
          sub: item.desc ? item.desc['vi-VN'] : '',
          price: `${(item.price / 1000).toString()}k`,
          sales: Math.floor(Math.random() * 300) + 50,
          badge: item.tags && item.tags.length > 0 ? item.tags[0].toUpperCase() : '',
          badgeColor: item.color || 'var(--hot)',
          image: item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&q=80',
          isActive: item.isActive,
          rawPrice: item.price,
          tags: item.tags || [],
          categoryCode: item.categoryCode || 'tea'
        }));
        setItems(formattedItems);
      }
      
      const metricsRes = await fetch(`${API_URL}/merchant/metrics?storeId=store-genz-01`);
      const metricsData = await metricsRes.json();
      if (metricsData) {
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualStoryTag = async () => {
    try {
      await fetch(`${API_URL}/merchant/metrics/story-tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: 'store-genz-01', username: 'manual-entry' })
      });
      // Optimistic update
      setMetrics(prev => ({
        ...prev,
        storyTagsToday: prev.storyTagsToday + 1
      }));
    } catch (e) {
      console.error('Failed to log story tag', e);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleItem = async (id: string, currentStatus: boolean) => {
    setItems(items.map(item => item.id === id ? { ...item, isActive: !currentStatus } : item));
    try {
      await fetch(`${API_URL}/merchant/menu/items/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
    } catch (error) {
      setItems(items.map(item => item.id === id ? { ...item, isActive: currentStatus } : item));
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Bestie chắc chắn muốn xoá món này chứ? 🥺')) return;
    try {
      await fetch(`${API_URL}/merchant/menu/items/${id}/delete`, { method: 'POST' });
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert('Xoá thất bại rùi 😢');
    }
  };

  const handleEditItemClick = (item: MenuItem) => {
    setEditItemId(item.id);
    setNewItem({
      name: item.name,
      price: item.rawPrice.toString(),
      category: item.categoryCode,
      desc: item.sub,
      image: item.image,
      tags: item.tags.join(', '),
      status: item.isActive ? 'active' : 'inactive'
    });
    setShowAddForm(true);
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      alert('Nhập đủ tên và giá nha bestie! ✨');
      return;
    }
    try {
      const code = newItem.name.toLowerCase().replace(/ /g, '-');
      
      let res;
      if (editItemId) {
        const payload = {
          categoryCode: newItem.category,
          name: { 'vi-VN': newItem.name },
          desc: { 'vi-VN': newItem.desc },
          price: Number(newItem.price), // backend is storing raw VND
          image: newItem.image || 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&q=80',
          tags: newItem.tags.split(',').map(t => t.trim()).filter(t => t),
          isActive: newItem.status === 'active'
        };
        
        res = await fetch(`${API_URL}/merchant/menu/items/${editItemId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const payload = {
          storeId: 'store-genz-01',
          categoryCode: newItem.category,
          code: code,
          name: { 'vi-VN': newItem.name },
          description: { 'vi-VN': newItem.desc },
          price: Number(newItem.price), // VND
          imageUrl: newItem.image || 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&q=80',
          tags: newItem.tags.split(',').map(t => t.trim()).filter(t => t),
          isActive: newItem.status === 'active'
        };
        
        res = await fetch(`${API_URL}/merchant/menu/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        setShowAddForm(false);
        setEditItemId(null);
        setNewItem({ name: '', price: '', category: 'tea', desc: '', image: '', tags: '', status: 'active' });
        fetchItems(); // Reload
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      alert('Lưu món thất bại');
    }
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditItemId(null);
    setNewItem({ name: '', price: '', category: 'tea', desc: '', image: '', tags: '', status: 'active' });
  };

  if (loading) return <div style={{ padding: '40px' }}>Đang tải menu...</div>;

  const formLabelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: 'var(--ink)' };
  const formInputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px', fontSize: '14px' };

    const categoryNames: Record<string, string> = {
    'all': 'Tất cả món',
    'tea': 'Trà sữa',
    'coffee': 'Cà phê',
    'snack': 'Ăn vặt',
    'topping': 'Topping'
  };

  const categories = ['all', ...Array.from(new Set(items.map(i => i.categoryCode)))];
  const displayedItems = selectedCategory === 'all' ? items : items.filter(i => i.categoryCode === selectedCategory);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Menu của bạn</h1>
          <p>{items.length} món • cập nhật 2 phút trước</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} style={{ color: 'var(--ink)' }}>
            + Danh mục
          </button>
          <button className={styles.btnPrimary} onClick={() => setShowAddForm(true)}>
            + Thêm món
          </button>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--peach)' }}>
          <div className={styles.statLabel}>Lượt quét hôm nay</div>
          <div className={styles.statValue}>{metrics.scansToday}</div>
          <div className={styles.statTrend} style={{ color: '#D35400' }}>
            {metrics.scansTrend >= 0 ? '↑' : '↓'} {Math.abs(metrics.scansTrend)}%
          </div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--mint)' }}>
          <div className={styles.statLabel}>Đơn đã chốt</div>
          <div className={styles.statValue}>{metrics.completedOrdersToday}</div>
          <div className={styles.statTrend} style={{ color: '#27AE60' }}>
            {metrics.ordersTrend >= 0 ? '↑' : '↓'} {Math.abs(metrics.ordersTrend)}%
          </div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--lavn)' }}>
          <div className={styles.statLabel}>Doanh thu</div>
          <div className={styles.statValue}>{(metrics.revenueToday / 1000000).toFixed(1)}M</div>
          <div className={styles.statTrend} style={{ color: '#8E44AD' }}>
            {metrics.revenueTrend >= 0 ? '↑' : '↓'} {Math.abs(metrics.revenueTrend)}%
          </div>
        </div>
        <div className={styles.statCard} style={{ backgroundColor: 'var(--hot)' }}>
          <div className={styles.statLabel} style={{ color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Story tag IG</span>
            <button 
              onClick={handleManualStoryTag}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
              title="Ghi nhận thủ công"
            >
              +
            </button>
          </div>
          <div className={styles.statValue} style={{ color: '#fff' }}>{metrics.storyTagsToday}</div>
          <div className={styles.statTrend} style={{ color: '#fff' }}>
            {metrics.storyTagsTrend > 0 ? `↑ ${metrics.storyTagsTrend}%` : '📸 viral nhẹ'}
          </div>
        </div>
      </section>

      <div className={styles.insightBanner}>
        <div className={styles.botIcon}>
            <Icon name="sparkles" size={24} color="var(--ink)" />
        </div>
        <div className={styles.insightText}>
          <h3>Boba Bot Insight</h3>
          <p>&quot;Bestie ơi, 32 khách hỏi &apos;matcha có không?&apos; tuần này — mình suggest add món matcha cloud nha!&quot;</p>
        </div>
        <button className={styles.btnCreate} onClick={() => {
          setEditItemId(null);
          setNewItem({ ...newItem, name: 'Matcha Cloud', price: '45000', desc: 'Vibe Nhật Bản, cực cháy' });
          setShowAddForm(true);
        }}>
          Tạo món <Icon name="sparkles" size={14} />
        </button>
      </div>

      <section className={styles.tableSection}>
        <div className={styles.tableHeader} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Danh mục: {categoryNames[selectedCategory] || selectedCategory} ({displayedItems.length} món)</h2>
            <div className={styles.searchBar}>
              <Icon name="search" size={16} color="rgba(26,26,26,0.3)" />
              <input type="text" placeholder="Tìm món..." />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: '100%', paddingBottom: '8px' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedCategory === cat ? '2px solid var(--ink)' : '1px solid #ddd',
                  backgroundColor: selectedCategory === cat ? 'var(--peach)' : '#fff',
                  fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {categoryNames[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        {showAddForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>{editItemId ? 'Cập nhật món' : 'Thêm món mới'}</h3>
                <button className={styles.btnClose} onClick={closeForm}>
                  <Icon name="plus" size={24} color="var(--ink)" />
                </button>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên món</label>
                <input type="text" className={styles.formInput} placeholder="VD: Trà sữa nướng dừa..." value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Giá (VND)</label>
                  <input type="number" required className={styles.formInput} placeholder="VD: 45000" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                </div>
                
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Danh mục</label>
                  <select className={styles.formSelect} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                    <option value="tea">Trà sữa</option>
                    <option value="coffee">Cà phê</option>
                    <option value="food">Đồ ăn nhẹ</option>
                    <option value="topping">Topping</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mô tả</label>
                <textarea rows={3} className={styles.formTextarea} placeholder="Mô tả vibe của món này..." value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})} />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ảnh URL</label>
                <input type="text" className={styles.formInput} placeholder="https://..." value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', gap: '20px' }}>
                <div className={styles.formGroup} style={{ flex: 2 }}>
                  <label className={styles.formLabel}>Tags</label>
                  <input type="text" className={styles.formInput} placeholder="NEW, HOT, BEST SELLER..." value={newItem.tags} onChange={e => setNewItem({...newItem, tags: e.target.value})} />
                </div>
                
                <div className={styles.formGroup} style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Trạng thái</label>
                  <select className={styles.formSelect} value={newItem.status} onChange={e => setNewItem({...newItem, status: e.target.value})}>
                    <option value="active">Đang bán</option>
                    <option value="inactive">Ngừng bán</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button className={styles.btnCancel} onClick={closeForm}>Hủy</button>
                <button className={styles.btnSubmit} onClick={handleAddItem}>{editItemId ? 'Cập nhật' : 'Tạo món'}</button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.menuTable}>
          {displayedItems.map((item) => (
            <div key={item.id} className={styles.menuItem}>
              <img src={item.image} alt={item.name} className={styles.itemImage} />
              <div className={styles.itemInfo}>
                <div className={styles.itemNameRow}>
                  <span className={styles.itemName} style={{ textDecoration: item.isActive ? 'none' : 'line-through', opacity: item.isActive ? 1 : 0.5 }}>{item.name}</span>
                  {item.badge && (
                    <span className={styles.itemBadge} style={{ backgroundColor: item.isActive ? item.badgeColor : '#ccc', color: item.badge === 'HOT' || item.badge === 'SALE' ? '#fff' : 'var(--ink)' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className={styles.itemSub} style={{ opacity: item.isActive ? 1 : 0.5 }}>{item.sub}</div>
              </div>
              <div className={styles.itemPrice} style={{ opacity: item.isActive ? 1 : 0.5, color: 'var(--hot)', fontWeight: 800, fontSize: '18px' }}>{item.price}</div>
              <div className={styles.itemSales} style={{ marginRight: '20px', opacity: item.isActive ? 1 : 0.5, textAlign: 'center' }}>
                <div className={styles.salesLabel} style={{ fontSize: '12px', color: 'rgba(26,26,26,0.5)', fontWeight: 800 }}>Bán</div>
                <div className={styles.salesValue} style={{ fontSize: '16px', fontWeight: 800 }}>{item.sales}</div>
              </div>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div className={styles.toggle} onClick={() => toggleItem(item.id, item.isActive)} style={{ backgroundColor: item.isActive ? 'var(--mint)' : '#ddd' }} title="Bật/Tắt hiển thị">
                  <div className={styles.toggleCircle} style={{ left: item.isActive ? 'calc(100% - 20px)' : '2px', transition: 'left 0.2s' }}></div>
                </div>
                <button onClick={() => handleEditItemClick(item)} style={{ backgroundColor: '#fff', border: '2px solid var(--ink)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', cursor: 'pointer' }} title="Sửa món">
                  Sửa
                </button>
                <button onClick={() => deleteItem(item.id)} style={{ backgroundColor: '#fff', border: '2px solid var(--ink)', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer' }} title="Xoá món">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
