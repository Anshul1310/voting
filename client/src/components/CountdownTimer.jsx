import React, { useEffect, useState } from 'react';

export default function CountdownTimer({ expiresAt, onExpire }) {
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

  return (
    <div 
      className={`timer-badge ${isUrgent ? 'urgent' : ''}`}
      style={{
        color: isUrgent ? '#ef4444' : isExpired ? 'var(--text-muted)' : 'var(--text-secondary)'
      }}
    >
      <span>
        {isExpired ? '0s' : `${timeLeft}s remaining`}
      </span>
    </div>
  );
}
