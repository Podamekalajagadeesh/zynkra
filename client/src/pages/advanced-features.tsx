import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';

interface AdvancedFeatureStatus {
  supported: boolean;
  enabled: boolean;
  description: string;
}

interface AdvancedFeaturesPayload {
  spaceSatellite: AdvancedFeatureStatus;
  meshSync: AdvancedFeatureStatus;
  eInkReader: AdvancedFeatureStatus;
  inCarIntegration: AdvancedFeatureStatus;
  vrAr: AdvancedFeatureStatus;
  deepfakeDetection: AdvancedFeatureStatus;
  realTimeTranslation: AdvancedFeatureStatus;
}

export function AdvancedFeaturesPage() {
  const [status, setStatus] = useState<AdvancedFeaturesPayload | null>(null);
  const [text, setText] = useState('Hello world');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [translation, setTranslation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, []);

  const loadStatus = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/advanced-features/status`);
    setStatus(response.data);
  };

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/advanced-features/translate`, {
        text,
        targetLanguage,
      });
      setTranslation(response.data.translatedText);
    } finally {
      setLoading(false);
    }
  };

  const featureCards = useMemo(() => {
    if (!status) return [];
    return [
      { key: 'spaceSatellite', label: 'Space/satellite support', feature: status.spaceSatellite },
      { key: 'meshSync', label: 'Mesh network sync', feature: status.meshSync },
      { key: 'eInkReader', label: 'E-ink reader support', feature: status.eInkReader },
      { key: 'inCarIntegration', label: 'In-car integration', feature: status.inCarIntegration },
      { key: 'vrAr', label: 'VR/AR experiences', feature: status.vrAr },
      { key: 'deepfakeDetection', label: 'AI deepfake detection', feature: status.deepfakeDetection },
      { key: 'realTimeTranslation', label: 'Real-time translation', feature: status.realTimeTranslation },
    ];
  }, [status]);

  return (
    <PageShell eyebrow="Built-in platform" title="Advanced features" description="Operational experiences for the next generation of connected spaces.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map(({ key, label, feature }) => (
            <div key={key} className="rounded-2xl border border-dark-200 bg-white/80 p-4 shadow-sm dark:border-dark-700 dark:bg-dark-800/80">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{label}</h3>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${feature.supported && feature.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                  {feature.supported && feature.enabled ? 'Active' : 'Preview'}
                </span>
              </div>
              <p className="mt-2 text-sm text-dark-600 dark:text-dark-300">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-dark-200 bg-gradient-to-br from-primary-50 to-cyan-50 p-5 dark:border-dark-700 dark:from-primary-950/40 dark:to-cyan-950/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Live translation demo</h2>
              <p className="text-sm text-dark-600 dark:text-dark-300">Translate text instantly into another language with the built-in service.</p>
            </div>
            <Button onClick={handleTranslate} isLoading={loading}>Translate</Button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-28 rounded-2xl border border-dark-200 bg-white/80 p-3 text-sm outline-none ring-0 dark:border-dark-700 dark:bg-dark-900/70"
              placeholder="Type text to translate"
            />
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Target language
                <select value={targetLanguage} onChange={(event) => setTargetLanguage(event.target.value)} className="mt-1 w-full rounded-2xl border border-dark-200 bg-white/80 p-3 text-sm dark:border-dark-700 dark:bg-dark-900/70">
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                  <option value="ru">Russian</option>
                </select>
              </label>
              <div className="rounded-2xl border border-dark-200 bg-white/70 p-3 text-sm dark:border-dark-700 dark:bg-dark-900/70">
                <div className="font-medium">Result</div>
                <p className="mt-1 text-dark-700 dark:text-dark-200">{translation || 'Translation will appear here.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
