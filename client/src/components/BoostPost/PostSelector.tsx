import React from 'react';

interface Post {
  id: string;
  message: string;
}

interface PostSelectorProps {
  posts: Post[];
  onSelectPost: (postId: string) => void;
}

const PostSelector: React.FC<PostSelectorProps> = ({ posts, onSelectPost }) => {
  return (
    <div>
      <h2>Select a Post to Boost</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <p>{post.message}</p>
            <button onClick={() => onSelectPost(post.id)}>Select</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostSelector;