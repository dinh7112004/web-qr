'use client';

import React, { useEffect, useState } from 'react';
import { API_URL } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

interface Insight {
  _id?: string;
  category: string;
  title: string;
  content: string;
  suggestion: string;
  type: 'trend_up' | 'trend_down';
  actionText: string;
}

const categoryColors: Record<string, { bg: string, text: string, icon: string }> = {
  revenue: { bg: '#FFF0F3', text: '#FF4D6D', icon: '#FF8FA3' },
  product: { bg: '#F0FFF4', text: '#2D6A4F', icon: '#52B788' },
  space: { bg: '#F0F4FF', text: '#4361EE', icon: '#4CC9F0' },
  tech: { bg: '#FFF9F0', text: '#D4A373', icon: '#E9C46A' },
  model: { bg: '#F5F3FF', text: '#7209B7', icon: '#B5179E' },
  sustainability: { bg: '#F0FFF4', text: '#1B4332', icon: '#2D6A4F' },
  general: { bg: '#F8F9FA', text: '#6c757d', icon: '#adb5bd' }
};

export default function TrendForecastTab({ insights: externalInsights, onTabChange }: { insights?: Insight[], onTabChange?: (tab: string) => void }) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (externalInsights && externalInsights.length > 0) {
      setInsights(externalInsights);
      setLoading(false);
    } else {
      fetchInsights();
    }
  }, [externalInsights]);

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${API_URL}/ai/dashboard`);
      const data = await res.json();
      if (data.insights && data.insights.length > 0) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error('Fetch insights failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: 'transparent', 
      padding: '40px 24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ marginBottom: '15px' }}
        >
          <span style={{ 
            background: '#FF8FA3', 
            color: '#fff', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: 800,
            boxShadow: '0 4px 10px rgba(255, 143, 163, 0.3)'
          }}>
            BOBA BOT CEO MODE 🎀
          </span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: '36px', fontWeight: 900, color: '#1a1a1a', marginBottom: '8px' }}
        >
          Dự báo Xu hướng AI ✨
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ color: '#6c757d', fontSize: '16px' }}
        >
          Bestie ơi, xem AI gợi ý gì cho quán mình hôm nay nè!
        </motion.p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '24px',
        marginBottom: '60px'
      }}>
        <AnimatePresence>
          {insights.map((insight, idx) => {
            const colors = categoryColors[insight.category] || categoryColors.general;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                style={{
                  background: '#fff',
                  borderRadius: '40px',
                  padding: '30px',
                  border: `2px solid ${colors.bg}`,
                  boxShadow: '0 15px 35px rgba(255, 143, 163, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  right: 0, 
                  width: '100px', 
                  height: '100px', 
                  background: colors.bg,
                  borderRadius: '0 0 0 100px',
                  opacity: 0.5,
                  zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ 
                      padding: '8px 15px', 
                      borderRadius: '15px', 
                      background: colors.bg,
                      color: colors.text,
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      # {insight.category}
                    </div>
                    {insight.type === 'trend_up' && <Icon name="trending-up" size={16} color={colors.text} />}
                  </div>

                  <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px', color: '#1a1a1a' }}>
                    {insight.title}
                  </h3>
                  
                  <p style={{ fontSize: '15px', color: '#4a4a4a', lineHeight: '1.6', marginBottom: '25px' }}>
                    {insight.content}
                  </p>

                  <div style={{ 
                    background: colors.bg, 
                    borderRadius: '25px', 
                    padding: '20px', 
                    marginBottom: '25px',
                    border: `1.5px dashed ${colors.icon}44`
                  }}>
                    <p style={{ fontSize: '13px', color: colors.text, fontWeight: 700, marginBottom: '5px' }}>Gợi ý từ AI CEO ✨</p>
                    <p style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: 600 }}>{insight.suggestion}</p>
                  </div>

                  <button 
                    onClick={() => {
                      if (insight.category === 'product' && onTabChange) onTabChange('menu');
                      else if (insight.category === 'revenue' && onTabChange) onTabChange('overview');
                    }}
                    style={{
                      background: colors.text,
                      color: '#fff',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '14px 20px',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      boxShadow: `0 10px 20px ${colors.text}33`
                    }}
                  >
                    {insight.actionText} ➔
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <section style={{
        background: 'linear-gradient(135deg, #FF80AB 0%, #B39DDB 100%)',
        borderRadius: '50px',
        padding: '40px',
        color: '#fff',
        boxShadow: '0 25px 50px rgba(255, 128, 171, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: -30, 
          right: -30, 
          width: '180px', 
          height: '180px', 
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', position: 'relative', zIndex: 1 }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '5px', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>Hành động Nhanh ⚡️</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: 600 }}>Nâng cấp quán mình chỉ với 1 chạm!</p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.3)',
            padding: '12px',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            <Icon name="zap" size={32} color="#fff" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { name: 'Cập nhật Menu', tab: 'menu', icon: 'coffee', color: '#FF4D6D' },
            { name: 'Xem Đánh giá', tab: 'reviews', icon: 'star', color: '#FFD166' },
            { name: 'Tạo Voucher', tab: 'promo', icon: 'tag', color: '#06D6A0' },
            { name: 'Theo dõi Đơn', tab: 'orders', icon: 'shopping-bag', color: '#118AB2' }
          ].map((action, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange && onTabChange(action.tab)}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '35px',
                padding: '25px',
                color: '#1a1a1a',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                boxShadow: '0 10px 20px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ 
                width: '45px', 
                height: '45px', 
                borderRadius: '16px', 
                background: `${action.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon name={action.icon as any} size={22} color={action.color} />
              </div>
              <span style={{ fontSize: '15px' }}>{action.name}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
