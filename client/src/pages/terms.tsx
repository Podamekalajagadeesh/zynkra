import { PageShell } from '../components/PageShell';

export function TermsPage() {
  return (
    <PageShell title="Terms of Service" eyebrow="Legal" description="Project-drafted Terms of Service (draft)." compact>
      <div className="prose max-w-none dark:prose-invert">
        <h2>Terms of Service — Zynkra (Draft)</h2>
        <p>These are the project-drafted Terms of Service intended for legal review before launch. For the definitive, counsel-reviewed version, see the repository&apos;s <strong>doc/TERMS.md</strong>.</p>
        <p>Please contact legal@zynkra.example with questions.</p>
      </div>
    </PageShell>
  );
}

export default TermsPage;