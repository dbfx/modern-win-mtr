import { EventEmitter } from 'events';
import { MtrSessionConfig, MtrSessionState, DiscoveredHop } from '../../shared/types';
import { runTraceroute, resolveHostname } from './traceroute';
import { ping } from './ping';
import { StatsCalculator } from './stats';
import { lookupGeoIp } from './geoip';

export class MtrSession extends EventEmitter {
  private config: MtrSessionConfig;
  private stats: StatsCalculator;
  private abortController: AbortController;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private pingInFlight = false;
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
              lookupGeoIp(hop.ip).then((geo) => {
                this.stats.setGeo(hop.hopNumber, geo);
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
    // Send first round immediately
    this.doPingRound();

    this.intervalHandle = setInterval(() => {
      this.doPingRound();
    }, this.config.interval);
  }

  private async doPingRound(): Promise<void> {
    if (this.pingInFlight) return; // Skip if previous round not done
    this.pingInFlight = true;

    const signal = this.abortController.signal;

    try {
      const pingsPromises = this.discoveredHops.map((hop) => {
        if (!hop.ip) {
          // Don't record samples for unknown hops — just skip them
          return Promise.resolve();
        }
        return ping(hop.ip, 2000, signal).then((rtt) => {
          if (!signal.aborted) {
            this.stats.addSample(hop.hopNumber, rtt);
          }
        });
      });

      await Promise.all(pingsPromises);

      if (signal.aborted) return;

      const state: MtrSessionState = {
        status: 'running',
        target: this.config.target,
        resolvedIp: this.resolvedIp,
        hops: this.stats.getSnapshot(),
        startedAt: Date.now(),
      };

      this.emit('data', state);
    } finally {
      this.pingInFlight = false;
    }
  }

  stop(): void {
    this.abortController.abort();
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.emit('status', 'stopped');
  }
}
