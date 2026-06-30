import { PageShell } from '../../components/PageShell';
import { ModerationQueue } from '../../components/moderation/ModerationQueue';
import { BiasDetectionDashboard } from '../../components/moderation/BiasDetectionDashboard';

export default function ContentModerationPage() {
  return (
    <PageShell title="Content Moderation">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI-Powered Content Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage content flagged by our AI system for misinformation or harmful content.
            Our automated detection system analyzes all posts, comments, and messages to keep our community safe.
            Includes bias detection to identify and mitigate algorithmic and human bias in social interactions and content feeds.
          </p>
        </div>
        <ModerationQueue />
        <BiasDetectionDashboard />
      </div>
    </PageShell>
  );
}