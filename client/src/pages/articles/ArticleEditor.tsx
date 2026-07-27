import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/PageShell';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/useToast';
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Clock,
  Lock,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';

interface ArticleDraft {
  id?: string;
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
  coverImage: string;
  isGated: boolean;
  tokenPrice: number | null;
  status: 'draft' | 'scheduled' | 'published';
}

const ArticleEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [article, setArticle] = useState<ArticleDraft>({
    title: '',
    subtitle: '',
    content: '',
    tags: [],
    coverImage: '',
    isGated: false,
    tokenPrice: null,
    status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    try {
      const response = await api.get(`/articles/${articleId}`);
      setArticle(response.data);
    } catch (error) {
      addToast('Failed to load article', 'error');
      navigate('/articles');
    }
  };

  const saveDraft = async (silent = false) => {
    setSaving(true);
    try {
      if (id) {
        await api.put(`/articles/${id}`, article);
      } else {
        const response = await api.post('/articles', article);
        setArticle({ ...article, id: response.data.id });
      }
      if (!silent) {
        addToast('Draft saved', 'success');
      }
    } catch (error) {
      addToast('Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const publishArticle = async () => {
    if (!article.title || !article.content) {
      addToast('Title and content are required', 'error');
      return;
    }

    setPublishing(true);
    try {
      // Save if new article
      if (!id) {
        const response = await api.post('/articles', {
          ...article,
          status: 'draft',
        });
        article.id = response.data.id;
      }

      // Publish
      await api.post(`/articles/${id || article.id}/publish`);
      addToast('Article published!', 'success');
      navigate('/articles');
    } catch (error) {
      addToast('Failed to publish article', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const updateField = (field: keyof ArticleDraft, value: any) => {
    setArticle({ ...article, [field]: value });
  };

  const addTag = (tag: string) => {
    if (tag && !article.tags.includes(tag)) {
      setArticle({ ...article, tags: [...article.tags, tag] });
    }
  };

  const removeTag = (tag: string) => {
    setArticle({ ...article, tags: article.tags.filter((t: string) => t !== tag) });
  };

  return (
    <PageShell
      eyebrow={id ? 'Edit Article' : 'Write Article'}
      title={article.title || 'New Article'}
    >
      <div className="max-w-4xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/articles')}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => setPreview(!preview)}
              icon={<Eye size={16} />}
            >
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              variant="outline"
              onClick={() => saveDraft()}
              isLoading={saving}
              icon={<Save size={16} />}
            >
              Save Draft
            </Button>
            <Button
              onClick={publishArticle}
              isLoading={publishing}
              icon={<Send size={16} />}
            >
              Publish
            </Button>
          </div>
        </div>

        {preview ? (
          // Preview mode
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl font-bold mb-4">{article.title || 'Untitled'}</h1>
            {article.subtitle && (
              <p className="text-xl text-gray-500 mb-6">{article.subtitle}</p>
            )}
            <div
              className="article-content"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        ) : (
          // Edit mode
          <div className="space-y-6">
            {/* Title */}
            <input
              type="text"
              value={article.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Your article title"
              className="w-full text-4xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600"
              autoFocus
            />

            {/* Subtitle */}
            <input
              type="text"
              value={article.subtitle}
              onChange={(e) => updateField('subtitle', e.target.value)}
              placeholder="Add a subtitle (optional)"
              className="w-full text-xl text-gray-600 dark:text-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-300 dark:placeholder-gray-600"
            />

            {/* Content */}
            <div className="min-h-[60vh]">
              <textarea
                value={article.content}
                onChange={(e) => updateField('content', e.target.value)}
                placeholder="Start writing your story..."
                className="w-full min-h-[60vh] text-lg bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder-gray-300 dark:placeholder-gray-600"
              />
            </div>

            {/* Tags */}
            <div className="pt-4 border-t">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag..."
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Monetization */}
            <div className="pt-4 border-t">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={article.isGated}
                  onChange={(e) => updateField('isGated', e.target.checked)}
                  className="rounded"
                />
                <Lock size={14} />
                Gate this article with tokens
              </label>
              {article.isGated && (
                <div className="mt-2 ml-6">
                  <input
                    type="number"
                    value={article.tokenPrice || ''}
                    onChange={(e) => updateField('tokenPrice', Number(e.target.value))}
                    placeholder="Token price"
                    className="w-32 px-3 py-2 border rounded-lg"
                    min="0"
                    step="0.01"
                  />
                  <span className="ml-2 text-sm text-gray-500">ZYNK tokens to unlock</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default ArticleEditor;
