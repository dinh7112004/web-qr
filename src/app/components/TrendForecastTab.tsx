import React from 'react';
import styles from '../page.module.css';

export const TrendForecastTab = () => {
  return (
    <section className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2>Dự báo xu hướng 📈</h2>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
        <div style={{ padding: '20px', backgroundColor: 'var(--lavn)', borderRadius: '15px', border: '2px solid var(--ink)' }}>
          <h3>🔥 Xu hướng Món Hot tuần tới</h3>
          <p style={{ marginTop: '10px' }}>Dựa trên dữ liệu từ MXH và khách hàng mua, dự báo món <strong>Trà sữa Oolong nướng</strong> sẽ tăng doanh số 30%.</p>
        </div>
        <div style={{ padding: '20px', backgroundColor: 'var(--peach)', borderRadius: '15px', border: '2px solid var(--ink)' }}>
          <h3>📉 Món có dấu hiệu giảm nhiệt</h3>
          <p style={{ marginTop: '10px' }}>Món <strong>Sữa tươi trân châu đường đen</strong> đang có dấu hiệu bão hoà, giảm 5% lượt mua.</p>
        </div>
      </div>
    </section>
  );
};
