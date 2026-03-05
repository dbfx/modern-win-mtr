import { EventEmitter } from 'events';
import dns from 'dns';
import { LossMonitorTarget } from '../../shared/types';
import { PersistentPing } from './persistent-ping';

export class LossMonitor extends EventEmitter {
  private targets: LossMonitorTarget[];
  private persistentPings: PersistentPing[] = [];
  private stopped = false;

  constructor(targets: LossMonitorTarget[]) {
    super();
    this.targets = targets;
  }

  async start(): Promise<void> {
    this.stopped = false;

    // Resolve all hostnames to IPs once
    const resolvedIps = new Map<string, string>();
    await Promise.all(
      this.targets.map(async (t) => {
        try {
          const addresses = await dns.promises.resolve4(t.hostname);
          if (addresses.length > 0) {
            resolvedIps.set(t.id, addresses[0]);
          }
        } catch {
          resolvedIps.set(t.id, t.hostname);
        }
      }),
    );

    if (this.stopped) return;

    // Start a persistent ping for each target — emit each result immediately
    for (const t of this.targets) {
      const ip = resolvedIps.get(t.id) || t.hostname;
      const pp = new PersistentPing(ip, 2000);
      pp.on('result', (rtt: number | null) => {
        if (!this.stopped) {
          this.emit('data', {
            samples: [{ targetId: t.id, rtt, timestamp: Date.now() }],
          });
        }
      });
      pp.start();
      this.persistentPings.push(pp);
    }
  }

  stop(): void {
    this.stopped = true;
    for (const pp of this.persistentPings) {
      pp.stop();
    }
    this.persistentPings = [];
  }
}
