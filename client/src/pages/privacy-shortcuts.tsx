
import { PageShell } from '../components/PageShell';
import { PrivacyShortcutsSettings } from '../components/settings/privacy-shortcuts-settings';

export default function PrivacyShortcutsPage() {
  return (
    <PageShell
      title="Privacy Shortcuts"
      description="A simplified view of your most important privacy settings."
    >
      <PrivacyShortcutsSettings />
    </PageShell>
  );
}