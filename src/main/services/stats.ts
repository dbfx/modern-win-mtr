import { HopData } from '../../shared/types';

interface HopStats {
  hopNumber: number;
  ip: string;
  hostname: string;
  geo: string;
  sent: number;
  received: number;
  last: number | null;
  best: number;
  worst: number;
  sum: number;
  history: (number | null)[];
  historySize: number;
}

export class StatsCalculator {
  private hops: Map<number, HopStats> = new Map();
  private historySize: number;

  constructor(historySize: number = 100) {
    this.historySize = historySize;
  }

  initHop(hopNumber: number, ip: string): void {
    if (!this.hops.has(hopNumber)) {
      this.hops.set(hopNumber, {
        hopNumber,
        ip,
        hostname: ip,
        geo: '',
        sent: 0,
        received: 0,
        last: null,
        best: Infinity,
        worst: 0,
        sum: 0,
        history: [],
        historySize: this.historySize,
      });
    }
  }

  setHostname(hopNumber: number, hostname: string): void {
    const hop = this.hops.get(hopNumber);
    if (hop) hop.hostname = hostname;
  }

  setGeo(hopNumber: number, geo: string): void {
    const hop = this.hops.get(hopNumber);
    if (hop) hop.geo = geo;
  }

  addSample(hopNumber: number, rtt: number | null): void {
    const hop = this.hops.get(hopNumber);
    if (!hop) return;

    hop.sent++;
    hop.last = rtt;

    if (rtt !== null) {
      hop.received++;
      hop.sum += rtt;
      if (rtt < hop.best) hop.best = rtt;
      if (rtt > hop.worst) hop.worst = rtt;
    }

    hop.history.push(rtt);
    if (hop.history.length > hop.historySize) {
      hop.history.shift();
    }
  }

  getSnapshot(): HopData[] {
    const result: HopData[] = [];

    for (const [, hop] of this.hops) {
      const lossPercent = hop.sent > 0
        ? ((hop.sent - hop.received) / hop.sent) * 100
        : 0;

      const avg = hop.received > 0 ? hop.sum / hop.received : 0;

      // Calculate jitter as stddev of non-null RTT values in history
      const validRtts = hop.history.filter((v): v is number => v !== null);
      let jitter = 0;
      if (validRtts.length > 1) {
        const mean = validRtts.reduce((a, b) => a + b, 0) / validRtts.length;
        const variance = validRtts.reduce((sum, v) => sum + (v - mean) ** 2, 0) / validRtts.length;
        jitter = Math.sqrt(variance);
      }

      result.push({
        hopNumber: hop.hopNumber,
        ip: hop.ip,
        hostname: hop.hostname,
        geo: hop.geo,
        sent: hop.sent,
        received: hop.received,
        lossPercent: Math.round(lossPercent * 10) / 10,
        last: hop.last,
        avg: Math.round(avg * 10) / 10,
        best: hop.best === Infinity ? 0 : hop.best,
        worst: hop.worst,
        jitter: Math.round(jitter * 10) / 10,
        history: [...hop.history],
      });
    }

    return result.sort((a, b) => a.hopNumber - b.hopNumber);
  }

  reset(): void {
    this.hops.clear();
  }
}
