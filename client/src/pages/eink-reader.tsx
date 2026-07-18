import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';

interface ReaderArticle {
  title: string;
  subtitle: string;
  body: string[];
}

export function EInkReaderPage() {
  const [article, setArticle] = useState<ReaderArticle | null>(null);
  const [theme, setTheme] = useState<'paper' | 'night'>('paper');

  useEffect(() => {
    setArticle({
      title: 'Reading mode for low-power devices',
      subtitle: 'A calm, paper-like experience designed for e-ink displays and long reading sessions.',
      body: [
        'This experience disables heavy motion, lowers contrast churn, and favors simple typography so the interface stays readable and power efficient.',
        'The reader automatically uses a high-contrast, grayscale palette and avoids background animations that would shorten battery life on e-ink hardware.',
        'It is ideal for long-form articles, saved posts, and documentation when you want focus instead of distraction.',
      ],
    });
  }, []);

  const wrapperClassName = useMemo(() => {
    return theme === 'night'
      ? 'bg-[#111827] text-[#f9fafb]'
      : 'bg-[#f7f3ea] text-[#111827]';
  }, [theme]);

  return (
    <PageShell eyebrow="Advanced mode" title="E-ink reader" description="Low-power reading designed for reflective displays.">
      <div className={`rounded-3xl border border-black/10 p-4 shadow-sm ${wrapperClassName}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">Reading mode</div>
            <div className="text-sm opacity-80">Battery-friendly layout active</div>
          </div>
          <Button variant="outline" onClick={() => setTheme(theme === 'paper' ? 'night' : 'paper')}>
            {theme === 'paper' ? 'Switch to night' : 'Switch to paper'}
          </Button>
        </div>

        {article ? (
          <article className="space-y-4">
            <header className="space-y-1">
              <h2 className="text-2xl font-semibold">{article.title}</h2>
              <p className="text-sm opacity-75">{article.subtitle}</p>
            </header>
            {article.body.map((paragraph) => (
              <p key={paragraph} className="text-base leading-8">
                {paragraph}
              </p>
            ))}
          </article>
        ) : (
          <p className="text-sm opacity-70">Loading reading experience…</p>
        )}
      </div>
    </PageShell>
  );
}
