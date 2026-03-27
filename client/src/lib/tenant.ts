export const getHostname = () => window.location.hostname;

export const getIsAgencyDomain = () => {
  const hostname = getHostname();
  const parts = hostname.split('.');
  
  // Custom domains or subdomains of trajetour.com
  if (hostname.includes('.trajetour.com') && parts.length > 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'api') {
    return true;
  }
  
  // Localhost subdomains
  if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'www') {
    return true;
  }
  
  return false;
};

export const getAgencyPath = (path: string) => {
  const cleanPath = path.startsWith('/agency') ? path.slice(7) : path;
  return `/agency${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
};
