import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';

interface FeedArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  content: string;
  excerpt: string;
  author: { displayName: string };
  publishedAt: string;
  readingTime: number;
}

function ArticleSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-3/4 rounded bg-current opacity-10" />
      <div className="h-4 w-1/2 rounded bg-current opacity-10" />
      <div className="text-xs opacity-50 mt-1">Loading...</div>
      <div className="space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-4 rounded bg-current opacity-10"
            style={{ width: `${95 - i * 8}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 rounded-lg animate-pulse bg-current opacity-10" />
      ))}
    </div>
  );
}

export function EInkReaderPage() {
  const [articles, setArticles] = useState<FeedArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<FeedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'paper' | 'night'>('paper');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchArticles() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/articles/feed', { params: { page: 1, limit: 50 } });
        if (cancelled) return;
        const list: FeedArticle[] = res.data?.articles ?? res.data ?? [];
        setArticles(list);
        if (list.length > 0) {
          setSelectedArticle(list[0]);
        }
      } catch {
        if (!cancelled) {
          setError('Could not load articles. Please try again later.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchArticles();
    return () => {
      cancelled = true;
    };
  }, []);

  const paragraphs = useMemo(() => {
    if (!selectedArticle?.content) return [];
    return selectedArticle.content.split(/\n\n+/).filter(Boolean);
  }, [selectedArticle]);

  const wrapperClassName = useMemo(() => {
    return theme === 'night'
      ? 'bg-[#111827] text-[#f9fafb]'
      : 'bg-[#f7f3ea] text-[#111827]';
  }, [theme]);

  return (
    <PageShell eyebrow="Advanced mode" title="E-ink reader" description="Low-power reading designed for reflective displays.">
      <div className={`rounded-3xl border border-black/10 p-4 shadow-sm ${wrapperClassName}`}>
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen((v) => !v)}>
              {sidebarOpen ? 'Hide list' : 'Show list'}
            </Button>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.3em] opacity-70">Reading mode</div>
              <div className="text-sm opacity-80">Battery-friendly layout active</div>
            </div>
          </div>
          <Button variant="outline" onClick={() => setTheme(theme === 'paper' ? 'night' : 'paper')}>
            {theme === 'paper' ? 'Switch to night' : 'Switch to paper'}
          </Button>
        </div>

        <div className="flex gap-4">
          {/* Sidebar -- article index */}
          {sidebarOpen && (
            <aside className="w-64 shrink-0 border-r border-current/10 pr-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60 mb-3">
                Articles
              </div>
              {loading ? (
                <SidebarSkeleton />
              ) : articles.length === 0 ? (
                <p className="text-sm opacity-60">No articles available.</p>
              ) : (
                <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {articles.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => setSelectedArticle(a)}
                        className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                          selectedArticle?.id === a.id
                            ? 'bg-current/10 font-semibold'
                            : 'hover:bg-current/5 opacity-80'
                        }`}
                      >
                        <span className="line-clamp-2">{a.title}</span>
                        <span className="block text-xs opacity-50 mt-0.5">
                          {a.readingTime} min read
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          {/* Main reading area */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <ArticleSkeleton />
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-base opacity-70 mb-4">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-base opacity-70">
                  No articles to read right now. Check back later.
                </p>
              </div>
            ) : selectedArticle ? (
              <article className="space-y-4">
                <header className="space-y-1">
                  <h2 className="text-2xl font-semibold">{selectedArticle.title}</h2>
                  <p className="text-sm opacity-75">{selectedArticle.subtitle}</p>
                  <p className="text-xs opacity-50">
                    By {selectedArticle.author.displayName} &middot; {selectedArticle.readingTime} min read
                  </p>
                </header>
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-base leading-8">
                    {p}
                  </p>
                ))}
              </article>
            ) : null}
          </main>
        </div>
      </div>
    </PageShell>
  );
}
