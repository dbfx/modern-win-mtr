import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { getPersistentPingArgs, PING_RTT_REGEX, PING_TIMEOUT_REGEX } from './platform';

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
    const { command, args } = getPersistentPingArgs(this.ip, this.timeout);
    this.child = spawn(command, args, { windowsHide: true });

    this.child.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split(/\r?\n/);
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        const match = line.match(PING_RTT_REGEX);
        if (match) {
          this.emit('result', Math.round(parseFloat(match[1])));
        } else if (PING_TIMEOUT_REGEX.test(line)) {
          this.emit('result', null);
        }
      }
    });

    this.child.on('error', () => {});

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
