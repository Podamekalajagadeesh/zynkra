import React from 'react';
import { PageShell } from '../../components/PageShell';
import DigitalAssetsGallery from '../../components/digital-assets/DigitalAssetsGallery';
import { Upload, Globe, Shield, Zap } from 'lucide-react';

const DigitalAssetsPage: React.FC = () => {
  return (
    <PageShell>
      <div className="container mx-auto py-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl">
              <Globe className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Interoperable Digital Assets</h1>
              <p className="text-gray-600 dark:text-gray-400">Avatars, virtual possessions, and creations that work seamlessly across all platforms</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">IPFS Storage</h3>
              <p className="text-gray-600 dark:text-gray-400">All your assets are stored on the InterPlanetary File System, ensuring they're accessible from any platform.</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
              <Shield className="h-10 w-10 text-purple-600 dark:text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verified Ownership</h3>
              <p className="text-gray-600 dark:text-gray-400">Blockchain verification ensures your assets remain yours, with transfer capabilities across platforms.</p>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800">
              <Zap className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Federated Sync</h3>
              <p className="text-gray-600 dark:text-gray-400">Sync your assets automatically across all connected instances and metaverse platforms.</p>
            </div>
          </div>
        </div>
        
        <DigitalAssetsGallery />
      </div>
    </PageShell>
  );
};

export default DigitalAssetsPage;