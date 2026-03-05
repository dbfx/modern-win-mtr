import type { MtrSessionConfig, MtrSessionState, DiscoveredHop, LossMonitorState, AlertRule } from '../../shared/types';

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
  getVersion: () => Promise<string>;
  getProcessVersions: () => { electron: string; chrome: string; node: string };
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  onUpdaterStatus: (callback: (status: string) => void) => () => void;
  onUpdaterProgress: (callback: (percent: number) => void) => () => void;
  onUpdaterError: (callback: (message: string) => void) => () => void;
  loadAlertRules: () => Promise<AlertRule[]>;
  saveAlertRules: (rules: AlertRule[]) => Promise<void>;
  showNotification: (title: string, body: string) => Promise<void>;
}

declare global {
  interface Window {
    mtrApi: MtrApi;
  }
}

export {};
