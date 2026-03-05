export interface HopData {
  hopNumber: number;
  ip: string;
  hostname: string;
  geo: string;
  sent: number;
  received: number;
  lossPercent: number;
  last: number | null;
  avg: number;
  best: number;
  worst: number;
  jitter: number;
  history: (number | null)[];
}

export interface MtrSessionConfig {
  target: string;
  interval: number;
  maxHops: number;
  historySize: number;
}

export interface MtrSessionState {
  status: 'idle' | 'discovering' | 'running' | 'stopped' | 'error';
  target: string;
  resolvedIp: string;
  hops: HopData[];
  startedAt: number;
  error?: string;
}

export interface PresetTarget {
  id: string;
  name: string;
  hostname: string;
  region: string;
  coordinates: [number, number];
  color: string;
}

export interface DiscoveredHop {
  hopNumber: number;
  ip: string | null;
}

export interface LossMonitorTarget {
  id: string;
  name: string;
  hostname: string;
  color: string;
  coordinates: [number, number];
}

export interface LossMonitorSample {
  targetId: string;
  rtt: number | null;
  timestamp: number;
}

export interface LossMonitorState {
  samples: LossMonitorSample[];
}

export const IPC_CHANNELS = {
  MTR_START: 'mtr:start',
  MTR_STOP: 'mtr:stop',
  MTR_DATA: 'mtr:data',
  MTR_HOP_DISCOVERED: 'mtr:hop-discovered',
  MTR_STATUS: 'mtr:status',
  MTR_ERROR: 'mtr:error',
  LOSS_START: 'loss:start',
  LOSS_STOP: 'loss:stop',
  LOSS_DATA: 'loss:data',
} as const;
