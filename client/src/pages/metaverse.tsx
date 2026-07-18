import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import VirtualWorldLobby from '../components/metaverse/VirtualWorldLobby';
import AvatarCustomizer from '../components/metaverse/AvatarCustomizer';
import VirtualEventHosting from '../components/metaverse/VirtualEventHosting';
import Object3DUploader from '../components/metaverse/Object3DUploader';
import BlendedRealityStudio from '../components/metaverse/BlendedRealityStudio';
import CollectiveExperienceStudio from '../components/metaverse/CollectiveExperienceStudio';
import NeuralLiveStreamingStudio from '../components/metaverse/NeuralLiveStreamingStudio';
import HolographicGatherings from '../components/metaverse/HolographicGatherings';
import InterplanetaryConnectivity from '../components/metaverse/InterplanetaryConnectivity';
import NeuralDashboard from '../components/metaverse/NeuralDashboard';
import ThoughtEditor from '../components/metaverse/ThoughtEditor';
import NeuralSearch from '../components/metaverse/NeuralSearch';
import { NeuralContentSummarizer } from '../components/metaverse/NeuralContentSummarizer';
import NeuralShoppingExperiences from '../components/metaverse/NeuralShoppingExperiences';
import VirtualRealEstateCoOwnership from '../components/metaverse/VirtualRealEstateCoOwnership';
import { CreatorEconomyDashboard } from '../components/metaverse/CreatorEconomyDashboard';
import { DigitalInheritance } from '../components/metaverse/DigitalInheritance';
import { CrossWorldAssetTrading } from '../components/metaverse/CrossWorldAssetTrading';
import { SpatialCommerce } from '../components/metaverse/SpatialCommerce';
import { NeuralProductReviews } from '../components/metaverse/NeuralProductReviews';
import { CollectivePurchasing } from '../components/metaverse/CollectivePurchasing';
import { CarbonNeutralEconomy } from '../components/metaverse/CarbonNeutralEconomy';
import { SocialUBI } from '../components/metaverse/SocialUBI';
import { SharedAttentionPanel } from '../components/shared-attention/SharedAttentionPanel';
import { Globe, User, Calendar, Cube, Brain, Edit3, Search, Users2, Monitor, Sparkles, Rocket, FileText, ShoppingCart, Home, Coins, Shield, ArrowRightLeft, Store, MessageSquare, Users as UsersIcon, Trees, Trophy, Wand2, Mic } from 'lucide-react';
import PageShell from '../components/PageShell';

const MetaversePage: React.FC = () => {
  return (
    <PageShell>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-950 dark:to-gray-90">
        <div className="border-b dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-16 z-10">
          <div className="container mx-auto px-6">
            <Tabs defaultValue="worlds" className="w-full">
              <TabsList className="grid w-full grid-cols-[repeat(22,minmax(0,1fr))] max-w-7xl">
                <TabsTrigger value="worlds" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Virtual Worlds
                </TabsTrigger>
                <TabsTrigger value="real-estate" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Real Estate
                </TabsTrigger>
                <TabsTrigger value="blended-reality" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Blended Reality
                </TabsTrigger>
                <TabsTrigger value="holographic" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Holographic
                </TabsTrigger>
                <TabsTrigger value="interplanetary" className="flex items-center gap-2">
                  <Rocket className="h-4 w-4" />
                  Interplanetary
                </TabsTrigger>
                <TabsTrigger value="avatar" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  My Avatar
                </TabsTrigger>
                <TabsTrigger value="consciousness" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Consciousness
                </TabsTrigger>
                <TabsTrigger value="neural-shopping" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Neural Shopping
                </TabsTrigger>
                <TabsTrigger value="creator-economy" className="flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Creator Economy
                </TabsTrigger>
                <TabsTrigger value="digital-inheritance" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Digital Inheritance
                </TabsTrigger>
                <TabsTrigger value="cross-world-trading" className="flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  Cross-World Trading
                </TabsTrigger>
                <TabsTrigger value="spatial-commerce" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Spatial Commerce
                </TabsTrigger>
                <TabsTrigger value="neural-product-reviews" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Neural Reviews
                </TabsTrigger>
                <TabsTrigger value="collective-purchasing" className="flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Collective Purchasing
                </TabsTrigger>
                <TabsTrigger value="shared-attention" className="flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  Shared Attention
                </TabsTrigger>
                <TabsTrigger value="collective-experience" className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Collective Experience
                </TabsTrigger>
                <TabsTrigger value="neural-live-streaming" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Neural Live
                </TabsTrigger>
                <TabsTrigger value="thought-editor" className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Thought Editor
                </TabsTrigger>
                <TabsTrigger value="neural-search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Neural Search
                </TabsTrigger>
                <TabsTrigger value="neural-summarizer" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content Summarizer
                </TabsTrigger>
                <TabsTrigger value="events" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Host Events
                </TabsTrigger>
                <TabsTrigger value="3d-studio" className="flex items-center gap-2">
                  <Cube className="h-4 w-4" />
                  3D Studio
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <Tabs defaultValue="worlds">
          <TabsContent value="worlds" className="m-0">
            <VirtualWorldLobby />
          </TabsContent>
          <TabsContent value="real-estate" className="m-0">
            <VirtualRealEstateCoOwnership />
          </TabsContent>
          <TabsContent value="blended-reality" className="m-0">
            <BlendedRealityStudio />
          </TabsContent>
          <TabsContent value="holographic" className="m-0">
            <HolographicGatherings />
          </TabsContent>
          <TabsContent value="interplanetary" className="m-0">
            <InterplanetaryConnectivity />
          </TabsContent>
          <TabsContent value="avatar" className="m-0">
            <AvatarCustomizer />
          </TabsContent>
          <TabsContent value="consciousness" className="m-0">
            <NeuralDashboard />
          </TabsContent>
          <TabsContent value="neural-shopping" className="m-0">
            <NeuralShoppingExperiences />
          </TabsContent>
          <TabsContent value="creator-economy" className="m-0">
            <CreatorEconomyDashboard />
          </TabsContent>
          <TabsContent value="digital-inheritance" className="m-0">
            <DigitalInheritance />
          </TabsContent>
          <TabsContent value="cross-world-trading" className="m-0">
            <CrossWorldAssetTrading />
          </TabsContent>
          <TabsContent value="spatial-commerce" className="m-0">
            <SpatialCommerce />
          </TabsContent>
          <TabsContent value="neural-product-reviews" className="m-0">
            <NeuralProductReviews />
          </TabsContent>
          <TabsContent value="collective-purchasing" className="m-0">
            <CollectivePurchasing />
          </TabsContent>
          <TabsContent value="shared-attention" className="m-0">
            <div className="container mx-auto px-6 py-8 max-w-4xl">
              <SharedAttentionPanel />
            </div>
          </TabsContent>
          <TabsContent value="collective-experience" className="m-0">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
              <CollectiveExperienceStudio />
            </div>
          </TabsContent>
          <TabsContent value="neural-live-streaming" className="m-0">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
              <NeuralLiveStreamingStudio />
            </div>
          </TabsContent>
          <TabsContent value="thought-editor" className="m-0">
            <ThoughtEditor />
          </TabsContent>
          <TabsContent value="neural-search" className="m-0">
            <NeuralSearch />
          </TabsContent>
          <TabsContent value="neural-summarizer" className="m-0">
            <NeuralContentSummarizer />
          </TabsContent>
          <TabsContent value="events" className="m-0">
            <VirtualEventHosting />
          </TabsContent>
          <TabsContent value="3d-studio" className="m-0">
            <Object3DUploader />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
};

export default MetaversePage;