import { useState, useEffect, useCallback, useRef } from 'react';
import type { AlertRule, AlertMetric, AlertSource, FiredAlert } from '../../shared/types';
import type { HopData } from '../../shared/types';
import type { TargetStats } from './useLossMonitor';

const COOLDOWN_MS = 30_000; // Don't re-fire the same rule within 30s

export interface UseAlertsReturn {
  rules: AlertRule[];
  recentAlerts: FiredAlert[];
  addRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  checkTrace: (hops: HopData[]) => void;
  checkLoss: (targets: TargetStats[]) => void;
}

export function useAlerts(): UseAlertsReturn {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<FiredAlert[]>([]);
  const lastFiredRef = useRef<Map<string, number>>(new Map());
  const loadedRef = useRef(false);

  // Load saved rules on mount
  useEffect(() => {
    window.mtrApi.loadAlertRules().then((saved) => {
      if (saved && saved.length > 0) {
        setRules(saved);
      }
      loadedRef.current = true;
    });
  }, []);

  // Save rules whenever they change (after initial load)
  useEffect(() => {
    if (loadedRef.current) {
      window.mtrApi.saveAlertRules(rules);
    }
  }, [rules]);

  const fireAlert = useCallback((rule: AlertRule, message: string) => {
    const now = Date.now();
    const lastFired = lastFiredRef.current.get(rule.id) || 0;
    if (now - lastFired < COOLDOWN_MS) return;

    lastFiredRef.current.set(rule.id, now);

    const alert: FiredAlert = {
      id: `${rule.id}-${now}`,
      ruleId: rule.id,
      ruleName: rule.name,
      message,
      timestamp: now,
    };

    setRecentAlerts((prev) => [alert, ...prev].slice(0, 50));
    window.mtrApi.showNotification(`Alert: ${rule.name}`, message);
  }, []);

  const checkTrace = useCallback((hops: HopData[]) => {
    if (hops.length === 0) return;

    for (const rule of rules) {
      if (!rule.enabled || rule.source !== 'trace') continue;

      for (const hop of hops) {
        if (hop.sent === 0) continue;

        let value: number;
        let label: string;

        switch (rule.metric) {
          case 'latency':
            value = hop.avg;
            label = `${hop.avg}ms avg latency`;
            break;
          case 'loss':
            value = hop.lossPercent;
            label = `${hop.lossPercent}% packet loss`;
            break;
          case 'jitter':
            value = hop.jitter;
            label = `${hop.jitter}ms jitter`;
            break;
        }

        if (value > rule.threshold) {
          const hopLabel = hop.hostname !== hop.ip ? hop.hostname : hop.ip;
          fireAlert(rule, `Hop ${hop.hopNumber} (${hopLabel}): ${label} exceeds ${rule.threshold}${rule.metric === 'loss' ? '%' : 'ms'}`);
          break; // One notification per rule per check cycle
        }
      }
    }
  }, [rules, fireAlert]);

  const checkLoss = useCallback((targets: TargetStats[]) => {
    if (targets.length === 0) return;

    for (const rule of rules) {
      if (!rule.enabled || rule.source !== 'loss-monitor') continue;

      for (const t of targets) {
        if (t.sent === 0) continue;

        let value: number;
        let label: string;

        switch (rule.metric) {
          case 'latency':
            value = t.avgRtt;
            label = `${t.avgRtt}ms avg latency`;
            break;
          case 'loss':
            value = t.lossPercent;
            label = `${t.lossPercent}% packet loss`;
            break;
          case 'jitter':
            value = 0; // Loss monitor doesn't track jitter
            label = '';
            break;
        }

        if (value > rule.threshold) {
          fireAlert(rule, `${t.name}: ${label} exceeds ${rule.threshold}${rule.metric === 'loss' ? '%' : 'ms'}`);
          break;
        }
      }
    }
  }, [rules, fireAlert]);

  const addRule = useCallback((rule: Omit<AlertRule, 'id' | 'createdAt'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    };
    setRules((prev) => [...prev, newRule]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    lastFiredRef.current.delete(id);
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    );
  }, []);

  return { rules, recentAlerts, addRule, removeRule, toggleRule, checkTrace, checkLoss };
}
