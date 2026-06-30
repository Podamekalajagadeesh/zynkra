import { API_BASE_URL } from '../lib/api';

// Zynkra's NATIVE POST SERVICE - no external social media dependencies
export interface Post {
  id: number;
  content: string;
  mediaUrl?: string;
  isBoosted: boolean;
  profile: {
    id: number;
    name: string;
    walletAddress: string;
  };
  createdAt: string;
}

// Get user's posts for boosting
export async function getPosts(): Promise<Post[]> {
  const response = await fetch(`${API_BASE_URL}/posts/my-posts`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  
  return response.json();
}

// Create a boosted post (native Zynkra ad)
export async function createBoostedPost(postId: number, budget: string): Promise<{ success: boolean; campaignId: number }> {
  const response = await fetch(`${API_BASE_URL}/campaigns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      postId,
      budget,
      // Other campaign parameters from your boost settings
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create boosted post');
  }

  return response.json();
}

// Create a new organic post
export async function createPost(content: string, mediaUrl?: string): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ content, mediaUrl }),
  });

  if (!response.ok) {
    throw new Error('Failed to create post');
  }

  return response.json();
}