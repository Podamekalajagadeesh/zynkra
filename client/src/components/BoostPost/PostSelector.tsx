interface Post {
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

interface PostSelectorProps {
  posts: Post[];
  onSelectPost: (postId: string) => void;
}

const PostSelector = ({ posts, onSelectPost }: PostSelectorProps) => {
  return (
    <div>
      <h2>Select a Post to Boost</h2>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <p>{post.content}</p>
            <button onClick={() => onSelectPost(String(post.id))}>Select</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PostSelector;