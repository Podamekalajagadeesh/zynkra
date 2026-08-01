import { useState } from 'react';
import { useOnDeviceLLM } from '../../hooks/useOnDeviceLLM';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useToast } from '../../hooks/useToast';

const TARGET_LANGUAGES = ['Spanish', 'French', 'German', 'Hindi', 'Japanese', 'Arabic'] as const;

type ToolName = 'summarize' | 'sentiment' | 'translate' | 'hashtags';

export function OnDeviceLLMPanel() {
  const { addToast } = useToast();
  const llm = useOnDeviceLLM();

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [toolText, setToolText] = useState('');
  const [toolLang, setToolLang] = useState<(typeof TARGET_LANGUAGES)[number]>('Spanish');
  const [toolOutput, setToolOutput] = useState<string | null>(null);

  const webGpuSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;
  const status = llm.getStatus();

  const sendChat = async () => {
    const content = chatInput.trim();
    if (!content) return;
    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setChatInput('');
    try {
      const response = await llm.chat(nextMessages.map((message) => ({ role: message.role, content: message.content })));
      setMessages((current) => [...current, { role: 'assistant', content: response.text }]);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'AI chat failed', 'error');
    }
  };

  const runTool = async (tool: ToolName) => {
    if (!toolText.trim()) return;
    setToolOutput(null);
    try {
      let response: { text: string };
      switch (tool) {
        case 'summarize':
          response = await llm.summarize(toolText);
          break;
        case 'sentiment':
          response = await llm.analyzeSentiment(toolText);
          break;
        case 'translate':
          response = await llm.translate(toolText, toolLang);
          break;
        case 'hashtags':
          response = await llm.generateHashtags(toolText);
          break;
      }
      setToolOutput(response.text);
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'AI tool failed', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">On-Device AI</h1>
        <p className="text-gray-500">
          A private AI assistant that runs entirely in your browser. Nothing leaves your device.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant={webGpuSupported ? 'default' : 'secondary'}>
            {webGpuSupported ? 'WebGPU available' : 'WebGPU not available'}
          </Badge>
          <Badge variant={status.loaded ? 'default' : 'outline'}>{status.model}</Badge>
          {status.loaded && <Badge variant="secondary">Loaded</Badge>}
        </div>

        {!webGpuSupported && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            On-device AI requires a browser with WebGPU support (Chrome 113+ or Edge). Your browser
            doesn't expose it, so the model can't run here.
          </p>
        )}

        {!status.loaded && webGpuSupported && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              {status.loading
                ? 'Downloading and loading the model (~1GB, cached after first use)…'
                : 'Load the model to enable private, on-device chat and tools.'}
            </p>
            <Button onClick={() => void llm.initialize()} disabled={llm.isLoading || llm.isReady}>
              {llm.isLoading ? 'Loading…' : 'Load model'}
            </Button>
          </div>
        )}

        {llm.error && <p className="text-sm text-red-600 dark:text-red-400">{llm.error}</p>}
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-bold">Chat</h2>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">Ask anything. This conversation never leaves your device.</p>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-right'
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                {message.content}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void sendChat();
            }}
            placeholder={status.loaded ? 'Type a message…' : 'Load the model to start chatting'}
            disabled={!status.loaded || llm.isGenerating}
            className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          />
          <Button onClick={() => void sendChat()} disabled={!status.loaded || !chatInput.trim() || llm.isGenerating}>
            Send
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h2 className="font-bold">Tools</h2>
        <textarea
          value={toolText}
          onChange={(event) => setToolText(event.target.value)}
          rows={3}
          placeholder="Paste text to summarize, analyze, translate, or tag…"
          disabled={!status.loaded}
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" onClick={() => void runTool('summarize')} disabled={!status.loaded || !toolText.trim() || llm.isGenerating}>
            Summarize
          </Button>
          <Button variant="outline" onClick={() => void runTool('sentiment')} disabled={!status.loaded || !toolText.trim() || llm.isGenerating}>
            Sentiment
          </Button>
          <Button variant="outline" onClick={() => void runTool('hashtags')} disabled={!status.loaded || !toolText.trim() || llm.isGenerating}>
            Hashtags
          </Button>
          <select
            value={toolLang}
            onChange={(event) => setToolLang(event.target.value as (typeof TARGET_LANGUAGES)[number])}
            disabled={!status.loaded}
            className="p-2 border rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
          >
            {TARGET_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => void runTool('translate')} disabled={!status.loaded || !toolText.trim() || llm.isGenerating}>
            Translate
          </Button>
        </div>
        {toolOutput !== null && (
          <pre className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm whitespace-pre-wrap">{toolOutput}</pre>
        )}
      </Card>
    </div>
  );
}
