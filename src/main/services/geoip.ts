import http from 'node:http';

export interface GeoIpResult {
  location: string;
  lat: number | null;
  lon: number | null;
}

const cache = new Map<string, GeoIpResult>();

function isPrivateIp(ip: string): boolean {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') || ip.startsWith('172.2') || ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('127.') ||
    ip.startsWith('169.254.')
  );
}

const LAN_RESULT: GeoIpResult = { location: 'LAN', lat: null, lon: null };
const EMPTY_RESULT: GeoIpResult = { location: '', lat: null, lon: null };

export function lookupGeoIp(ip: string): Promise<string> {
  return lookupGeoIpFull(ip).then((r) => r.location);
}

export function lookupGeoIpFull(ip: string): Promise<GeoIpResult> {
  if (cache.has(ip)) return Promise.resolve(cache.get(ip)!);
  if (isPrivateIp(ip)) {
    cache.set(ip, LAN_RESULT);
    return Promise.resolve(LAN_RESULT);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(EMPTY_RESULT);
    }, 3000);

    // ip-api.com free tier — no API key needed, 45 req/min
    const req = http.get(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon`, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const json = JSON.parse(data);
          const location = [json.city, json.country].filter(Boolean).join(', ') || '';
          const result: GeoIpResult = {
            location,
            lat: typeof json.lat === 'number' ? json.lat : null,
            lon: typeof json.lon === 'number' ? json.lon : null,
          };
          cache.set(ip, result);
          resolve(result);
        } catch {
          resolve(EMPTY_RESULT);
        }
      });
    });

    req.on('error', () => {
      clearTimeout(timeout);
      resolve(EMPTY_RESULT);
    });
  });
}
