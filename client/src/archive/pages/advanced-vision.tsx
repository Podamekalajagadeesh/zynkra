import { Link } from 'react-router-dom';
import { MonitorSmartphone, Tv, BrainCircuit, ShieldCheck, ArrowRight } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { DeviceModeRoute } from '../components/DeviceModeRoute';
import { AIConsciousCompanion } from '../components/ai-companion';

const capabilityCards: {
  title: string;
  description: string;
  icon: typeof MonitorSmartphone;
  status: 'Live' | 'Archived';
  href?: string;
}[] = [
  {
    title: 'Desktop / Electron-ready shell',
    description:
      'Keyboard-first workspace layouts, responsive navigation, and desktop-friendly workflows are live.',
    icon: MonitorSmartphone,
    status: 'Live',
    href: '/devices',
  },
  {
    title: 'Smart TV and smartwatch modes',
    description: 'Device-aware presentation layers adapt to large-screen and glanceable contexts.',
    icon: Tv,
    status: 'Live',
    href: '/devices',
  },
  {
    title: 'AI and neural systems',
    description:
      'An operational AI companion, neural-aware content tools, and advanced feature demos are now available.',
    icon: BrainCircuit,
    status: 'Live',
    href: '/advanced-features',
  },
  {
    title: 'Blockchain identity and UBI',
    description:
      'Cut from the product surface (ROADMAP.md §2/§6). Self-sovereign identity and UBI are not built — no on-chain identity, DAO, or token system exists.',
    icon: ShieldCheck,
    status: 'Archived',
  },
];

export function AdvancedVisionPage() {
  return (
    <PageShell
      eyebrow="Advanced Vision"
      title="Desktop, TV, wearable, and AI experiences"
      description="Desktop, TV, wearable, and AI experiences are available as real product surfaces. Self-sovereign identity and UBI have been cut."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilityCards.map(({ title, description, icon: Icon, status, href }) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-2xl bg-primary-50 p-2 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={
                      status === 'Live'
                        ? 'rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'rounded-full bg-dark-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-dark-600 dark:bg-dark-700 dark:text-dark-300'
                    }
                  >
                    {status}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">{description}</p>
                {href && (
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-300">
                    Open experience <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </>
            );

            return href ? (
              <Link
                key={title}
                to={href}
                className="rounded-3xl border border-dark-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-dark-700 dark:bg-dark-800/80"
              >
                {body}
              </Link>
            ) : (
              <div
                key={title}
                className="rounded-3xl border border-dashed border-dark-300 bg-dark-50/60 p-4 opacity-80 dark:border-dark-600 dark:bg-dark-900/40"
              >
                {body}
              </div>
            );
          })}
        </div>

        <section className="rounded-3xl border border-dark-200 bg-gradient-to-br from-primary-50 via-white to-cyan-50 p-5 dark:border-dark-700 dark:from-primary-950/30 dark:via-dark-900 dark:to-cyan-950/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Multi-device rollout</h2>
              <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">
                The product now adapts to desktop, TV, tablet, and watch contexts without losing
                core social workflows.
              </p>
            </div>
            <Link
              to="/devices"
              className="inline-flex items-center gap-2 rounded-full bg-dark-950 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-dark-950"
            >
              View device modes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5">
            <DeviceModeRoute />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-dark-200 bg-white/80 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">AI and neural production rollout</h2>
                <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">
                  The AI companion provides guided content planning, adaptive suggestions, and
                  neural-aware interaction patterns.
                </p>
              </div>
              <Link
                to="/advanced-features"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-300"
              >
                Open advanced features <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5">
              <AIConsciousCompanion />
            </div>
          </section>

          <section className="rounded-3xl border border-dashed border-dark-300 bg-dark-50/60 p-5 opacity-80 dark:border-dark-600 dark:bg-dark-900/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">
                  Blockchain identity and UBI{' '}
                  <span className="text-sm font-medium text-dark-500">— Archived</span>
                </h2>
                <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">
                  Cut from the product surface per ROADMAP.md §2/§6. Self-sovereign identity and UBI
                  are not built. Wallet-sign authentication (SIWE) is the only identity system that
                  actually works today.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
