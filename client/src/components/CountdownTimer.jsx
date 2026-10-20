import React, { useEffect, useState } from 'react';
import { Timer, AlertTriangle } from 'lucide-react';

export default function CountdownTimer({ expiresAt, totalDuration, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 1000));
  });

  useEffect(() => {
    if (!expiresAt) return;

    const calculate = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      const remaining = Math.max(0, Math.ceil(diff / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0 && onExpire) {
        onExpire();
      }
    };

    calculate();
    const interval = setInterval(calculate, 250);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const isUrgent = timeLeft > 0 && timeLeft <= 5;
  const isExpired = timeLeft <= 0;

  // Percentage of time remaining
  const duration = totalDuration || 15;
  const percent = Math.min(100, Math.max(0, (timeLeft / duration) * 100));

  return (
    <div 
      className={`timer-badge ${isUrgent ? 'urgent' : ''}`}
      style={{
        borderColor: isExpired 
          ? 'rgba(100, 116, 139, 0.4)' 
          : isUrgent 
            ? 'rgba(244, 63, 94, 0.8)' 
            : percent > 50 
              ? 'rgba(16, 185, 129, 0.5)' 
              : 'rgba(245, 158, 11, 0.5)',
        color: isExpired 
          ? 'var(--text-muted)' 
          : isUrgent 
            ? '#fb7185' 
            : percent > 50 
              ? '#34d399' 
              : '#fbbf24'
      }}
    >
      {isUrgent ? (
        <AlertTriangle size={18} className="animate-spin" />
      ) : (
        <Timer size={18} />
      )}
      
      <span>
        {isExpired ? "00:00 (Time's Up!)" : `${timeLeft < 10 ? '0' : ''}${timeLeft}s`}
      </span>

      <span style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {isExpired ? 'Ended' : isUrgent ? 'HURRY!' : 'LEFT'}
      </span>
    </div>
  );
}
