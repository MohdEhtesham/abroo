export const formatCurrency = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount}`;
};

export const formatPriceRange = (min: number, max: number): string =>
  `${formatCurrency(min)} - ${formatCurrency(max)}`;

export const formatArea = (sqft: number): string => `${sqft.toLocaleString('en-IN')} sq.ft`;

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDateTime = (iso: string): string =>
  `${formatDate(iso)} • ${formatTime(iso)}`;

export const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  if (day < 30) return `${Math.floor(day / 7)}w ago`;
  return formatDate(iso);
};

export const truncate = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max).trim()}…` : text;

export const initials = (name: string): string =>
  name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
