import http from 'node:http';

const cache = new Map<string, string>();

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

export function lookupGeoIp(ip: string): Promise<string> {
  if (cache.has(ip)) return Promise.resolve(cache.get(ip)!);
  if (isPrivateIp(ip)) {
    cache.set(ip, 'LAN');
    return Promise.resolve('LAN');
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve('');
    }, 3000);

    // ip-api.com free tier — no API key needed, 45 req/min
    const req = http.get(`http://ip-api.com/json/${ip}?fields=country,city`, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        clearTimeout(timeout);
        try {
          const json = JSON.parse(data);
          const location = [json.city, json.country].filter(Boolean).join(', ') || '';
          cache.set(ip, location);
          resolve(location);
        } catch {
          resolve('');
        }
      });
    });

    req.on('error', () => {
      clearTimeout(timeout);
      resolve('');
    });
  });
}
