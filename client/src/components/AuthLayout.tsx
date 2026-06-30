import React from 'react';
import { ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, className }) => {
  return (
    <div className={twMerge('relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8', className)}>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(39,192,255,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.14),_transparent_28%),linear-gradient(180deg,_#f8fcff_0%,_#eef6fb_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(39,192,255,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.16),_transparent_28%),linear-gradient(180deg,_#0b1220_0%,_#111827_100%)]" />
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="surface relative hidden overflow-hidden p-8 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(17,24,39,0.88)),radial-gradient(circle_at_top_right,rgba(39,192,255,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(124,58,237,0.2),transparent_24%)]" />
          <div className="relative z-10 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
            <Zap size={18} className="text-primary-300" />
            Zynkra
          </div>
          <div className="relative z-10 max-w-lg space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
              <Sparkles size={14} />
              Premium social identity layer
            </p>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-white xl:text-5xl">
                {title}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 sm:text-base">
                {subtitle || 'Fast sign in, passkeys, wallets, and a social experience built to feel deliberate on every screen.'}
              </p>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4 text-sm text-white/75">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
              <ShieldCheck className="mb-2 text-primary-300" size={18} />
              Passkey-first security
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
              <Zap className="mb-2 text-accent-300" size={18} />
              Wallet and social auth
            </div>
          </div>
        </div>

        <div className="surface w-full p-5 sm:p-8 lg:p-10">
          <div className="mb-8 space-y-3 lg:hidden">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:border-primary-900/60 dark:bg-primary-950/50 dark:text-primary-300">
              Zynkra
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-dark-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm leading-6 text-dark-600 dark:text-dark-300">
              {subtitle || 'A premium identity and social experience.'}
            </p>
          </div>
          <div className="mx-auto w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};