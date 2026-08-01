import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useToast } from '../../hooks/useToast';
import { analyzeSentimentText } from '../../lib/api';

type SentimentResult = Awaited<ReturnType<typeof analyzeSentimentText>>;

const EMOTION_LABELS: Array<{ key: keyof NonNullable<SentimentResult['emotions']>; label: string }> = [
  { key: 'joy', label: 'Joy' },
  { key: 'sadness', label: 'Sadness' },
  { key: 'anger', label: 'Anger' },
  { key: 'fear', label: 'Fear' },
  { key: 'surprise', label: 'Surprise' },
];

const SENTIMENT_STYLES: Record<SentimentResult['sentiment'], { label: string; className: string }> = {
  positive: { label: 'Positive', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  neutral: { label: 'Neutral', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  negative: { label: 'Negative', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export function SentimentAnalyzer() {
  const { addToast } = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      setResult(await analyzeSentimentText(text));
    } catch (error) {
      setResult(null);
      addToast('Sentiment analysis failed', 'error');
      console.error('Sentiment analysis failed', error);
    } finally {
      setLoading(false);
    }
  };

  const style = result ? SENTIMENT_STYLES[result.sentiment] : null;
  const emotions = result?.emotions ?? {};

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Sentiment Analysis</h2>
        <p className="text-sm text-gray-500">
          Analyze the emotional tone of any text. Runs a lexicon-based classifier with sarcasm and
          negation handling.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={4}
          placeholder="Paste a comment, post, or any text to analyze…"
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{text.trim().length} characters</span>
          <Button onClick={runAnalysis} disabled={!text.trim() || loading}>
            {loading ? 'Analyzing…' : 'Analyze'}
          </Button>
        </div>
      </Card>

      {result && style && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Result</h3>
            <Badge className={style.className}>{style.label}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sentiment score</span>
              <span>{result.score.toFixed(2)}</span>
            </div>
            <Progress value={Math.round(((result.score + 1) / 2) * 100)} />
            <p className="text-xs text-gray-500">Range: −1 (negative) to +1 (positive)</p>
          </div>

          <div className="flex justify-between text-sm">
            <span>Confidence</span>
            <span>{Math.round(result.confidence * 100)}%</span>
          </div>

          {EMOTION_LABELS.some(({ key }) => emotions[key] !== undefined) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Emotions</h4>
              {EMOTION_LABELS.map(({ key, label }) => {
                const value = emotions[key];
                if (value === undefined) return null;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{label}</span>
                      <span>{Math.round(value * 100)}%</span>
                    </div>
                    <Progress value={value * 100} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
