import { Module } from '@nestjs/common';
import { NonprofitsModule } from './nonprofits/nonprofits.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { InfrastructureController } from './infrastructure/infrastructure.controller';
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
import { OpenSourceModule } from './opensource/opensource.module';
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
import { DigitalAssetsModule } from './digital-assets/digital-assets.module';
import { VirtualRealEstateModule } from './virtual-real-estate/virtual-real-estate.module';
import { NeuralCompensationModule } from './neural-compensation/neural-compensation.module';
import { DigitalInheritanceModule } from './digital-inheritance/digital-inheritance.module';
import { CrossWorldTradingModule } from './cross-world-trading/cross-world-trading.module';
import { SpatialCommerceModule } from './spatial-commerce/spatial-commerce.module';
import { NeuralProductReviewsModule } from './neural-product-reviews/neural-product-reviews.module';
import { CollectivePurchasingModule } from './collective-purchasing/collective-purchasing.module';
import { CarbonNeutralModule } from './carbon-neutral/carbon-neutral.module';
import { SocialUBIModule } from './social-ubi/social-ubi.module';
import { NeuralPrivacyModule } from './neural-privacy/neural-privacy.module';
import { MindfulnessModule } from './mindfulness/mindfulness.module';
import { MemoryConsentModule } from './memory-consent/memory-consent.module';
import { GlobalRegulatoryModule } from './global-regulatory/global-regulatory.module';
import { QuantumEncryptionModule } from './quantum-encryption/quantum-encryption.module';
import { NeuralWellbeingModule } from './neural-wellbeing/neural-wellbeing.module';
import { RightToBeForgottenModule } from './right-to-be-forgotten/right-to-be-forgotten.module';
import { NeuralHarmPreventionModule } from './neural-harm-prevention/neural-harm-prevention.module';
import { DataMinimizationModule } from './data-minimization/data-minimization.module';
import { NeuralEthicsBoardsModule } from './neural-ethics-boards/neural-ethics-boards.module';
import { PlanetaryCommunitiesModule } from './planetary-communities/planetary-communities.module';
import { InterstellarConnectionModule } from './interstellar-connection/interstellar-connection.module';
import { IntergenerationalSpacesModule } from './intergenerational-spaces/intergenerational-spaces.module';
import { NeurodiverseCommunitiesModule } from './neurodiverse-communities/neurodiverse-communities.module';
import { LocalizedCommunitiesModule } from './localized-communities/localized-communities.module';
import { SpeciesCommunitiesModule } from './species-communities/species-communities.module';
import { CulturalPreservationCommunitiesModule } from './cultural-preservation-communities/cultural-preservation-communities.module';
import { SkillSharingModule } from './skill-sharing/skill-sharing.module';
import { CrisisResponseCommunitiesModule } from './crisis-response-communities/crisis-response-communities.module';
import { AccessibilityFirstCommunitiesModule } from './accessibility-first-communities/accessibility-first-communities.module';
import { AdvancedFeaturesModule } from './advanced-features/advanced-features.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';

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
        // Schema sync is a dev convenience only — in production it can drop/alter
        // columns and destroy data. Use TypeORM migrations for production changes.
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
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
    OpenSourceModule,
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
    DigitalAssetsModule,
    VirtualRealEstateModule,
    NeuralCompensationModule,
    DigitalInheritanceModule,
    CrossWorldTradingModule,
    SpatialCommerceModule,
    NeuralProductReviewsModule,
    CollectivePurchasingModule,
    CarbonNeutralModule,
    SocialUBIModule,
    NeuralPrivacyModule,
    MindfulnessModule,
    MemoryConsentModule,
    GlobalRegulatoryModule,
    QuantumEncryptionModule,
    NeuralWellbeingModule,
    RightToBeForgottenModule,
    NeuralHarmPreventionModule,
    DataMinimizationModule,
    NeuralEthicsBoardsModule,
    PlanetaryCommunitiesModule,
    InterstellarConnectionModule,
    IntergenerationalSpacesModule,
    NeurodiverseCommunitiesModule,
    LocalizedCommunitiesModule,
    SpeciesCommunitiesModule,
    CulturalPreservationCommunitiesModule,
    SkillSharingModule,
    CrisisResponseCommunitiesModule,
    AccessibilityFirstCommunitiesModule,
    AdvancedFeaturesModule,
    InfrastructureModule,
  ],
  controllers: [AppController, InfrastructureController],
  providers: [],
})
export class AppModule {}