import type { MtrSessionConfig, MtrSessionState, DiscoveredHop, LossMonitorState } from '../../shared/types';

export interface MtrApi {
  startSession: (config: MtrSessionConfig) => Promise<void>;
  stopSession: () => Promise<void>;
  onData: (callback: (state: MtrSessionState) => void) => () => void;
  onHopDiscovered: (callback: (hop: DiscoveredHop) => void) => () => void;
  onStatus: (callback: (status: string) => void) => () => void;
  onError: (callback: (error: string) => void) => () => void;
  startLossMonitor: () => Promise<void>;
  stopLossMonitor: () => Promise<void>;
  onLossData: (callback: (state: LossMonitorState) => void) => () => void;
}

declare global {
  interface Window {
    mtrApi: MtrApi;
  }
}

export {};
