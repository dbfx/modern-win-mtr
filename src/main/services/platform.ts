const isWin = process.platform === 'win32';

export function getPersistentPingArgs(ip: string, timeout: number): { command: string; args: string[] } {
  if (isWin) {
    // ping -t = continuous, -w = timeout in ms
    return { command: 'ping', args: ['-t', '-w', String(timeout), ip] };
  }
  // macOS/Linux: no -t flag; use huge count for continuous. -W = timeout in seconds (min 1)
  const timeoutSec = Math.max(1, Math.ceil(timeout / 1000));
  return { command: 'ping', args: ['-c', '1000000', '-W', String(timeoutSec), ip] };
}

export function getTracerouteArgs(target: string, maxHops: number): { command: string; args: string[] } {
  if (isWin) {
    return { command: 'tracert', args: ['-d', '-w', '1000', '-h', String(maxHops), target] };
  }
  // macOS/Linux: traceroute -n (no DNS), -w 1 (timeout), -m maxHops
  return { command: 'traceroute', args: ['-n', '-w', '1', '-m', String(maxHops), target] };
}

// Windows: time<=1ms  or  time=12ms
// macOS:   time=1.234 ms
export const PING_RTT_REGEX = isWin
  ? /time[<=](\d+)ms/i
  : /time=(\d+(?:\.\d+)?)\s*ms/i;

export const PING_TIMEOUT_REGEX = isWin
  ? /Request timed out|General failure|Destination .* unreachable/i
  : /Request timeout|100(\.0)?% packet loss|Host Unreachable|No route to host/i;

// Windows tracert output:
//   1     3 ms     1 ms     2 ms  192.168.50.1
//   3     *        *        *     Request timed out.
// macOS traceroute output:
//   1  192.168.50.1  1.234 ms  0.987 ms  1.012 ms
//   3  * * *
export const TRACEROUTE_HOP_REGEX = isWin
  ? /^\s*(\d+)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s*([\d.]+)?\s*/
  : /^\s*(\d+)\s+(?:(\d[\d.]*)\s+[\d.]+\s*ms|\*)/;

export function parseTracerouteHop(line: string): { hopNumber: number; ip: string | null } | null {
  if (isWin) {
    const match = line.match(
      /^\s*(\d+)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s+([\d<]+\s*ms|\*)\s*([\d.]+)?\s*/,
    );
    if (!match) return null;
    return { hopNumber: parseInt(match[1], 10), ip: match[5] || null };
  }

  // macOS: "  1  192.168.1.1  1.234 ms  ..."  or  "  3  * * *"
  const match = line.match(/^\s*(\d+)\s+(\d[\d.]+)\s+[\d.]+\s*ms/);
  if (match) {
    return { hopNumber: parseInt(match[1], 10), ip: match[2] };
  }
  const timeoutMatch = line.match(/^\s*(\d+)\s+\*/);
  if (timeoutMatch) {
    return { hopNumber: parseInt(timeoutMatch[1], 10), ip: null };
  }
  return null;
}

export function isTraceComplete(line: string): boolean {
  if (isWin) return line.includes('Trace complete');
  // macOS traceroute just ends — no explicit "complete" message
  return false;
}
