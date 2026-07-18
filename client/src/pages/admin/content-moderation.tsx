import { PageShell } from '../../components/PageShell';
import { ModerationQueue } from '../../components/moderation/ModerationQueue';
import { BiasDetectionDashboard } from '../../components/moderation/BiasDetectionDashboard';
import { CommunityModerationVoting } from '../../components/moderation/CommunityModerationVoting';

export default function ContentModerationPage() {
  return (
    <PageShell title="Content Moderation">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community-Led Content Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Our platform uses decentralized, community-led moderation instead of corporate content moderation teams.
            All members of the community can participate in voting on content that has been flagged for review.
            Review and manage content flagged by our AI system, participate in community votes, and ensure our platform remains a safe space for everyone.
            Includes bias detection to identify and mitigate algorithmic and human bias in social interactions and content feeds.
          </p>
        </div>
        <CommunityModerationVoting />
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Moderation Queue</h2>
          <ModerationQueue />
        </div>
        <BiasDetectionDashboard />
      </div>
    </PageShell>
  );
}