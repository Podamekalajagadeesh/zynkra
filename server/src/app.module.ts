import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { HttpThrottlerGuard } from './common/http-throttler.guard';
import { envValidationSchema } from './common/env.validation';
import { NonprofitsModule } from './nonprofits/nonprofits.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { InfrastructureController } from './infrastructure/infrastructure.controller';
import { AuthModule } from './auth/auth.module';
import { InviteCodesModule } from './invite-codes/invite-codes.module';
import { UsersModule } from './users/users.module';
import { SiweModule } from './siwe/siwe.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { DmsModule } from './dms/dms.module';
import { UploadsModule } from './uploads/uploads.module';
import { StoriesModule } from './stories/stories.module';
import { FeedModule } from './feed/feed.module';
import { VisibilityModule } from './common/visibility/visibility.module';
import { GroupsModule } from './groups/groups.module';
import { SnoozeModule } from './snooze/snooze.module';
import { CollectionsModule } from './collections/collections.module';
import { WalletModule } from './wallet/wallet.module';
import { TippingModule } from './tipping/tipping.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReputationModule } from './reputation/reputation.module';
import { StorageModule } from './storage/storage.module';
import { TokenModule } from './token/token.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { SearchModule } from './search/search.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { TrendsModule } from './trends/trends.module';
import { MentionsModule } from './mentions/mentions.module';
import { TagsModule } from './tags/tags.module';
import { UserInterestsModule } from './user-interests/user-interests.module';
import { HashtagsModule } from './hashtags/hashtags.module';
import { PollsModule } from './polls/polls.module';
import { EventsModule } from './events/events.module';
import { SponsoredPostsModule } from './sponsored-posts/sponsored-posts.module';
import { MediaModule } from './media/media.module';
import { MonetizationModule } from './monetization/monetization.module';
import { NotesModule } from './notes/notes.module';
import { ReelsModule } from './reels/reels.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { OpenSourceModule } from './opensource/opensource.module';
import { PaymentsModule } from './payments/payments.module';
import { StickersModule } from './stickers/stickers.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { MemoriesModule } from './memories/memories.module';
import { FundraisersModule } from './fundraisers/fundraisers.module';
import { PagesModule } from './pages/pages.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { BrandCollabsModule } from './brand-collabs/brand-collabs.module';

import { ReactionsModule } from './reactions/reactions.module';
import { SavedMarketplaceListingsModule } from './saved-marketplace-listings/saved-marketplace-listings.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { VerificationModule } from './verification/verification.module';
import { DatingModule } from './dating/dating.module';
import { CryptoModule } from './crypto/crypto.module';
import { KeysModule } from './keys/keys.module';
import { TimelineModule } from './timeline/timeline.module';
import { TimelineReviewModule } from './timeline-review/timeline-review.module';
import { ProfileReviewModule } from './tags/profile-review.module';
import { FormsModule } from './forms/forms.module';
import { LiveKitModule } from './livekit/livekit.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { SnapMapModule } from './snapmap/snapmap.module';
import { LiveshoppingModule } from './liveshopping/liveshopping.module';
import { DataExportModule } from './data-export/data-export.module';
import { ActivityModule } from './activity/activity.module';
import { FederationModule } from './federation/federation.module';
import { ModerationModule } from './moderation/moderation.module';
import { ArticlesModule } from './articles/articles.module';
import { PodcastsModule } from './podcasts/podcasts.module';
import { CoursesModule } from './courses/courses.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { TranslationModule } from './translation/translation.module';
import { AdvancedFeaturesModule } from './advanced-features/advanced-features.module';
import { ConnectedAccountsModule } from './connected-accounts/connected-accounts.module';
import { CustomAudiencesModule } from './custom-audiences/custom-audiences.module';
import { SyncModule } from './sync/sync.module';
import { AiContentModule } from './ai/ai-content.module';
import { ThreadsModule } from './threads/threads.module';
import { ScheduledPostsModule } from './scheduled-posts/scheduled-posts.module';
import { LinkPreviewsModule } from './link-previews/link-previews.module';
import { GifsModule } from './gifs/gifs.module';
import { DigitalAssetsModule } from './digital-assets/digital-assets.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { CommonModule } from './common/common.module';
import { ThemesModule } from './themes/themes.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TaxDocumentsModule } from './tax-documents/tax-documents.module';
import { OAuthModule } from './oauth/oauth.module';
import { ZynkraGraphQLModule } from './graphql/graphql.module';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        rootPath: join(process.cwd(), '../client/dist'),
      },
      {
        rootPath: join(process.cwd(), 'uploads'),
        serveRoot: '/uploads',
      },
    ),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      // Modules read many optional vars (Stripe, LiveKit, SMTP, ...) — only
      // reject values that are present but malformed.
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    // Error tracking — no-op unless SENTRY_DSN is set (init in instrument.ts).
    SentryModule.forRoot(),
    // Structured JSON logs (pretty-printed in dev). Request logging with
    // sensitive headers redacted.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        redact: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        autoLogging: {
          // Health checks and static assets are noise.
          ignore: (req) => req.url === '/health' || req.url?.startsWith('/uploads/'),
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    ScheduleModule.forRoot(),
    // Global rate limit: 300 requests/min per IP. Sensitive endpoints (login,
    // OTP, SIWE, wallet linking) declare stricter @Throttle overrides.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 300,
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'zynkra'),
        autoLoadEntities: true,
        // Schema changes go through migrations (src/migrations, npm run migration:generate).
        // NEVER enable synchronize — with 140+ entities it can drop/alter columns and
        // destroy data. Existing dev DBs created under synchronize: run
        // `npm run migration:adopt` once to mark the baseline as applied.
        synchronize: false,
        // *{.ts,.js}: compiled dist runs .js, ts-node dev runs the .ts sources.
        migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
        migrationsRun: configService.get<string>('DB_MIGRATIONS_RUN', 'true') !== 'false',
      }),
      inject: [ConfigService],
    }),
    // ProfileModule removed - module doesn't exist
    UsersModule,
    AuthModule,
    InviteCodesModule,
    SiweModule,
    VisibilityModule,
    PostsModule,
    ReportsModule,
    DmsModule,
    AdminModule,
    CommentsModule,
    UploadsModule,
    StoriesModule,
    FeedModule,
    GroupsModule,
    WalletModule,
    TippingModule,
    LiveKitModule, // New LiveKit module replacing broken old LivestreamModule
    AnalyticsModule,
    ReputationModule,
    StorageModule,
    TokenModule,
    SubscriptionsModule,
    CollaborationModule,
    ActivityModule,
    ModerationModule,
    IpfsModule,
    SearchModule,
    NotificationsModule,
    BookmarksModule,
    TrendsModule,
    MentionsModule,
    TagsModule,
    UserInterestsModule,
    HashtagsModule,
    PollsModule,
    EventsModule,
    SponsoredPostsModule,
    MediaModule,
    MonetizationModule,
    NotesModule,
    ReelsModule,
    MarketplaceModule,
    OpenSourceModule,
    PaymentsModule,
    StickersModule,
    WatchlistModule,
    MemoriesModule,
    FundraisersModule,
    AffiliatesModule,
    BrandCollabsModule,
    PagesModule,
    ReactionsModule,
    WebhooksModule,
    VerificationModule,
    DatingModule,
    SnapMapModule,
    SnoozeModule,
    CollectionsModule,
    SavedMarketplaceListingsModule,
    CryptoModule,
    KeysModule,
    TimelineModule,
    TimelineReviewModule,
    ProfileReviewModule,
    NonprofitsModule,
    FormsModule,
    LiveshoppingModule,
    DataExportModule,
    FederationModule,
    DigitalAssetsModule,
    InfrastructureModule,
    ArticlesModule,
    PodcastsModule,
    CoursesModule,
    NewslettersModule,
    TranslationModule,
    AdvancedFeaturesModule,
    ConnectedAccountsModule,
    CustomAudiencesModule,
    SyncModule,
    AiContentModule,
    ThreadsModule,
    LinkPreviewsModule,
    ScheduledPostsModule,
    GifsModule,
    CommonModule,
    ThemesModule,
    InvoicesModule,
    TaxDocumentsModule,
    OAuthModule,
    ZynkraGraphQLModule,
  ],
  controllers: [AppController, InfrastructureController],
  providers: [
    {
      // Reports unhandled exceptions to Sentry (no-op without SENTRY_DSN),
      // then delegates to the default exception handling.
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: HttpThrottlerGuard,
    },
  ],
})
export class AppModule {}