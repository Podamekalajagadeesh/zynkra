import React from 'react';
import { Button } from '../ui/button';

interface Template {
  id: string;
  name: string;
  clipDurations: number[];
  audioId?: string;
}

interface TemplateLibraryProps {
  templates: Template[];
  onSelect: (template: Template) => void;
  onClose: () => void;
}

const TemplateLibrary = ({ templates, onSelect, onClose }: TemplateLibraryProps) => {
  // Group templates by category
  const reelTemplates = templates.filter(t => t.id.startsWith('reel-'));
  const storyTemplates = templates.filter(t => t.id.startsWith('story-'));
  const carouselTemplates = templates.filter(t => t.id.startsWith('carousel-'));

  const renderTemplateSection = (title: string, sectionTemplates: Template[]) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-gray-300">{title}</h3>
      <div className="space-y-3">
        {sectionTemplates.map(template => (
          <div key={template.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors">
            <div>
              <p className="font-semibold">{template.name}</p>
              <p className="text-sm text-gray-400 mt-1">
                {template.clipDurations.length} clip{template.clipDurations.length > 1 ? 's' : ''} • Total: {template.clipDurations.reduce((a, b) => a + b, 0)}s
                {template.audioId && ' • Includes audio'}
              </p>
            </div>
            <Button onClick={() => onSelect(template)}>Use Template</Button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl my-8">
        <h2 className="text-2xl font-bold mb-6">Template Library</h2>
        
        {reelTemplates.length > 0 && renderTemplateSection('Reels Templates', reelTemplates)}
        {storyTemplates.length > 0 && renderTemplateSection('Stories Templates', storyTemplates)}
        {carouselTemplates.length > 0 && renderTemplateSection('Carousels Templates', carouselTemplates)}
        
        <div className="mt-6 flex justify-end border-t border-gray-700 pt-4">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;