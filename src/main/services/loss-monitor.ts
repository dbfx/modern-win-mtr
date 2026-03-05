import { EventEmitter } from 'events';
import dns from 'dns';
import { LossMonitorTarget, LossMonitorSample } from '../../shared/types';
import { ping } from './ping';

export class LossMonitor extends EventEmitter {
  private targets: LossMonitorTarget[];
  private interval: number;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private resolvedIps: Map<string, string> = new Map();
  private pingInFlight = false;
  private stopped = false;

  constructor(targets: LossMonitorTarget[], interval: number = 2000) {
    super();
    this.targets = targets;
    this.interval = interval;
  }

  async start(): Promise<void> {
    this.stopped = false;

    // Resolve all hostnames to IPs once
    await Promise.all(
      this.targets.map(async (t) => {
        try {
          const addresses = await dns.promises.resolve4(t.hostname);
          if (addresses.length > 0) {
            this.resolvedIps.set(t.id, addresses[0]);
          }
        } catch {
          // Fallback: use hostname directly (ping can resolve it)
          this.resolvedIps.set(t.id, t.hostname);
        }
      }),
    );

    if (this.stopped) return;

    // First round immediately
    this.doPingRound();

    this.intervalHandle = setInterval(() => {
      this.doPingRound();
    }, this.interval);
  }

  private async doPingRound(): Promise<void> {
    if (this.pingInFlight || this.stopped) return;
    this.pingInFlight = true;

    try {
      const timestamp = Date.now();
      const results = await Promise.all(
        this.targets.map(async (t): Promise<LossMonitorSample> => {
          const ip = this.resolvedIps.get(t.id) || t.hostname;
          const rtt = await ping(ip, 2000);
          return { targetId: t.id, rtt, timestamp };
        }),
      );

      if (!this.stopped) {
        this.emit('data', { samples: results });
      }
    } finally {
      this.pingInFlight = false;
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }
}
