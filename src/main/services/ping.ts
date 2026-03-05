import { spawn } from 'child_process';

const REPLY_REGEX = /time[<=](\d+)ms/i;

export function ping(ip: string, timeout: number = 2000, signal?: AbortSignal): Promise<number | null> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }

    let output = '';

    const child = spawn('ping', ['-n', '1', '-w', String(timeout), ip], {
      windowsHide: true,
    });

    const onAbort = () => {
      child.kill();
      resolve(null);
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    const timer = setTimeout(() => {
      child.kill();
      resolve(null);
    }, timeout + 1000);

    child.stdout.on('data', (data: Buffer) => {
      output += data.toString();
    });

    child.on('close', () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      const match = output.match(REPLY_REGEX);
      if (match) {
        resolve(parseInt(match[1], 10));
      } else {
        resolve(null);
      }
    });

    child.on('error', () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(null);
    });
  });
}
