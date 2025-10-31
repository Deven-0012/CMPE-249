// --- Helpers ---
export const formatDuration = (secondsRaw) => {
  const seconds = Math.max(0, Number(secondsRaw || 0));
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

