import { spawn } from 'child_process';
import { DiscoveredHop } from '../../shared/types';
import dns from 'dns';

// Match hop lines — the IP at the end is optional (timeouts have none)
// Examples:
//   1     3 ms     1 ms     2 ms  192.168.50.1
//   3     *        *        *     Request timed out.
//  12     *        *        *     Request timed out.
const HOP_REGEX = /^\s*(\d+)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s*([\d.]+)?\s*/;

// How many consecutive timeouts after a real hop before we stop early
const MAX_CONSECUTIVE_TIMEOUTS = 5;

export interface TracerouteCallbacks {
  onHop: (hop: DiscoveredHop) => void;
  onComplete: (hops: DiscoveredHop[]) => void;
  onError: (error: string) => void;
}

export function runTraceroute(
  target: string,
  maxHops: number,
  callbacks: TracerouteCallbacks,
  signal?: AbortSignal,
): void {
  const hops: DiscoveredHop[] = [];
  let buffer = '';
  let completed = false;
  let consecutiveTimeouts = 0;
  let foundAnyIp = false;

  const sanitized = target.replace(/[;&|`$(){}[\]!#]/g, '');
  const child = spawn('tracert', ['-d', '-w', '1000', '-h', String(maxHops), sanitized], {
    windowsHide: true,
  });

  signal?.addEventListener('abort', () => {
    child.kill();
  });

  const finish = () => {
    if (completed) return;
    completed = true;
    child.kill();
    callbacks.onComplete(hops);
  };

  const processLine = (line: string) => {
    if (completed) return;

    // Detect "Trace complete" to end
    if (line.includes('Trace complete')) {
      finish();
      return;
    }

    const match = line.match(HOP_REGEX);
    if (!match) return;

    const hopNumber = parseInt(match[1], 10);
    const ip = match[5] || null;

    const hop: DiscoveredHop = { hopNumber, ip };
    hops.push(hop);
    callbacks.onHop(hop);

    // Track consecutive timeouts to stop early
    if (ip) {
      foundAnyIp = true;
      consecutiveTimeouts = 0;
    } else {
      consecutiveTimeouts++;
      // If we've found real hops but now getting many timeouts, stop early
      if (foundAnyIp && consecutiveTimeouts >= MAX_CONSECUTIVE_TIMEOUTS) {
        finish();
        return;
      }
    }
  };

  child.stdout.on('data', (data: Buffer) => {
    buffer += data.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      processLine(line);
    }
  });

  child.stderr.on('data', (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) callbacks.onError(msg);
  });

  child.on('close', (code) => {
    // Process remaining buffer
    if (buffer.trim()) {
      processLine(buffer);
    }

    if (code !== 0 && hops.length === 0) {
      callbacks.onError(`Traceroute failed with exit code ${code}`);
    } else {
      finish();
    }
  });

  child.on('error', (err) => {
    callbacks.onError(`Failed to start tracert: ${err.message}`);
  });
}

export async function resolveHostname(ip: string): Promise<string> {
  try {
    const hostnames = await dns.promises.reverse(ip);
    return hostnames[0] || ip;
  } catch {
    return ip;
  }
}
