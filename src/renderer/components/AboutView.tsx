import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type UpdateStatus = 'idle' | 'checking' | 'available' | 'up-to-date' | 'downloading' | 'downloaded' | 'error';

export default function AboutView() {
  const [version, setVersion] = useState('');
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [updateError, setUpdateError] = useState('');

  const processVersions = window.mtrApi.getProcessVersions();

  useEffect(() => {
    window.mtrApi.getVersion().then(setVersion);

    const unsub1 = window.mtrApi.onUpdaterStatus((status: string) => {
      if (status === 'available') setUpdateStatus('available');
      else if (status === 'up-to-date') setUpdateStatus('up-to-date');
      else if (status === 'checking') setUpdateStatus('checking');
      else if (status === 'downloaded') setUpdateStatus('downloaded');
      else if (status === 'error') setUpdateStatus('error');
    });

    const unsub2 = window.mtrApi.onUpdaterProgress((percent: number) => {
      setUpdateStatus('downloading');
      setDownloadPercent(Math.round(percent));
    });

    const unsub3 = window.mtrApi.onUpdaterError((message: string) => {
      setUpdateError(message);
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const handleCheckUpdate = () => {
    setUpdateStatus('checking');
    setUpdateError('');
    window.mtrApi.checkForUpdates();
  };

  const handleDownload = () => {
    setUpdateStatus('downloading');
    setDownloadPercent(0);
    window.mtrApi.downloadUpdate();
  };

  const handleInstall = () => {
    window.mtrApi.installUpdate();
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* App icon and name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/[0.08] mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="url(#about-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="about-grad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle cx="5" cy="6" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="18" r="2" />
              <line x1="6.7" y1="7.3" x2="10.3" y2="10.7" />
              <line x1="13.7" y1="13.3" x2="17.3" y2="16.7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Modern MTR</h1>
          <p className="text-white/40 text-sm font-mono">v{version}</p>
        </div>

        {/* Info card */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-4">
          <p className="text-white/50 text-sm leading-relaxed">
            A modern network diagnostic tool for tracing routes, monitoring latency, and detecting packet loss across global endpoints.
          </p>
        </div>

        {/* Update section */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm font-medium">Updates</span>
            <StatusBadge status={updateStatus} />
          </div>

          {updateStatus === 'error' && updateError && (
            <p className="text-red-400/70 text-xs mb-3 break-all">{updateError}</p>
          )}

          {updateStatus === 'downloading' && (
            <div className="mb-3">
              <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-white/30 text-xs mt-1 text-right">{downloadPercent}%</p>
            </div>
          )}

          <div className="flex gap-2">
            {(updateStatus === 'idle' || updateStatus === 'up-to-date' || updateStatus === 'error') && (
              <button
                onClick={handleCheckUpdate}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors"
              >
                Check for Updates
              </button>
            )}
            {updateStatus === 'available' && (
              <button
                onClick={handleDownload}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
              >
                Download Update
              </button>
            )}
            {updateStatus === 'downloaded' && (
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 text-sm rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
              >
                Restart &amp; Install
              </button>
            )}
          </div>
        </div>

        {/* Links */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <div className="flex flex-col gap-2">
            <InfoRow label="Author" value="Dave" />
            <InfoRow label="License" value="MIT" />
            <InfoRow label="Electron" value={processVersions.electron} />
            <InfoRow label="Chrome" value={processVersions.chrome} />
            <InfoRow label="Node" value={processVersions.node} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    idle: { label: 'Not checked', color: 'text-white/30' },
    checking: { label: 'Checking...', color: 'text-yellow-400' },
    available: { label: 'Update available', color: 'text-cyan-400' },
    'up-to-date': { label: 'Up to date', color: 'text-emerald-400' },
    downloading: { label: 'Downloading...', color: 'text-cyan-400' },
    downloaded: { label: 'Ready to install', color: 'text-emerald-400' },
    error: { label: 'Check failed', color: 'text-red-400' },
  };
  const { label, color } = config[status] || config.idle;

  return (
    <span className={`text-xs font-medium ${color}`}>{label}</span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white/60 text-sm font-mono">{value}</span>
    </div>
  );
}
