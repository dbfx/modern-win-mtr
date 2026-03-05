import { EventEmitter } from 'events';
import { MtrSessionConfig, MtrSessionState, DiscoveredHop } from '../../shared/types';
import { runTraceroute, resolveHostname } from './traceroute';
import { PersistentPing } from './persistent-ping';
import { StatsCalculator } from './stats';
import { lookupGeoIpFull } from './geoip';

export class MtrSession extends EventEmitter {
  private config: MtrSessionConfig;
  private stats: StatsCalculator;
  private abortController: AbortController;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private persistentPings: PersistentPing[] = [];
  private discoveredHops: DiscoveredHop[] = [];
  private resolvedIp = '';

  constructor(config: MtrSessionConfig) {
    super();
    this.config = config;
    this.stats = new StatsCalculator(config.historySize);
    this.abortController = new AbortController();
  }

  async start(): Promise<void> {
    this.emit('status', 'discovering');

    return new Promise<void>((resolve, reject) => {
      runTraceroute(
        this.config.target,
        this.config.maxHops,
        {
          onHop: (hop) => {
            this.discoveredHops.push(hop);
            const ip = hop.ip || '???';
            this.stats.initHop(hop.hopNumber, ip);
            this.emit('hop-discovered', hop);

            // Resolve hostname and geo in background
            if (hop.ip) {
              resolveHostname(hop.ip).then((hostname) => {
                this.stats.setHostname(hop.hopNumber, hostname);
              });
              lookupGeoIpFull(hop.ip).then((result) => {
                this.stats.setGeo(hop.hopNumber, result.location, result.lat, result.lon);
              });
            }
          },
          onComplete: (hops) => {
            // Set resolved IP from final hop
            const lastHop = hops[hops.length - 1];
            if (lastHop?.ip) this.resolvedIp = lastHop.ip;

            this.emit('status', 'running');
            this.startPingLoop();
            resolve();
          },
          onError: (error) => {
            if (this.discoveredHops.length > 0) {
              // Partial trace - start pinging what we have
              this.emit('status', 'running');
              this.startPingLoop();
              resolve();
            } else {
              this.emit('error', error);
              this.emit('status', 'error');
              reject(new Error(error));
            }
          },
        },
        this.abortController.signal,
      );
    });
  }

  private startPingLoop(): void {
    // Start a persistent ping process for each hop with a known IP
    for (const hop of this.discoveredHops) {
      if (!hop.ip) continue;

      const pp = new PersistentPing(hop.ip, 2000);
      pp.on('result', (rtt: number | null) => {
        if (!this.abortController.signal.aborted) {
          this.stats.addSample(hop.hopNumber, rtt);
        }
      });
      pp.start();
      this.persistentPings.push(pp);
    }

    // Emit snapshots at the configured interval
    this.intervalHandle = setInterval(() => {
      if (this.abortController.signal.aborted) return;

      const state: MtrSessionState = {
        status: 'running',
        target: this.config.target,
        resolvedIp: this.resolvedIp,
        hops: this.stats.getSnapshot(),
        startedAt: Date.now(),
      };

      this.emit('data', state);
    }, this.config.interval);
  }

  stop(): void {
    this.abortController.abort();
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    for (const pp of this.persistentPings) {
      pp.stop();
    }
    this.persistentPings = [];
    this.emit('status', 'stopped');
  }
}
