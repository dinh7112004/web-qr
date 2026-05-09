import React from 'react';
import styles from '../page.module.css';

export const BotLogsTab = ({ logs = [] }: { logs?: any[] }) => {
  return (
    <section className={styles.tableSection}>
      <div className={styles.tableHeader}>
        <h2>Boba Bot Logs 🤖</h2>
      </div>
      <div style={{ backgroundColor: 'var(--ink)', color: '#fff', padding: '20px', borderRadius: '15px', fontFamily: 'monospace', fontSize: '14px', height: '400px', overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Đang đợi log từ Bot...</p>
        ) : logs.map((log, i) => (
          <p key={i} style={{ marginBottom: '8px', borderLeft: `3px solid ${log.type === 'error' ? 'var(--hot)' : 'var(--mint)'}`, paddingLeft: '10px' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: '10px' }}>
              [{new Date(log.createdAt).toLocaleTimeString('vi-VN')}]
            </span>
            {log.text}
          </p>
        ))}
      </div>
    </section>
  );
};
