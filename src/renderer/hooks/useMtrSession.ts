import { useState, useEffect, useCallback, useRef } from 'react';
import type { MtrSessionState, HopData, DiscoveredHop } from '../../shared/types';

export type SessionStatus = 'idle' | 'discovering' | 'running' | 'stopped' | 'error';

export interface UseMtrSessionReturn {
  hops: HopData[];
  status: SessionStatus;
  target: string;
  resolvedIp: string;
  error: string | null;
  start: (target: string, interval?: number) => Promise<void>;
  stop: () => Promise<void>;
}

export function useMtrSession(): UseMtrSessionReturn {
  const [hops, setHops] = useState<HopData[]>([]);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [target, setTarget] = useState('');
  const [resolvedIp, setResolvedIp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    const unsubData = window.mtrApi.onData((state: MtrSessionState) => {
      setHops(state.hops);
      setResolvedIp(state.resolvedIp);
    });

    const unsubStatus = window.mtrApi.onStatus((s: string) => {
      setStatus(s as SessionStatus);
    });

    const unsubError = window.mtrApi.onError((err: string) => {
      setError(err);
    });

    const unsubHop = window.mtrApi.onHopDiscovered((hop: DiscoveredHop) => {
      setHops((prev) => {
        // Add a placeholder hop during discovery
        if (prev.find((h) => h.hopNumber === hop.hopNumber)) return prev;
        return [
          ...prev,
          {
            hopNumber: hop.hopNumber,
            ip: hop.ip || '???',
            hostname: hop.ip || '???',
            geo: '',
            geoLat: null,
            geoLon: null,
            sent: 0,
            received: 0,
            lossPercent: 0,
            last: null,
            avg: 0,
            best: 0,
            worst: 0,
            jitter: 0,
            history: [],
          },
        ];
      });
    });

    return () => {
      unsubData();
      unsubStatus();
      unsubError();
      unsubHop();
    };
  }, []);

  const start = useCallback(async (t: string, interval: number = 1000) => {
    setError(null);
    setHops([]);
    setTarget(t);
    setResolvedIp('');
    startedAtRef.current = Date.now();

    await window.mtrApi.startSession({
      target: t,
      interval,
      maxHops: 30,
      historySize: 100,
    });
  }, []);

  const stop = useCallback(async () => {
    await window.mtrApi.stopSession();
  }, []);

  return { hops, status, target, resolvedIp, error, start, stop };
}
