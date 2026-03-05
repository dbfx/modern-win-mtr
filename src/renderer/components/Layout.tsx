import React from 'react';
import { motion } from 'framer-motion';

interface LayoutProps {
  activeView: 'trace' | 'map' | 'loss';
  onViewChange: (view: 'trace' | 'map' | 'loss') => void;
  children: React.ReactNode;
}

export default function Layout({ activeView, onViewChange, children }: LayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Title bar drag region */}
      <div className="drag-region h-9 flex-shrink-0 flex items-center px-4">
        <span className="no-drag text-xs font-semibold tracking-wider text-white/30 uppercase">
          MTR
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <nav className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-2 border-r border-white/[0.06]">
          <SidebarButton
            active={activeView === 'trace'}
            onClick={() => onViewChange('trace')}
            title="Trace"
          >
            <TraceSvg />
          </SidebarButton>

          <SidebarButton
            active={activeView === 'map'}
            onClick={() => onViewChange('map')}
            title="Map"
          >
            <GlobeSvg />
          </SidebarButton>

          <SidebarButton
            active={activeView === 'loss'}
            onClick={() => onViewChange('loss')}
            title="Packet Loss"
          >
            <SignalSvg />
          </SidebarButton>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      className={`no-drag relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
        active
          ? 'bg-white/10 text-cyan-400'
          : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'
      }`}
      onClick={onClick}
      title={title}
      whileTap={{ scale: 0.92 }}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-white/10 border border-white/[0.08]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

function TraceSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="18" r="2" />
      <line x1="6.7" y1="7.3" x2="10.3" y2="10.7" />
      <line x1="13.7" y1="13.3" x2="17.3" y2="16.7" />
    </svg>
  );
}

function GlobeSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function SignalSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="14" width="3" height="6" rx="1" />
      <rect x="10" y="10" width="3" height="10" rx="1" />
      <rect x="16" y="6" width="3" height="14" rx="1" />
    </svg>
  );
}
