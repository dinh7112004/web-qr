"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { API_URL } from './constants';
import { Sidebar } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { MenuTab } from './components/MenuTab';
import { OrdersTab } from './components/OrdersTab';
import { TablesTab } from './components/TablesTab';
import { KitchenTab } from './components/KitchenTab';
import { PromoTab } from './components/PromoTab';
import { BotLogsTab } from './components/BotLogsTab';
import { TrendForecastTab } from './components/TrendForecastTab';
import { ReviewsTab } from './components/ReviewsTab';
import { Icon } from './components/Icon';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState<any[]>([]);
  const prevPendingIds = useRef<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showPromoModal, setShowPromoModal] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/merchant/orders?storeId=store-genz-01`);
      const data = await res.json();
      if (data.items) {
        setOrders(data.items);
      }
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    const currentPendingIds = new Set(orders.filter(o => o.status === 'pending').map(o => o._id));

    // Check if there is any new pending order
    let hasNewOrder = false;
    currentPendingIds.forEach(id => {
      if (!prevPendingIds.current.has(id)) {
        hasNewOrder = true;
      }
    });

    // Don't play sound on initial load (when prev is empty and we just loaded)
    if (hasNewOrder && prevPendingIds.current.size > 0) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Auto-play prevented by browser:', e));

      audio.onended = () => {
        if ('speechSynthesis' in window) {
          const msg = new SpeechSynthesisUtterance('Bạn có một đơn hàng mới');
          msg.lang = 'vi-VN';
          msg.rate = 1.3; // Tăng tốc độ đọc lên nhanh hơn
          msg.pitch = 1.1; // Làm giọng tươi tắn hơn một chút

          // Ưu tiên chọn giọng đọc nữ tiếng Việt xịn (nếu trình duyệt có cài sẵn)
          const voices = window.speechSynthesis.getVoices();
          const viVoice = voices.find(v => v.lang.includes('vi') && (v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Linh')));
          if (viVoice) {
            msg.voice = viVoice;
          }

          window.speechSynthesis.speak(msg);
        }
      };
    }

    // Only update ref if we actually have orders (avoids treating initial load as new orders later)
    if (orders.length > 0) {
      prevPendingIds.current = currentPendingIds;
    }
  }, [orders]);

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'menu': return { title: 'Menu của bạn', sub: 'Cập nhật từ hệ thống • Đồng bộ real-time' };
      case 'orders': return { title: 'Quản lý đơn hàng', sub: 'Theo dõi đơn hàng real-time' };
      case 'tables': return { title: 'Sơ đồ bàn & QR', sub: 'Quản lý trạng thái phục vụ' };
      case 'kitchen': return { title: 'Trạm Bếp / Bar', sub: 'Điều phối món ăn thức uống' };
      case 'promo': return { title: 'Khuyến mãi & Voucher', sub: 'Kích cầu doanh số hiệu quả' };
      case 'botlogs': return { title: 'Lịch sử hoạt động Bot', sub: 'Theo dõi tự động hoá' };
      case 'trend': return { title: 'Dự báo xu hướng', sub: 'Gợi ý từ AI' };
      case 'reviews': return { title: 'Đánh giá khách hàng', sub: 'Lắng nghe khách hàng' };
      default: return { title: 'Tổng quan hệ thống', sub: 'Hiệu suất kinh doanh hôm nay' };
    }
  };

  const headerInfo = getHeaderInfo();

  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'checking_out').length;

  return (
    <div className={styles.container}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} pendingOrdersCount={pendingOrdersCount} />

      <main className={styles.main}>
        {activeTab !== 'menu' && (
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              <h1>{headerInfo.title}</h1>
              <p>{headerInfo.sub}</p>
            </div>
            <div className={styles.headerActions}>
              {activeTab === 'promo' && (
                <button className={styles.btnPrimary} onClick={() => setShowPromoModal(true)}>
                  <Icon name="plus" size={16} /> Tạo mã KM
                </button>
              )}
            </div>
          </header>
        )}

        {activeTab === 'overview' && <OverviewTab orders={orders} onRefresh={() => fetchOrders()} autoRefresh={autoRefresh} onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)} />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'orders' && <OrdersTab orders={orders} />}
        {activeTab === 'tables' && <TablesTab orders={orders} />}
        {activeTab === 'kitchen' && <KitchenTab orders={orders} onRefresh={() => fetchOrders()} />}
        {activeTab === 'promo' && <PromoTab showModalOverride={showPromoModal} onHide={() => setShowPromoModal(false)} />}
        {activeTab === 'botlogs' && <BotLogsTab />}
        {activeTab === 'trend' && <TrendForecastTab />}
        {activeTab === 'reviews' && <ReviewsTab />}
      </main>
    </div>
  );
}
