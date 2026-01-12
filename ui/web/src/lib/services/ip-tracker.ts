/**
 * IP Tracking and Geolocation Service
 * Provides detailed location information from IP addresses
 */

export interface IPGeolocation {
  ip: string;
  hostname?: string;
  city: string;
  region: string;
  regionCode: string;
  country: string;
  countryCode: string;
  continent?: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utcOffset?: string;
  postalCode?: string;
  isp: string;
  org?: string;
  asn?: string;
  proxy?: boolean;
  vpn?: boolean;
  tor?: boolean;
  mobile?: boolean;
  currency?: string;
  district?: string;
  locality?: string;
  formattedAddress: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userBadge?: string;
  stationId?: string;
  stationName?: string;
  action: AccessAction;
  resource?: string;
  resourceId?: string;
  description: string;
  ipAddress: string;
  geolocation: IPGeolocation | null;
  userAgent: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
  timestamp: string;
  sessionId?: string;
  success: boolean;
  errorMessage?: string;
}

export type AccessAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'VIEW'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'PRINT'
  | 'DOWNLOAD'
  | 'SEARCH'
  | 'API_ACCESS'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'SENSITIVE_ACCESS';

// Primary API - ip-api.com (free, no key required, 45 requests/minute)
async function fetchFromIpApi(ip: string): Promise<IPGeolocation | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,continent,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,isp,org,as,asname,mobile,proxy,hosting,query`
    );
    const data = await response.json();

    if (data.status === 'fail') {
      console.error('ip-api.com failed:', data.message);
      return null;
    }

    return {
      ip: data.query || ip,
      city: data.city || 'Unknown',
      region: data.regionName || 'Unknown',
      regionCode: data.region || '',
      country: data.country || 'Unknown',
      countryCode: data.countryCode || '',
      continent: data.continent,
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      timezone: data.timezone || 'Unknown',
      utcOffset: data.offset ? `UTC${data.offset >= 0 ? '+' : ''}${data.offset / 3600}` : undefined,
      postalCode: data.zip,
      isp: data.isp || 'Unknown',
      org: data.org,
      asn: data.as,
      proxy: data.proxy,
      vpn: data.hosting, // hosting often indicates VPN/datacenter
      mobile: data.mobile,
      district: data.district,
      formattedAddress: formatAddress(data),
    };
  } catch (error) {
    console.error('Error fetching from ip-api.com:', error);
    return null;
  }
}

// Backup API - ipapi.co (free tier: 1000/day)
async function fetchFromIpapiCo(ip: string): Promise<IPGeolocation | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();

    if (data.error) {
      console.error('ipapi.co failed:', data.reason);
      return null;
    }

    return {
      ip: data.ip || ip,
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      regionCode: data.region_code || '',
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || '',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || 'Unknown',
      utcOffset: data.utc_offset,
      postalCode: data.postal,
      isp: data.org || 'Unknown',
      org: data.org,
      asn: data.asn,
      currency: data.currency,
      formattedAddress: `${data.city || ''}, ${data.region || ''}, ${data.country_name || ''}`.replace(/^, |, $/g, ''),
    };
  } catch (error) {
    console.error('Error fetching from ipapi.co:', error);
    return null;
  }
}

function formatAddress(data: any): string {
  const parts = [];
  if (data.district) parts.push(data.district);
  if (data.city) parts.push(data.city);
  if (data.regionName) parts.push(data.regionName);
  if (data.country) parts.push(data.country);
  if (data.zip) parts.push(`- ${data.zip}`);
  return parts.join(', ') || 'Unknown Location';
}

/**
 * Get geolocation data for an IP address
 */
export async function getIPGeolocation(ip: string): Promise<IPGeolocation | null> {
  // Skip for localhost/private IPs
  if (isPrivateIP(ip)) {
    return {
      ip,
      city: 'Local Network',
      region: 'Private',
      regionCode: '',
      country: 'Local',
      countryCode: 'LO',
      latitude: 0,
      longitude: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isp: 'Local Network',
      formattedAddress: 'Local/Private Network',
    };
  }

  // Try primary API first
  let result = await fetchFromIpApi(ip);

  // Fallback to backup API if primary fails
  if (!result) {
    result = await fetchFromIpapiCo(ip);
  }

  return result;
}

/**
 * Check if IP is private/local
 */
export function isPrivateIP(ip: string): boolean {
  if (!ip) return true;

  // IPv4 private ranges
  const privateRanges = [
    /^127\./, // Loopback
    /^10\./, // Class A private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private
    /^192\.168\./, // Class C private
    /^169\.254\./, // Link-local
    /^0\./, // Current network
    /^::1$/, // IPv6 loopback
    /^fe80:/i, // IPv6 link-local
    /^fc00:/i, // IPv6 unique local
    /^fd00:/i, // IPv6 unique local
  ];

  return privateRanges.some(range => range.test(ip)) || ip === 'localhost';
}

/**
 * Get client IP from request headers (for API routes)
 */
export function getClientIP(headers: Headers): string {
  // Check various headers that might contain the real IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first one is the client
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;

  const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) return cfConnectingIP;

  const trueClientIP = headers.get('true-client-ip'); // Akamai/Cloudflare
  if (trueClientIP) return trueClientIP;

  return '0.0.0.0';
}

/**
 * Parse user agent string to extract device info
 */
export function parseUserAgent(userAgent: string): {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();

  // Detect device type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    deviceType = 'mobile';
  } else if (/windows|macintosh|linux/i.test(ua)) {
    deviceType = 'desktop';
  }

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  else if (ua.includes('msie') || ua.includes('trident')) browser = 'Internet Explorer';

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows nt 10')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('linux')) os = 'Linux';

  return { deviceType, browser, os };
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
