import { useEffect, useState } from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2, Code2, FileJson, FileText, LockKeyhole, RefreshCw, Server } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { getDocumentationCatalog, type DocumentationCatalog, type DocumentationResource } from '../lib/api';

const resourceIcons = {
  html: Code2,
  json: FileJson,
  markdown: FileText,
} as const;

function ResourceCard({ resource }: { resource: DocumentationResource }) {
  const Icon = resourceIcons[resource.format];
  const href = resource.url.startsWith('/') ? resource.url : `/${resource.url}`;

  return (
    <a
      href={href}
      target={resource.url === '/docs' || resource.url === '/graphql' ? '_blank' : undefined}
      rel={resource.url === '/docs' || resource.url === '/graphql' ? 'noreferrer' : undefined}
      className="group flex h-full flex-col rounded-2xl border border-dark-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-dark-700 dark:bg-dark-900"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-xl bg-primary-50 p-2.5 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300"><Icon size={20} /></span>
        <ArrowUpRight size={18} className="text-dark-400 transition group-hover:text-primary-600" />
      </div>
      <h2 className="mt-5 text-lg font-semibold">{resource.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 text-dark-600 dark:text-dark-300">{resource.description}</p>
      <div className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-dark-500">
        {resource.access === 'authenticated' ? <LockKeyhole size={14} /> : <CheckCircle2 size={14} className="text-green-600" />}
        {resource.access} · {resource.format}
      </div>
    </a>
  );
}

export default function DocumentationPage() {
  const [catalog, setCatalog] = useState<DocumentationCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadCatalog = async () => {
    setLoading(true);
    setError(false);
    try {
      setCatalog(await getDocumentationCatalog());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCatalog(); }, []);

  return (
    <PageShell
      eyebrow="Developer resources"
      title="Documentation"
      description="Live references and operational guides for building with Zynkra."
      action={<a href="/docs" target="_blank" rel="noreferrer"><Button icon={<BookOpen size={16} />}>Open API reference</Button></a>}
    >
      {loading ? <div className="flex items-center gap-3 py-8 text-dark-500"><RefreshCw className="animate-spin" size={18} />Loading documentation catalog...</div> : error ? (
        <div className="space-y-4 py-8 text-center"><Server className="mx-auto text-red-600" size={28} /><p>We could not load the live documentation catalog.</p><Button variant="outline" onClick={loadCatalog} icon={<RefreshCw size={15} />}>Try again</Button></div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-200 pb-5 dark:border-dark-700">
            <p className="text-sm text-dark-600 dark:text-dark-300">{catalog!.description}</p>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-dark-500">API v{catalog!.version}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog!.resources.map((resource) => <ResourceCard key={resource.url} resource={resource} />)}
          </div>
        </div>
      )}
    </PageShell>
  );
}