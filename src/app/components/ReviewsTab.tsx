import React, { useEffect, useState } from 'react';
import styles from '../page.module.css';

export const ReviewsTab = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://192.168.1.186:3000/merchant/reviews?storeId=store-genz-01');
      const data = await res.json();
      if (data.items) {
        setReviews(data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const interval = setInterval(fetchReviews, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReply = async (id: string) => {
    if (!replyText[id]?.trim()) return;
    try {
      await fetch(`http://192.168.1.186:3000/merchant/reviews/${id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText[id] })
      });
      fetchReviews();
      setReplyText({ ...replyText, [id]: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải đánh giá...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Chưa có đánh giá nào.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
          {reviews.map((review) => (
            <div key={review._id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '16px', 
              padding: '24px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--ink)' }}>
                  {review.customerName}
                </div>
                <div style={{ fontSize: '16px' }}>{renderStars(review.rating)}</div>
              </div>
              
              <div style={{ color: '#555', fontSize: '14px', marginBottom: '16px' }}>
                Đơn hàng: #{review.orderId.substring(0, 8).toUpperCase()} • {new Date(review.createdAt).toLocaleString('vi-VN')}
              </div>

              {review.tags && review.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {review.tags.map((tag: string, idx: number) => (
                    <span key={idx} style={{ 
                      backgroundColor: 'var(--mint)', 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      color: 'var(--ink)'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {review.comment && (
                <p style={{ fontSize: '16px', lineHeight: '1.5', color: 'var(--ink)', backgroundColor: '#f9f9f9', padding: '16px', borderRadius: '12px', fontStyle: 'italic' }}>
                  &quot;{review.comment}&quot;
                </p>
              )}

              {review.merchantReply ? (
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--peach)', borderRadius: '12px', borderLeft: '4px solid var(--hot)' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--ink)' }}>Quán trả lời:</div>
                  <div style={{ color: 'var(--ink)' }}>{review.merchantReply}</div>
                </div>
              ) : (
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Nhập câu trả lời dễ thương của quán..." 
                    style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}
                    value={replyText[review._id] || ''}
                    onChange={(e) => setReplyText({ ...replyText, [review._id]: e.target.value })}
                  />
                  <button 
                    onClick={() => handleReply(review._id)}
                    style={{ 
                      backgroundColor: 'var(--hot)', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0 20px', 
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Gửi rep
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
