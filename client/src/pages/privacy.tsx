import { PageShell } from '../components/PageShell';

export function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" eyebrow="Legal" description="Project-drafted Privacy Policy (draft)." compact>
      <div className="prose max-w-none dark:prose-invert">
        <h2>Privacy Policy — Zynkra (Draft)</h2>
        <p>This is the project-drafted Privacy Policy intended for legal review before launch. For the definitive, counsel-reviewed version, see the repository&apos;s <strong>doc/PRIVACY.md</strong>.</p>
        <p>For privacy requests contact privacy@zynkra.example.</p>
      </div>
    </PageShell>
  );
}

export default PrivacyPage;