import React from 'react';
import styles from '../page.module.css';
import { Icon } from './Icon';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingOrdersCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, pendingOrdersCount = 0, isOpen = false, onClose }) => {
  return (
    <>
      {isOpen && <div className={styles.modalOverlay} style={{ zIndex: 9 }} onClick={onClose} />}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>B</div>
          <div className={styles.brandInfo}>
            <h2>Boba Babe</h2>
            <p>Q1 • 3 chi nhánh</p>
          </div>
          {isOpen && (
            <button onClick={onClose} className={styles.btnClose} style={{ marginLeft: 'auto', width: 36, height: 36 }}>×</button>
          )}
        </div>

        <nav className={styles.nav}>
          <div className={styles.navLabel}>QUẢN LÝ</div>
          <a href="#" className={`${styles.navItem} ${activeTab === 'overview' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('overview'); onClose?.(); }}>
            <Icon name="overview" color={activeTab === 'overview' ? '#fff' : 'currentColor'} /> Tổng quan
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'menu' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('menu'); onClose?.(); }}>
            <Icon name="menu" color={activeTab === 'menu' ? '#fff' : 'currentColor'} /> Menu
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('orders'); onClose?.(); }}>
            <Icon name="orders" color={activeTab === 'orders' ? '#fff' : 'currentColor'} /> Đơn {pendingOrdersCount > 0 && <span className={styles.badge}>{pendingOrdersCount}</span>}
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'tables' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('tables'); onClose?.(); }}>
            <Icon name="tables" color={activeTab === 'tables' ? '#fff' : 'currentColor'} /> Bàn / QR
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'kitchen' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('kitchen'); onClose?.(); }}>
            <Icon name="kitchen" color={activeTab === 'kitchen' ? '#fff' : 'currentColor'} /> Bếp / Bar
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'promo' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('promo'); onClose?.(); }}>
            <Icon name="promo" color={activeTab === 'promo' ? '#fff' : 'currentColor'} /> Khuyến mãi
          </a>

          <div className={styles.navLabel}>AI CỦA TÔI</div>
          <a href="#" className={`${styles.navItem} ${activeTab === 'botlogs' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('botlogs'); onClose?.(); }}>
            Bot logs
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'trend' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('trend'); onClose?.(); }}>
            Trend forecast
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'reviews' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('reviews'); onClose?.(); }}>
            Reviews
          </a>
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px', backgroundColor: 'var(--paper)', borderRadius: '20px', border: '2px solid var(--ink)', boxShadow: '4px 4px 0 var(--ink)' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(26,26,26,0.5)', marginBottom: '4px' }}>Cửa hàng đang vận hành</p>
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 800, color: 'var(--hot)', marginBottom: '4px' }}>Chủ chuỗi Boba Babe</h4>
          <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>store-genz-01</p>
        </div>
      </aside>
    </>
  );
};
