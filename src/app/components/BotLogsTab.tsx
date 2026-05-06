import React from 'react';
import styles from '../page.module.css';

export const BotLogsTab = () => {
  return (
    <section className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2>Boba Bot Logs 🤖</h2>
      </div>
      <div style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: '20px', borderRadius: '15px', fontFamily: 'monospace', fontSize: '14px', height: '300px', overflowY: 'auto' }}>
        <p>[14:30:01] Bot: Đã phân tích 45 đoạn chat hôm nay.</p>
        <p>[14:30:05] Bot: Cảnh báo: 5 khách hàng phàn nàn về thời gian giao hàng.</p>
        <p>[14:31:12] Bot: Đã auto-reply 12 bình luận trên Instagram.</p>
        <p>[14:35:00] Bot: Gợi ý tạo mã giảm giá do lượng đơn giảm 10% so với tuần trước.</p>
        <p style={{ color: 'var(--mint)' }}>[14:40:00] Bot: Hệ thống hoạt động bình thường.</p>
      </div>
    </section>
  );
};
