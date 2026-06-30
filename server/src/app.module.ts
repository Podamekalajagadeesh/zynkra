import { Module } from '@nestjs/common';
import { NonprofitsModule } from './nonprofits/nonprofits.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
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
import { GroupsModule } from './groups/groups.module';
import { SnoozeModule } from './snooze/snooze.module';
import { CollectionsModule } from './collections/collections.module';
import { WalletModule } from './wallet/wallet.module';
import { TippingModule } from './tipping/tipping.module';
// import { LivestreamModule } from './livestream/livestream.module'; // LivestreamModule commented out - broken imports
import { AnalyticsModule } from './analytics/analytics.module';
import { DaoModule } from './dao/dao.module';
import { ReputationModule } from './reputation/reputation.module';
import { StorageModule } from './storage/storage.module';
import { TokenModule } from './token/token.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TokenGatedContentModule } from './token-gated-content/token-gated-content.module';
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
// import { SessionsModule } from './sessions/sessions.module'; // SessionsModule commented out - broken imports
import { MediaModule } from './media/media.module';
import { MonetizationModule } from './monetization/monetization.module';
import { NotesModule } from './notes/notes.module';
import { ReelsModule } from './reels/reels.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { PaymentsModule } from './payments/payments.module';
import { StickersModule } from './stickers/stickers.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { MemoriesModule } from './memories/memories.module';
import { FundraisersModule } from './fundraisers/fundraisers.module';
import { PagesModule } from './pages/pages.module';
import { AffiliatesModule } from './affiliates/affiliates.module';
import { BrandCollabsModule } from './brand-collabs/brand-collabs.module';
// import { DatingModule } from './dating/dating.module'; // DatingModule moved to broken-modules
// import { AdsModule } from './ads/ads.module'; // AdsModule commented out - broken imports

import { ReactionsModule } from './reactions/reactions.module';
import { SavedMarketplaceListingsModule } from './saved-marketplace-listings/saved-marketplace-listings.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { CryptoModule } from './crypto/crypto.module';
import { KeysModule } from './keys/keys.module';
import { TimelineModule } from './timeline/timeline.module';
import { TimelineReviewModule } from './timeline-review/timeline-review.module';
import { ProfileReviewModule } from './tags/profile-review.module';
// import { CrisisModule } from './crisis/crisis.module'; // CrisisModule commented out - broken imports
import { FormsModule } from './forms/forms.module';
import { LiveKitModule } from './livekit/livekit.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { SnapMapModule } from './snapmap/snapmap.module';
import { BerealModule } from './bereal/bereal.module';
import { LiveshoppingModule } from './liveshopping/liveshopping.module';
import { DataExportModule } from '../broken-modules/data-export/data-export.module';
import { ActivityModule } from './activity/activity.module';
import { FederationModule } from './federation/federation.module';
import { ModerationModule } from './moderation/moderation.module';

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
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'zynkra'),
        autoLoadEntities: true,
        synchronize: true, // Note: synchronize should be false in production
      }),
      inject: [ConfigService],
    }),
    // ProfileModule removed - module doesn't exist
    UsersModule,
    AuthModule,
    SiweModule,
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
    DaoModule,
    ReputationModule,
    StorageModule,
    TokenModule,
    SubscriptionsModule,
    CollaborationModule,
    ActivityModule,
    TokenGatedContentModule,
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
    // SessionsModule, // SessionsModule commented out - broken imports
    MediaModule,
    MonetizationModule,
    NotesModule,
    ReelsModule,
    MarketplaceModule,
    PaymentsModule,
    StickersModule,
    WatchlistModule,
    MemoriesModule,
    FundraisersModule,
    AffiliatesModule,
    BrandCollabsModule,
    PagesModule,
    // DatingModule, // DatingModule commented out - broken imports
    // AdsModule, // AdsModule commented out - broken imports
    ReactionsModule, WebhooksModule,
    SnapMapModule,
    ReactionsModule,
    SnoozeModule,
    CollectionsModule,
    SavedMarketplaceListingsModule,
    CryptoModule,
    KeysModule,
    TimelineModule,
    TimelineReviewModule,
    ProfileReviewModule,
    NonprofitsModule,
    // CrisisModule, // CrisisModule commented out - broken imports
    FormsModule,
    BerealModule,
    LiveshoppingModule,
    DataExportModule,
    FederationModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}