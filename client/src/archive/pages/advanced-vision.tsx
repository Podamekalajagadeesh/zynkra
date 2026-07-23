import { Link } from 'react-router-dom';
import { MonitorSmartphone, Tv, Watch, BrainCircuit, ShieldCheck, Coins, ArrowRight } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { DeviceModeRoute } from '../components/DeviceModeRoute';
import { AIConsciousCompanion } from '../components/ai-companion';
import { BlockchainIdentityDashboard } from '../components/blockchain-identity';
import { SocialUBI } from '../components/metaverse/SocialUBI';

const capabilityCards = [
  {
    title: 'Desktop / Electron-ready shell',
    description: 'Keyboard-first workspace layouts, responsive navigation, and desktop-friendly workflows are live.',
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
    description: 'An operational AI companion, neural-aware content tools, and advanced feature demos are now available.',
    icon: BrainCircuit,
    status: 'Live',
    href: '/advanced-features',
  },
  {
    title: 'Blockchain identity and UBI',
    description: 'Self-sovereign identity management and community-powered UBI are connected to real user flows.',
    icon: ShieldCheck,
    status: 'Live',
    href: '/blockchain-identity',
  },
];

export function AdvancedVisionPage() {
  return (
    <PageShell
      eyebrow="Advanced Vision"
      title="Next-generation experiences are now operational"
      description="Desktop, TV, wearable, AI, and self-sovereign identity experiences are available as real product surfaces."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {capabilityCards.map(({ title, description, icon: Icon, status, href }) => (
            <Link
              key={title}
              to={href}
              className="rounded-3xl border border-dark-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-dark-700 dark:bg-dark-800/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="rounded-2xl bg-primary-50 p-2 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {status}
                </span>
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">{description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-300">
                Open experience <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <section className="rounded-3xl border border-dark-200 bg-gradient-to-br from-primary-50 via-white to-cyan-50 p-5 dark:border-dark-700 dark:from-primary-950/30 dark:via-dark-900 dark:to-cyan-950/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Multi-device rollout</h2>
              <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">
                The product now adapts to desktop, TV, tablet, and watch contexts without losing core social workflows.
              </p>
            </div>
            <Link to="/devices" className="inline-flex items-center gap-2 rounded-full bg-dark-950 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-dark-950">
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
                  The AI companion provides guided content planning, adaptive suggestions, and neural-aware interaction patterns.
                </p>
              </div>
              <Link to="/advanced-features" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-300">
                Open advanced features <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5">
              <AIConsciousCompanion />
            </div>
          </section>

          <section className="rounded-3xl border border-dark-200 bg-white/80 p-5 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Blockchain identity and UBI</h2>
                <p className="mt-1 text-sm text-dark-600 dark:text-dark-300">
                  Users can manage self-sovereign identity, import/export identity data, and track social participation rewards.
                </p>
              </div>
              <Link to="/blockchain-identity" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 dark:text-primary-300">
                Open identity hub <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 space-y-5">
              <BlockchainIdentityDashboard />
              <SocialUBI />
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
