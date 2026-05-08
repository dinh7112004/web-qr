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
  toppings: string[];
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
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'item' | 'topping'>('item');
  const [mainFilter, setMainFilter] = useState<'all' | 'menu' | 'topping'>('all');
  const [newItem, setNewItem] = useState({ 
    name: '', 
    price: '', 
    category: 'tea', 
    desc: '', 
    image: '', 
    tags: '', 
    toppings: '',
    status: 'active' 
  });
  const [newCategory, setNewCategory] = useState({ name: '', code: '' });
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/merchant/menu/categories?storeId=store-genz-01`);
      const data = await res.json();
      if (data.items) setDbCategories(data.items);
    } catch (e) {
      console.error("Failed to fetch categories:", e);
    }
  };

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
          sales: item.soldCount || 0,
          badge: item.tags && item.tags.length > 0 ? item.tags[0].toUpperCase() : '',
          badgeColor: item.color || 'var(--hot)',
          image: item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&q=80',
          isActive: item.isActive,
          rawPrice: item.price,
          tags: item.tags || [],
          categoryCode: item.categoryCode || 'tea',
          toppings: item.availableToppings || []
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
    fetchCategories();
    const interval = setInterval(() => {
      fetchItems();
      fetchCategories();
    }, 10000);
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
    setFormMode(item.categoryCode === 'topping' ? 'topping' : 'item');
    let assignedItemIds: string[] = [];
    if (item.categoryCode === 'topping') {
      // Nếu là topping, tìm xem những món nào đang gán topping này
      assignedItemIds = items
        .filter(it => it.categoryCode !== 'topping' && it.toppings.includes(item.id))
        .map(it => it.id);
    }

    setNewItem({
      name: item.name,
      price: item.rawPrice.toString(),
      category: item.categoryCode,
      desc: item.sub,
      image: item.image,
      tags: item.tags.join(', '),
      toppings: item.categoryCode === 'topping' ? assignedItemIds.join(', ') : (item.toppings ? item.toppings.join(', ') : ''),
      status: item.isActive ? 'active' : 'inactive'
    });
    setShowAddForm(true);
  };

  const updateItemToppings = async (itemIds: string[], toppingId: string) => {
    // 1. Lấy danh sách tất cả món (không phải topping)
    const allItems = items.filter(it => it.categoryCode !== 'topping');
    
    for (const it of allItems) {
      const shouldHaveTopping = itemIds.includes(it.id);
      const hasTopping = it.toppings.includes(toppingId);
      
      let updatedToppings = [...it.toppings];
      
      if (shouldHaveTopping && !hasTopping) {
        // Thêm topping nếu được chọn mà chưa có
        updatedToppings.push(toppingId);
      } else if (!shouldHaveTopping && hasTopping) {
        // Xoá topping nếu không được chọn mà đang có
        updatedToppings = updatedToppings.filter(id => id !== toppingId);
      } else {
        // Không đổi thì bỏ qua
        continue;
      }

      try {
        await fetch(`${API_URL}/merchant/menu/items/${it.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availableToppings: updatedToppings })
        });
      } catch (e) {
        console.error(`Failed to update topping for ${it.name}`, e);
      }
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) return;
    try {
      const payload = {
        storeId: 'store-genz-01',
        name: { 'vi-VN': newCategory.name },
        code: newCategory.code || newCategory.name.toLowerCase().replace(/ /g, '-')
      };

      let res;
      if (editCategoryId) {
        res = await fetch(`${API_URL}/merchant/menu/categories/${editCategoryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_URL}/merchant/menu/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowCategoryForm(false);
        setEditCategoryId(null);
        setNewCategory({ name: '', code: '' });
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (name === 'topping') {
      alert('Không thể xoá danh mục Topping mặc định nha bestie! ✋');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xoá danh mục "${name}" không? Các món trong danh mục này sẽ bị mất phân loại đó! 🥺`)) return;
    
    try {
      const res = await fetch(`${API_URL}/merchant/menu/categories/${id}/delete`, {
        method: 'POST'
      });
      if (res.ok) {
        if (selectedCategory === dbCategories.find(c => c._id === id)?.code) {
          setSelectedCategory('all');
        }
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditCategory = (cat: any) => {
    setEditCategoryId(cat._id);
    setNewCategory({
      name: cat.name['vi-VN'],
      code: cat.code
    });
    setShowCategoryForm(true);
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
          price: Number(newItem.price),
          image: newItem.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&q=80',
          tags: newItem.tags.split(',').map(t => t.trim()).filter(t => t),
          availableToppings: newItem.toppings.split(',').map(t => t.trim()).filter(t => t),
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
          price: Number(newItem.price),
          imageUrl: newItem.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=200&q=80',
          tags: newItem.tags.split(',').map(t => t.trim()).filter(t => t),
          availableToppings: newItem.toppings.split(',').map(t => t.trim()).filter(t => t),
          isActive: newItem.status === 'active'
        };
        
        res = await fetch(`${API_URL}/merchant/menu/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      if (res.ok) {
        const responseData = await res.json();
        const itemData = responseData.item;
        
        if (formMode === 'topping' && newItem.toppings) {
          const toppingId = itemData._id || itemData.id;
          const selectedItemIds = newItem.toppings.split(',').map(s => s.trim()).filter(s => s);
          if (toppingId) await updateItemToppings(selectedItemIds, toppingId);
        }
        setShowAddForm(false);
        setEditItemId(null);
        setNewItem({ name: '', price: '', category: 'tea', desc: '', image: '', tags: '', toppings: '', status: 'active' });
        fetchItems(); // Reload
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      alert('Lưu món thất bại');
    }
  };

  const handleToppingToggle = (toppingId: string, checked: boolean) => {
    const currentToppings = newItem.toppings.split(',').map(t => t.trim()).filter(t => t);
    let updatedToppings;
    if (checked) {
      updatedToppings = [...currentToppings, toppingId];
    } else {
      updatedToppings = currentToppings.filter(t => t !== toppingId);
    }
    setNewItem({ ...newItem, toppings: updatedToppings.join(', ') });
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditItemId(null);
    setNewItem({ name: '', price: '', category: 'tea', desc: '', image: '', tags: '', toppings: '', status: 'active' });
  };

  // if (loading) return <div style={{ padding: '40px' }}>Đang tải menu...</div>;

  const formLabelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px', color: 'var(--ink)' };
  const formInputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '16px', fontSize: '14px' };

  const categoryNames: Record<string, string> = {
    'all': 'Tất cả'
  };
  dbCategories.forEach(cat => {
    categoryNames[cat.code] = cat.name['vi-VN'];
  });

  const filteredCategoriesByMain = dbCategories.filter(cat => {
    if (mainFilter === 'menu') return cat.code !== 'topping';
    if (mainFilter === 'topping') return cat.code === 'topping';
    return true;
  });

  const categories = ['all', ...filteredCategoriesByMain.map(c => c.code).filter(code => code !== 'topping')];
  
  const displayedItems = items.filter(i => {
    const matchCategory = selectedCategory === 'all' ? true : i.categoryCode === selectedCategory;
    const matchMain = mainFilter === 'all' ? true : (mainFilter === 'topping' ? i.categoryCode === 'topping' : i.categoryCode !== 'topping');
    return matchCategory && matchMain;
  });

  const availableToppingsFromDB = items.filter(i => i.categoryCode === 'topping');

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Menu của bạn</h1>
          <p>{items.length} món • cập nhật 2 phút trước</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={() => setShowCategoryForm(true)} style={{ color: 'var(--ink)' }}>
            + Danh mục
          </button>
          <button className={styles.btnSecondary} onClick={() => {
            setFormMode('topping');
            setEditItemId(null);
            setNewItem({ ...newItem, category: 'topping', name: '', price: '', toppings: '', tags: '' });
            setShowAddForm(true);
          }} style={{ color: 'var(--ink)' }}>
            + Thêm Topping
          </button>
          <button className={styles.btnPrimary} onClick={() => {
            setFormMode('item');
            setEditItemId(null);
            setNewItem({ ...newItem, category: 'tea', name: '', price: '', toppings: '', tags: '' });
            setShowAddForm(true);
          }}>
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
          setNewItem({ ...newItem, name: 'Matcha Cloud', price: '45000', desc: 'Vibe Nhật Bản, cực cháy', toppings: 'Trân châu trắng, Kem cheese' });
          setShowAddForm(true);
        }}>
          Tạo món <Icon name="sparkles" size={14} />
        </button>
      </div>

      <section className={styles.tableSection}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: '2px solid #eee', paddingBottom: '12px' }}>
          <button 
            onClick={() => { setMainFilter('all'); setSelectedCategory('all'); }}
            style={{ padding: '8px 20px', borderRadius: '12px', border: 'none', backgroundColor: mainFilter === 'all' ? 'var(--ink)' : 'transparent', color: mainFilter === 'all' ? '#fff' : 'var(--ink)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Tất cả
          </button>
          <button 
            onClick={() => { setMainFilter('menu'); setSelectedCategory('all'); }}
            style={{ padding: '8px 20px', borderRadius: '12px', border: 'none', backgroundColor: mainFilter === 'menu' ? 'var(--hot)' : 'transparent', color: mainFilter === 'menu' ? '#fff' : 'var(--ink)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Món chính 🍔
          </button>
          <button 
            onClick={() => { setMainFilter('topping'); setSelectedCategory('all'); }}
            style={{ padding: '8px 20px', borderRadius: '12px', border: 'none', backgroundColor: mainFilter === 'topping' ? 'var(--mint)' : 'transparent', color: mainFilter === 'topping' ? 'var(--ink)' : 'var(--ink)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Topping ✨
          </button>
        </div>

        <div className={styles.flexResponsive} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '20px' }}>Danh mục: {categoryNames[selectedCategory] || selectedCategory}</h2>
            <p style={{ margin: '4px 0 0 0', opacity: 0.5, fontSize: '13px', fontWeight: 'bold' }}>{displayedItems.length} món đang hiển thị</p>
          </div>
          <div className={styles.searchBar} style={{ maxWidth: '300px' }}>
            <Icon name="search" size={16} color="rgba(26,26,26,0.3)" />
            <input type="text" placeholder="Tìm tên món..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '8px' }} />
          </div>
        </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', width: '100%', paddingBottom: '12px' }}>
            <button 
              onClick={() => setSelectedCategory('all')}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedCategory === 'all' ? '2px solid var(--ink)' : '1px solid #ddd',
                backgroundColor: selectedCategory === 'all' ? 'var(--peach)' : '#fff',
                fontWeight: selectedCategory === 'all' ? 'bold' : 'normal',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Tất cả
            </button>
            {filteredCategoriesByMain.filter(cat => !cat.code.toLowerCase().includes('topping')).map(cat => (
              <div key={cat._id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button 
                  onClick={() => setSelectedCategory(cat.code)}
                  style={{
                    padding: '8px 16px',
                    paddingRight: selectedCategory === cat.code ? '45px' : '16px',
                    borderRadius: '20px',
                    border: selectedCategory === cat.code ? '2px solid var(--ink)' : '1px solid #ddd',
                    backgroundColor: selectedCategory === cat.code ? 'var(--peach)' : '#fff',
                    fontWeight: selectedCategory === cat.code ? 'bold' : 'normal',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat.name['vi-VN']}
                </button>
                {selectedCategory === cat.code && (
                  <div style={{ position: 'absolute', right: '8px', display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title="Sửa"
                    >
                      <Icon name="edit" size={14} color="var(--ink)" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat._id, cat.name['vi-VN']); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title="Xoá"
                    >
                      <Icon name="trash" size={14} color="var(--hot)" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

        {showCategoryForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '900px', width: '90%' }}>
              <div className={styles.modalHeader}>
                <h2 style={{ fontSize: '32px' }}>{editCategoryId ? 'Sửa danh mục' : 'Quản lý danh mục'}</h2>
                <button className={styles.btnClose} onClick={() => { setShowCategoryForm(false); setEditCategoryId(null); setNewCategory({name: '', code: ''}); }}>
                  <Icon name="plus" size={32} color="var(--ink)" />
                </button>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '40px', 
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginTop: '20px'
              }}>
                {/* Form Bên Trái */}
                <div style={{ flex: '1 1 350px' }}>
                  <h3 style={{ marginBottom: '20px', color: 'var(--hot)' }}>{editCategoryId ? 'Cập nhật thông tin' : 'Thêm mới ✨'}</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '16px' }}>Tên danh mục</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      style={{ fontSize: '18px', padding: '15px' }}
                      placeholder="VD: Trà trái cây..." 
                      value={newCategory.name} 
                      onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ fontSize: '16px' }}>Mã code (không bắt buộc)</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="VD: fruit-tea" 
                      value={newCategory.code} 
                      onChange={e => setNewCategory({...newCategory, code: e.target.value})} 
                      disabled={newCategory.code === 'topping'}
                      style={newCategory.code === 'topping' 
                        ? { backgroundColor: '#f0f0f0', cursor: 'not-allowed', fontSize: '18px', padding: '15px' } 
                        : { fontSize: '18px', padding: '15px' }
                      }
                    />
                    {newCategory.code === 'topping' && <p style={{ fontSize: '12px', color: 'var(--hot)', marginTop: '-12px', marginBottom: '12px' }}>* Đây là danh mục hệ thống, không được đổi mã code nè!</p>}
                  </div>
                  <div className={styles.modalActions} style={{ marginTop: '30px' }}>
                    <button className={styles.btnCancel} style={{ flex: 1, padding: '15px' }} onClick={() => { setShowCategoryForm(false); setEditCategoryId(null); setNewCategory({name: '', code: ''}); }}>Hủy</button>
                    <button className={styles.btnSubmit} style={{ flex: 2, padding: '15px', fontSize: '18px' }} onClick={handleAddCategory}>{editCategoryId ? 'Cập nhật' : 'Tạo danh mục'}</button>
                  </div>
                </div>

                {/* Danh Sách Bên Phải */}
                <div style={{ flex: '1 1 400px', backgroundColor: '#f9f9f9', padding: '25px', borderRadius: '24px', border: '3px solid var(--ink)', boxShadow: '6px 6px 0 var(--ink)' }}>
                  <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Danh mục hiện có <span style={{ fontSize: '14px', backgroundColor: 'var(--ink)', color: '#fff', padding: '2px 10px', borderRadius: '10px' }}>{dbCategories.length}</span>
                  </h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '10px' }}>
                    {dbCategories.filter(cat => cat.code !== 'topping').map(cat => (
                      <div key={cat._id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '15px 20px', 
                        backgroundColor: editCategoryId === cat._id ? 'var(--mint)' : '#fff',
                        borderRadius: '16px',
                        border: '2.5px solid var(--ink)',
                        boxShadow: editCategoryId === cat._id ? 'none' : '4px 4px 0 var(--ink)',
                        transform: editCategoryId === cat._id ? 'translate(2px, 2px)' : 'none'
                      }}>
                        <div>
                          <div style={{ fontWeight: '900', fontSize: '18px' }}>{cat.name['vi-VN']}</div>
                          <div style={{ fontSize: '12px', opacity: 0.5, fontWeight: 'bold' }}>CODE: {cat.code}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button 
                            onClick={() => openEditCategory(cat)}
                            style={{ background: 'var(--lavn)', border: '2px solid var(--ink)', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex' }}
                            title="Sửa"
                          >
                            <Icon name="edit" size={20} color="var(--ink)" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat._id, cat.name['vi-VN'])}
                            style={{ background: 'var(--hot)', border: '2px solid var(--ink)', cursor: 'pointer', padding: '8px', borderRadius: '10px', display: 'flex' }}
                            title="Xoá"
                          >
                            <Icon name="trash" size={20} color="#fff" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3>{editItemId ? 'Cập nhật' : (formMode === 'topping' ? 'Thêm Topping mới' : 'Thêm món mới')}</h3>
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
                  {formMode === 'topping' ? (
                    <div className={styles.formInput} style={{ backgroundColor: '#eee', fontWeight: 'bold' }}>Topping (Mặc định)</div>
                  ) : (
                    <select className={styles.formSelect} value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                      {dbCategories.map(cat => (
                        <option key={cat.code} value={cat.code}>{cat.name['vi-VN']}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              {formMode === 'item' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mô tả</label>
                  <textarea rows={3} className={styles.formTextarea} placeholder="Mô tả vibe của món này..." value={newItem.desc} onChange={e => setNewItem({...newItem, desc: e.target.value})} />
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ảnh URL</label>
                <input type="text" className={styles.formInput} placeholder="https://..." value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
              </div>

              {formMode === 'item' ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Toppings đi kèm (Chọn từ danh sách)</label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                    gap: '10px', 
                    maxHeight: '150px', 
                    overflowY: 'auto',
                    padding: '12px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '12px',
                    border: '1px solid #eee'
                  }}>
                    {availableToppingsFromDB.length > 0 ? (
                      availableToppingsFromDB.map(t => (
                        <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                          <input 
                            type="checkbox" 
                            checked={newItem.toppings.split(',').map(x => x.trim()).includes(t.id)}
                            onChange={(e) => handleToppingToggle(t.id, e.target.checked)}
                            style={{ accentColor: 'var(--hot)', width: '18px', height: '18px' }}
                          />
                          {t.name}
                        </label>
                      ))
                    ) : (
                      <p style={{ fontSize: '12px', opacity: 0.5, gridColumn: '1/-1' }}>Chưa có topping nào. Hãy tạo topping trước nhé!</p>
                    )}
                  </div>
                  <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.6 }}>* Tích chọn để gán topping cho món này</p>
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Gán Topping này cho các món:</label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', 
                    gap: '10px', 
                    maxHeight: '180px', 
                    overflowY: 'auto',
                    padding: '12px',
                    backgroundColor: 'var(--peach)',
                    borderRadius: '12px',
                    border: '1px solid var(--ink)',
                    boxShadow: '2px 2px 0 var(--ink)'
                  }}>
                    {items.filter(i => i.categoryCode !== 'topping').map(it => (
                      <label key={it.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                        <input 
                          type="checkbox" 
                          checked={newItem.toppings.split(',').map(x => x.trim()).includes(it.id)}
                          onChange={(e) => handleToppingToggle(it.id, e.target.checked)}
                          style={{ accentColor: 'var(--hot)', width: '18px', height: '18px' }}
                        />
                        {it.name}
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', marginTop: '6px', opacity: 0.8, color: 'var(--ink)', fontWeight: 'bold' }}>* Tích chọn để tự động gán Topping mới vào các món này</p>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '20px' }}>
                {formMode === 'item' && (
                  <div className={styles.formGroup} style={{ flex: 2 }}>
                    <label className={styles.formLabel}>Tags</label>
                    <input type="text" className={styles.formInput} placeholder="NEW, HOT, BEST SELLER..." value={newItem.tags} onChange={e => setNewItem({...newItem, tags: e.target.value})} />
                  </div>
                )}
                
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
                    <span className={styles.itemBadge} style={{ backgroundColor: item.isActive ? item.badgeColor : '#ccc', color: (item.badge === 'HOT' || item.badge === 'SALE' || item.badge === 'BEST') ? '#fff' : 'var(--ink)' }}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className={styles.itemSub} style={{ opacity: item.isActive ? 0.7 : 0.4 }}>{item.sub}</div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
                  <div className={styles.itemPrice} style={{ opacity: item.isActive ? 1 : 0.5 }}>{item.price}</div>
                  <div className={styles.itemSales} style={{ opacity: item.isActive ? 1 : 0.5 }}>
                    <span className={styles.salesLabel}>Đã bán</span>
                    <span className={styles.salesValue}>{item.sales}</span>
                  </div>
                </div>

                {item.categoryCode !== 'topping' && item.toppings.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                    {item.toppings.map(tid => {
                      const t = items.find(it => it.id === tid);
                      return t ? (
                        <span key={tid} style={{ fontSize: '10px', backgroundColor: 'var(--lavn)', color: 'var(--ink)', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                          + {t.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {item.categoryCode === 'topping' && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 'bold', opacity: 0.6, marginBottom: '4px' }}>Gán cho:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {items.filter(it => it.categoryCode !== 'topping' && it.toppings.includes(item.id)).map(it => (
                        <span key={it.id} style={{ fontSize: '10px', border: '1px solid var(--ink)', padding: '1px 6px', borderRadius: '4px' }}>
                          {it.name}
                        </span>
                      ))}
                      {items.filter(it => it.categoryCode !== 'topping' && it.toppings.includes(item.id)).length === 0 && (
                        <span style={{ fontSize: '10px', opacity: 0.5, fontStyle: 'italic' }}>Chưa gán món nào</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.itemActions} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div className={styles.toggle} onClick={() => toggleItem(item.id, item.isActive)} style={{ backgroundColor: item.isActive ? 'var(--mint)' : '#ddd', width: '44px', height: '24px' }} title="Bật/Tắt">
                  <div className={styles.toggleCircle} style={{ width: '18px', height: '18px', left: item.isActive ? 'calc(100% - 20px)' : '2px', transition: 'left 0.2s' }}></div>
                </div>
                <button onClick={() => handleEditItemClick(item)} style={{ backgroundColor: '#fff', border: '2px solid var(--ink)', borderRadius: '10px', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '2px 2px 0 var(--ink)' }}>
                  Sửa
                </button>
                <button onClick={() => deleteItem(item.id)} style={{ backgroundColor: '#fff', border: '2px solid var(--ink)', borderRadius: '10px', padding: '6px 10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '2px 2px 0 var(--ink)' }}>
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};
