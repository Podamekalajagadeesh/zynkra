import React, { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Wand2, Image as ImageIcon, Video as VideoIcon, Music, FileText, Loader2, Download, X, Sparkles, RefreshCw } from 'lucide-react';

interface GeneratedContent {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  url?: string;
  content?: string;
  prompt: string;
  createdAt: Date;
}

export default function AIContentGenerator({ onInsertContent, onClose }: {
  onInsertContent: (content: GeneratedContent) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock AI generation function
  const generateContent = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const newContent: GeneratedContent = {
      id: Date.now().toString(),
      type: activeTab,
      prompt,
      createdAt: new Date(),
      ...(activeTab === 'text' ? {
        content: `Generated AI content based on your prompt: "${prompt}". This is a sample of AI-created text that you can edit, refine, and use in your posts. The content is tailored to your request and optimized for social media engagement.`
      } : {
        url: `https://picsum.photos/seed/${Date.now()}/800/600` // Mock media URL
      })
    };
    
    setGeneratedContents(prev => [newContent, ...prev]);
    setSelectedContent(newContent);
    setIsGenerating(false);
    setPrompt('');
  };

  const handleInsert = () => {
    if (selectedContent) {
      onInsertContent(selectedContent);
      onClose();
    }
  };

  const regenerateContent = async () => {
    if (!prompt.trim() && !selectedContent?.prompt) return;
    const currentPrompt = prompt || selectedContent?.prompt || '';
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const newContent: GeneratedContent = {
      id: Date.now().toString(),
      type: activeTab,
      prompt: currentPrompt,
      createdAt: new Date(),
      ...(activeTab === 'text' ? {
        content: `Regenerated AI content based on your prompt: "${currentPrompt}". This is an updated version of the AI-created text with enhanced language and better engagement optimization.`
      } : {
        url: `https://picsum.photos/seed/${Date.now() + 100}/800/600`
      })
    };
    
    setGeneratedContents(prev => [newContent, ...prev]);
    setSelectedContent(newContent);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold">AI Content Generator</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="w-4 h-4" /> Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4" /> Video
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Music className="w-4 h-4" /> Audio
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Describe what you want to create</h3>
                <Textarea
                  placeholder={`Enter a detailed prompt for your AI-generated ${activeTab}...`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] text-base"
                />
                <div className="flex gap-3">
                  <Button 
                    onClick={generateContent} 
                    disabled={isGenerating || !prompt.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate {activeTab}
                      </>
                    )}
                  </Button>
                  {selectedContent && (
                    <Button 
                      variant="secondary" 
                      onClick={regenerateContent}
                      disabled={isGenerating}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                  )}
                </div>
              </div>

              {selectedContent && (
                <div className="mt-8 p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <h4 className="font-medium mb-3">Your generated {activeTab}:</h4>
                  {activeTab === 'text' ? (
                    <Textarea
                      value={selectedContent.content || ''}
                      onChange={(e) => setSelectedContent({...selectedContent, content: e.target.value})}
                      className="min-h-[150px] mb-4"
                    />
                  ) : (
                    <div className="mb-4">
                      <img 
                        src={selectedContent.url} 
                        alt="Generated AI media" 
                        className="max-w-full rounded-lg shadow-md"
                      />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button onClick={handleInsert} className="bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Insert into post
                    </Button>
                  </div>
                </div>
              )}

              {generatedContents.length > 0 && (
                <div className="mt-8">
                  <h4 className="font-medium mb-3">Generation history:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedContents.map((content) => (
                      <div 
                        key={content.id}
                        onClick={() => setSelectedContent(content)}
                        className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                          selectedContent?.id === content.id 
                            ? 'border-purple-500 ring-2 ring-purple-200' 
                            : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        {content.type === 'text' ? (
                          <div className="p-3 h-24 bg-gray-100 dark:bg-gray-800 truncate">
                            <p className="text-sm line-clamp-3">{content.content}</p>
                          </div>
                        ) : (
                          <img src={content.url} alt="" className="w-full h-24 object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}