import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

const REPLY_REGEX = /time[<=](\d+)ms/i;
const TIMEOUT_REGEX = /Request timed out|General failure|Destination .* unreachable/i;

/**
 * A long-lived ping process that continuously pings a target using `ping -t`.
 * Emits 'result' events with the RTT (number) or null (timeout/failure).
 * Avoids the overhead of spawning a new process for every ping round.
 */
export class PersistentPing extends EventEmitter {
  private child: ChildProcess | null = null;
  private ip: string;
  private timeout: number;
  private buffer = '';

  constructor(ip: string, timeout: number = 2000) {
    super();
    this.ip = ip;
    this.timeout = timeout;
  }

  start(): void {
    this.child = spawn('ping', ['-t', '-w', String(this.timeout), this.ip], {
      windowsHide: true,
    });

    this.child.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split(/\r?\n/);
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        const match = line.match(REPLY_REGEX);
        if (match) {
          this.emit('result', parseInt(match[1], 10));
        } else if (TIMEOUT_REGEX.test(line)) {
          this.emit('result', null);
        }
      }
    });

    this.child.on('error', () => {
      // Process failed to start — nothing we can do
    });

    this.child.on('close', () => {
      this.child = null;
    });
  }

  stop(): void {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
    this.removeAllListeners();
  }
}
