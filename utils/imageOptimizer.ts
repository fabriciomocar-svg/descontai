export const getOptimizedImageUrl = (url: string, width: number = 400): string => {
  if (!url) return '';
  // Se a URL já contiver parâmetros, adicionamos o width com &, senão com ?
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}width=${width}`;
};
