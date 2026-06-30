import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { search } from '../lib/api';
import { User } from '../lib/types';
import { Post } from '../lib/types';
import { Tag } from '../lib/types';
import { Place } from '../lib/types';
import { Event } from '../lib/types';
import { Group } from '../lib/types';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ users: User[]; posts: Post[]; hashtags: Tag[]; places: Place[]; groups: Group[], events: Event[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const data = await search(query);
        setResults(data);
        setIsDropdownOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleBlur = () => {
    // Delay closing the dropdown to allow clicks on links
    setTimeout(() => {
      setIsDropdownOpen(false);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setQuery('');
        setIsDropdownOpen(false);
      }
    }
  };

  return (
    <div className="relative" onBlur={handleBlur}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 dark:text-dark-500" size={20} />
      <input
        id="global-search"
        type="text"
        placeholder="Search..."
        className="w-full rounded-full border border-dark-200 bg-white/80 py-2 pl-10 pr-4 text-dark-900 shadow-sm transition-colors placeholder:text-dark-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-700 dark:bg-dark-800/80 dark:text-light-100 dark:placeholder:text-dark-500"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length > 1 && setIsDropdownOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-dark-400 dark:text-dark-500" size={20} />}
      
      {isDropdownOpen && results && (
        <div className="absolute mt-2 w-full rounded-md bg-white shadow-lg dark:bg-dark-800">
          <div className="py-1">
            {results.users.length > 0 && (
              <div>
                <h3 className="px-4 py-2 text-xs font-semibold uppercase text-dark-500 dark:text-dark-400">Users</h3>
                {results.users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.id}`}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-700"
                  >
                    <Avatar src={user.profile.avatarUrl} alt={user.username} className="h-8 w-8" />
                    <div>
                      <p className="font-medium">{user.profile.displayName}</p>
                      <p className="text-xs text-dark-500 dark:text-dark-400">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {results.posts.length > 0 && (
              <div>
                <h3 className="px-4 py-2 text-xs font-semibold uppercase text-dark-500 dark:text-dark-400">Posts</h3>
                {results.posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.id}`}
                    className="block px-4 py-2 text-sm text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-700"
                  >
                    {post.content.substring(0, 100)}...
                  </Link>
                ))}
              </div>
            )}
            {results.hashtags.length > 0 && (
              <div>
                <h3 className="px-4 py-2 text-xs font-semibold uppercase text-dark-500 dark:text-dark-400">Hashtags</h3>
                {results.hashtags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/hashtag/${tag.name}`}
                    className="block px-4 py-2 text-sm text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-700"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
            {results.places.length > 0 && (
              <div>
                <h3 className="px-4 py-2 text-xs font-semibold uppercase text-dark-500 dark:text-dark-400">Places</h3>
                {results.places.map((place) => (
                  <Link
                    key={place.id}
                    to={`/place/${place.id}`}
                    className="block px-4 py-2 text-sm text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-700"
                  >
                    {place.name}
                  </Link>
                ))}
              </div>
            )}
            {results.groups.length > 0 && (
              <div>
                <h3 className="px-4 py-2 text-xs font-semibold uppercase text-dark-500 dark:text-dark-400">Groups</h3>
                {results.groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    className="block px-4 py-2 text-sm text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-700"
                  >
                    {group.name}
                  </Link>
                ))}
              </div>
            )}
            {results.events.length > 0 && (
              <div>
                <h3 className="px-4 py-2 text-xs font-semibold uppercase text-dark-500 dark:text-dark-400">Events</h3>
                {results.events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block px-4 py-2 text-sm text-dark-700 hover:bg-dark-100 dark:text-light-100 dark:hover:bg-dark-700"
                  >
                    {event.title}
                  </Link>
                ))}
              </div>
            )}
            {results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0 && results.places.length === 0 && results.groups.length === 0 && results.events.length === 0 && (
              <p className="px-4 py-2 text-sm text-dark-500 dark:text-dark-400">No results found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}