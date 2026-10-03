import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import {
  announceFederatedPost,
  getFederatedTimeline,
  getFederationStats,
  likeFederatedPost,
  unlikeFederatedPost,
  undoAnnounceFederatedPost,
  type FederatedTimelineItem,
  type FederationReport,
  type FederationStats,
} from '../lib/api';
import { getAuthToken } from '../lib/auth-storage';
import { AlertTriangle, Globe, Heart, Info, Repeat2, Server, Users } from 'lucide-react';

export type Intent = 'like' | 'unlike' | 'boost' | 'unboost';

/** Must match the `limit` requested from `GET /federation/timeline`. */
const PAGE_SIZE = 20;

export interface FederationOutcome {
  /**
   * Whether the interaction is now in the state the user asked for.
   *
   * This is deliberately **not** `delivered > 0`. Two `skipped` outcomes also
   * leave the world in the requested state — "already federated a Like" when
   * liking, "never federated" when unliking — and reporting those as failures
   * would make a correct interaction look broken.
   */
  applied: boolean;
  /** A short human-readable note, or null when there is nothing worth saying. */
  notice: string | null;
}

/**
 * Turn a `FederationReport` into what the UI is allowed to claim.
 *
 * The whole point of this function is that the button state must be driven by
 * what the server actually did. An optimistic toggle here would tell a user
 * their like reached a remote server during an outage, which is precisely the
 * class of dishonesty this project is trying to avoid.
 */
export function interpretReport(
  report: FederationReport | null,
  intent: Intent,
): FederationOutcome {
  if (!report) {
    return { applied: false, notice: 'The request failed before the server answered.' };
  }

  if (report.delivered > 0) {
    return { applied: true, notice: null };
  }

  const reason = report.reason ?? '';
  const already = /already federated/i.test(reason);
  const nothingToUndo = /never federated|nothing to undo/i.test(reason);

  if (report.skipped) {
    if ((intent === 'like' || intent === 'boost') && already) {
      return { applied: true, notice: 'Already sent to the remote server.' };
    }
    if ((intent === 'unlike' || intent === 'unboost') && nothingToUndo) {
      return { applied: true, notice: 'Nothing had been federated, so there was nothing to undo.' };
    }
    return { applied: false, notice: reason || 'The server chose not to send this.' };
  }

  // Attempted and failed. The per-instance reason is the useful part — a
  // blocked instance and a 401 signature rejection need different responses.
  const failure = report.results.find((result) => !result.delivered)?.reason;
  return {
    applied: false,
    notice: failure || reason || 'The remote instance did not accept it.',
  };
}

const formatDate = (value?: string) => {
  if (!value) return 'Unknown time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

interface InteractionState {
  liked?: boolean;
  boosted?: boolean;
  busy?: boolean;
  notice?: string | null;
}

export default function FederationPage() {
  const [items, setItems] = useState<FederatedTimelineItem[]>([]);
  const [stats, setStats] = useState<FederationStats | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [includeMuted, setIncludeMuted] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [interactions, setInteractions] = useState<Record<string, InteractionState>>({});

  // Read once per render pass; the page stays usable signed out (the timeline is
  // public) but the actions are not, and pretending otherwise would produce a
  // 401 on every tap.
  const canInteract = useMemo(() => Boolean(getAuthToken()), []);

  const load = useCallback(
    async (offset: number) => {
      const result = await getFederatedTimeline({ limit: PAGE_SIZE, offset, includeMuted });
      setTotal(result.total ?? 0);
      setHasMore(Boolean(result.hasMore));
      setItems((previous) => (offset === 0 ? result.items ?? [] : [...previous, ...(result.items ?? [])]));
      /**
       * Advance by the **page size**, not by `items.length`.
       *
       * The server pages with `skip(offset).take(limit)` over the unfiltered
       * query and then drops blocked/muted rows, so a page can return fewer
       * items than it consumed. Deriving the next offset from the number of
       * *visible* items re-reads rows that were already fetched and eventually
       * serves a post twice. `result.limit` is the clamped page size the server
       * actually used.
       */
      setNextOffset(offset + (result.limit ?? PAGE_SIZE));
    },
    [includeMuted],
  );

  useEffect(() => {
    let cancelled = false;

    const loadTimeline = async () => {
      setLoading(true);
      setTimelineError(null);
      try {
        await load(0);
      } catch (error) {
        console.error('Failed to load the federated timeline', error);
        // Rendered, not just logged. The de-routed community pages swallowed
        // their fetch failures into console.error, which made "the server
        // errored" indistinguishable from "you have nothing here" — the exact
        // failure this project has been cleaning up.
        setTimelineError('Could not reach the federation service. This is not the same as an empty timeline.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadStats = async () => {
      try {
        const result = await getFederationStats();
        if (!cancelled) setStats(result);
      } catch (error) {
        console.error('Failed to load federation stats', error);
        if (!cancelled) setStatsError('Instance federation details are unavailable.');
      }
    };

    loadTimeline();
    loadStats();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await load(nextOffset);
    } catch (error) {
      console.error('Failed to load more federated posts', error);
      setTimelineError('Could not load more remote posts.');
    } finally {
      setLoadingMore(false);
    }
  };

  const runAction = async (
    activityId: string,
    intent: Intent,
    call: (id: string) => Promise<FederationReport>,
  ) => {
    if (!canInteract) return;

    setInteractions((previous) => ({ ...previous, [activityId]: { ...previous[activityId], busy: true, notice: null } }));
    try {
      const report = await call(activityId);
      const outcome = interpretReport(report, intent);
      setInteractions((previous) => {
        const before = previous[activityId] ?? {};
        // A retraction only clears the toggle when the server confirmed it (or
        // confirmed there was nothing to retract). Clearing it on a *failed*
        // unlike would show the user an unliked button while their like is
        // still sitting on someone else's server.
        const liked =
          intent === 'like'
            ? outcome.applied
            : intent === 'unlike'
              ? outcome.applied
                ? false
                : before.liked
              : before.liked;
        const boosted =
          intent === 'boost'
            ? outcome.applied
            : intent === 'unboost'
              ? outcome.applied
                ? false
                : before.boosted
              : before.boosted;
        return {
          ...previous,
          [activityId]: { ...before, busy: false, liked, boosted, notice: outcome.notice },
        };
      });
    } catch (error) {
      console.error(`Federation action ${intent} failed`, error);
      setInteractions((previous) => ({
        ...previous,
        [activityId]: {
          ...previous[activityId],
          busy: false,
          // The state is untouched on a hard failure: we have no evidence the
          // request reached the server at all.
          notice: 'The request failed before the server answered.',
        },
      }));
    }
  };

  return (
    <PageShell
      eyebrow="Federation"
      title="Federated timeline"
      description="Posts that reached this instance from other ActivityPub servers. Remote content is stored separately from local posts, so a remote id is a URL and is never interchangeable with a local post id."
      action={
        <Button variant="secondary" onClick={() => load(0).catch(() => setTimelineError('Could not refresh the timeline.'))}>
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {stats && !stats.federationEnabled ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Outbound federation is disabled on this instance.</p>
              <p className="mt-1">
                The server is running with <code>FEDERATION_ENABLED=false</code>. Reading this timeline still
                works, but liking or boosting a remote post will not reach the other server until an
                operator enables it. Delivery to a live Mastodon instance has not been verified either.
              </p>
            </div>
          </div>
        ) : null}

        {statsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {statsError}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={<Server size={18} />}
            label="Connected instances"
            value={stats ? String(stats.activeInstances) : '—'}
          />
          <StatCard icon={<Users size={18} />} label="Remote actors" value={stats ? String(stats.totalRemoteUsers) : '—'} />
          <StatCard icon={<Globe size={18} />} label="Remote posts" value={stats ? String(stats.totalRemotePosts) : '—'} />
          <StatCard icon={<Info size={18} />} label="This instance" value={stats ? stats.localDomain : '—'} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
            <input
              type="checkbox"
              checked={includeMuted}
              onChange={(event) => setIncludeMuted(event.target.checked)}
              className="h-4 w-4 rounded border-dark-300 text-primary-600"
            />
            Include muted accounts
          </label>
          {canInteract ? null : (
            <p className="text-sm text-dark-600 dark:text-dark-300">
              <Link to="/login" className="font-medium text-primary-600 underline dark:text-primary-300">
                Sign in
              </Link>{' '}
              to like or boost remote posts.
            </p>
          )}
        </div>

        {/*
          Only when there is still content on screen. A failure that cleared the
          list is reported by the branch below instead, so the user sees one
          clear statement rather than two overlapping ones.
        */}
        {timelineError && items.length > 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {timelineError}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-dashed border-dark-200 p-6 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300">
            Loading the federated timeline...
          </div>
        ) : /*
          The error and the empty state are mutually exclusive on purpose. An
          outage that renders both "could not reach the service" and "no remote
          posts have reached this instance yet" is the same lie the de-routed
          community pages told: two very different situations shown as one list.
          A *stats* failure is separate and does not blank the feed.
        */ timelineError && items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-red-300 p-6 text-sm text-red-700 dark:border-red-900/60 dark:text-red-200">
            The federated timeline could not be loaded, so its contents are unknown.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-dark-200 p-6 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300">
            No remote posts have reached this instance yet. This fills up when a server on another instance
            follows a local account, or when a remote account follows you.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <RemotePostCard
                key={item.id}
                item={item}
                state={interactions[item.id] ?? {}}
                canInteract={canInteract}
                onLike={() => runAction(item.id, 'like', likeFederatedPost)}
                onUnlike={() => runAction(item.id, 'unlike', unlikeFederatedPost)}
                onBoost={() => runAction(item.id, 'boost', announceFederatedPost)}
                onUnboost={() => runAction(item.id, 'unboost', undoAnnounceFederatedPost)}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 text-sm text-dark-500 dark:text-dark-400">
          <span>
            Showing {items.length} of {total} remote {total === 1 ? 'post' : 'posts'}
          </span>
          {hasMore ? (
            <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading...' : 'Load more'}
            </Button>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}

function RemotePostCard({
  item,
  state,
  canInteract,
  onLike,
  onUnlike,
  onBoost,
  onUnboost,
}: {
  item: FederatedTimelineItem;
  state: InteractionState;
  canInteract: boolean;
  onLike: () => void;
  onUnlike: () => void;
  onBoost: () => void;
  onUnboost: () => void;
}) {
  const displayName = item.author?.name || item.author?.username || 'Unknown account';

  return (
    <article className="rounded-2xl border border-dark-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
      <div className="flex items-start gap-3">
        {item.author?.avatarUrl ? (
          <img
            src={item.author.avatarUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
            <Users size={18} className="text-gray-500" aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-dark-900 dark:text-white">{displayName}</span>
            {item.author?.username ? (
              <span className="text-sm text-dark-500 dark:text-dark-400">@{item.author.username}</span>
            ) : null}
            {item.instance?.domain ? (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                {item.instance.software || item.instance.domain}
              </span>
            ) : null}
            <span className="text-xs text-dark-500 dark:text-dark-400">{formatDate(item.publishedAt)}</span>
          </div>

          <p className="whitespace-pre-wrap text-dark-900 dark:text-dark-100">{item.content}</p>

          {/*
            Attachments are rendered as links, never as auto-loading <img>.
            Fetching a remote media URL from a third-party server hands that
            server this user's IP and user-agent on every render, and its bytes
            are arbitrary — a tracking pixel and a payload look identical here.
            Avatars are loaded because a social feed without them is unusable.
          */}
          {item.mediaUrls?.length ? (
            <ul className="space-y-1 text-sm">
              {item.mediaUrls.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-primary-600 underline dark:text-primary-300"
                  >
                    <Globe size={12} aria-hidden="true" />
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {item.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs font-medium text-primary-600 dark:text-primary-300">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm">
            <Button
              variant={state.liked ? 'primary' : 'ghost'}
              size="sm"
              disabled={!canInteract || state.busy}
              onClick={state.liked ? onUnlike : onLike}
              aria-pressed={Boolean(state.liked)}
            >
              <Heart size={14} aria-hidden="true" />
              <span>{state.liked ? 'Liked' : 'Like'}</span>
              {item.likeCount ? <span className="ml-1 opacity-70">{item.likeCount}</span> : null}
            </Button>

            <Button
              variant={state.boosted ? 'primary' : 'ghost'}
              size="sm"
              disabled={!canInteract || state.busy}
              onClick={state.boosted ? onUnboost : onBoost}
              aria-pressed={Boolean(state.boosted)}
            >
              <Repeat2 size={14} aria-hidden="true" />
              <span>{state.boosted ? 'Boosted' : 'Boost'}</span>
              {item.shareCount ? <span className="ml-1 opacity-70">{item.shareCount}</span> : null}
            </Button>

            {item.inReplyToId ? (
              <span className="text-xs text-dark-500 dark:text-dark-400">a reply</span>
            ) : null}
          </div>

          {/*
            Only ever populated from a real server response. A failure says so
            instead of leaving the button looking successful.
          */}
          {state.notice ? (
            <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
              {state.notice}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-dark-200 bg-white p-4 shadow-sm dark:border-dark-700 dark:bg-dark-900/70">
      <div className="mb-3 inline-flex rounded-xl bg-primary-50 p-2 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
        {icon}
      </div>
      <p className="text-sm text-dark-500 dark:text-dark-400">{label}</p>
      <p className="mt-2 truncate text-xl font-semibold text-dark-900 dark:text-white">{value}</p>
    </div>
  );
}
