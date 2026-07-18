import { FC, useState, useEffect } from 'react';
import { addPostReaction, getPost } from '../lib/api';
import { SmilePlus } from 'lucide-react';

interface ReactionButtonsProps {
  postId: string;
}

const DEFAULT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
const CUSTOM_EMOJIS = ['🎉', '🔥', '💯', '✨', '🙌', '🤔', '🥳', '💪'];

// Sentiment mapping for reactions
const SENTIMENT_SCORES: Record<string, number> = {
  '❤️': 1.0, '😂': 0.9, '👍': 0.8, '🎉': 0.9, '🔥': 0.95, '💯': 1.0,
  '✨': 0.8, '🙌': 0.9, '🥳': 0.95, '💪': 0.85, '😮': 0.5, '🤔': 0.3,
  '😢': -0.5, '😡': -0.8
};

interface PostReaction {
  id: string;
  reaction: string;
  user: { id: string };
}

interface Post {
  id: string;
  reactions: PostReaction[];
}

export const ReactionButtons: FC<ReactionButtonsProps> = ({ postId }) => {
  const [showAllReactions, setShowAllReactions] = useState(false);
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [sentiment, setSentiment] = useState<number | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const fetchedPost = await getPost(postId);
        setPost(fetchedPost);
        // Calculate current sentiment
        if (fetchedPost.reactions.length > 0) {
          const totalScore = fetchedPost.reactions.reduce((sum, r) => {
            return sum + (SENTIMENT_SCORES[r.reaction] || 0);
          }, 0);
          setSentiment(totalScore / fetchedPost.reactions.length);
        }
      } catch (error) {
        console.error('Failed to fetch post', error);
      }
    };
    fetchPost();
  }, [postId]);

  const handleReaction = async (reaction: string) => {
    try {
      await addPostReaction(postId, reaction);
      // Update local state
      setUserReactions(prev => 
        prev.includes(reaction) 
          ? prev.filter(r => r !== reaction)
          : [...prev, reaction]
      );
      // Refresh post data
      const updatedPost = await getPost(postId);
      setPost(updatedPost);
      // Recalculate sentiment
      if (updatedPost.reactions.length > 0) {
        const totalScore = updatedPost.reactions.reduce((sum, r) => {
          return sum + (SENTIMENT_SCORES[r.reaction] || 0);
        }, 0);
        setSentiment(totalScore / updatedPost.reactions.length);
      }
    } catch (error) {
      console.error('Failed to add reaction', error);
    }
  };

  const getReactionCount = (reaction: string) => {
    if (!post) return 0;
    return post.reactions.filter(r => r.reaction === reaction).length;
  };

  const allReactions = [...DEFAULT_REACTIONS, ...CUSTOM_EMOJIS];
  const displayedReactions = showAllReactions ? allReactions : DEFAULT_REACTIONS;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 flex-wrap">
        {displayedReactions.map((reaction) => {
          const count = getReactionCount(reaction);
          const isSelected = userReactions.includes(reaction);
          return (
            <button
              key={reaction}
              onClick={() => handleReaction(reaction)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all ${
                isSelected 
                  ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500' 
                  : 'hover:bg-gray-100 dark:hover:bg-dark-700'
              }`}
              title={reaction}
            >
              <span className="text-lg">{reaction}</span>
              {count > 0 && <span className="text-xs font-medium">{count}</span>}
            </button>
          );
        })}
        <button
          onClick={() => setShowAllReactions(!showAllReactions)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
          title="More reactions"
        >
          <SmilePlus size={18} />
        </button>
      </div>
      {sentiment !== null && (
        <div className="text-xs text-dark-500 dark:text-dark-400">
          Sentiment score: {sentiment.toFixed(2)} ({sentiment > 0.5 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral'})
        </div>
      )}
    </div>
  );
};