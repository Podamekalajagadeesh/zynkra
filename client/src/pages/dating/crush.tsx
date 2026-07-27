import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { searchUsersApi } from '../../lib/api';
import { useToast } from '../../hooks/useToast';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Heart, Search, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserResult {
  id: string;
  username: string | null;
  displayName: string | null;
  pfp: string | null;
}

const DatingCrushPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { post } = useApi();
  const { addToast } = useToast();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await searchUsersApi(q.trim());
      setResults(Array.isArray(data) ? data.slice(0, 8) : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSendCrush = async (userId: string, displayName: string) => {
    setSubmitting(true);
    try {
      await post('/dating/crush', { crushedUserId: userId });
      setSentTo(userId);
      setQuery('');
      setResults([]);
      addToast(`Crush sent to ${displayName}!`, 'success');
    } catch (error: any) {
      addToast(
        error?.response?.data?.message || 'Failed to send crush',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/dating"
          className="rounded-xl border border-dark-200 p-2 hover:bg-dark-50 dark:border-dark-700 dark:hover:bg-dark-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart size={22} className="text-pink-500" />
            Secret Crush
          </h1>
          <p className="text-sm text-dark-500">
            Add someone as a secret crush. They'll only know if the feeling is mutual.
          </p>
        </div>
      </div>

      <div className="relative mb-6" ref={dropdownRef}>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400"
          />
          <Input
            placeholder="Search for a user..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-dark-200 bg-white shadow-lg dark:border-dark-700 dark:bg-dark-800 overflow-hidden">
            {results.map((user) => (
              <button
                key={user.id}
                disabled={submitting}
                onClick={() => handleSendCrush(user.id, user.displayName || user.username || 'user')}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-dark-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-50"
              >
                {user.pfp ? (
                  <img
                    src={user.pfp}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {(user.displayName || user.username || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-dark-900 dark:text-white truncate">
                    {user.displayName || 'Unknown'}
                  </p>
                  <p className="text-sm text-dark-500 truncate">
                    @{user.username}
                  </p>
                </div>
                <Heart
                  size={18}
                  className="text-pink-400 flex-shrink-0"
                />
              </button>
            ))}
          </div>
        )}

        {searching && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-dark-200 bg-white p-4 text-center text-sm text-dark-500 shadow-lg dark:border-dark-700 dark:bg-dark-800">
            Searching...
          </div>
        )}
      </div>

      {sentTo && (
        <div className="rounded-xl border border-pink-300 bg-pink-50 p-4 text-center dark:border-pink-800 dark:bg-pink-950/30">
          <p className="font-semibold text-pink-700 dark:text-pink-300">
            Your crush has been added!
          </p>
          <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">
            You'll be notified if the feeling is mutual.
          </p>
          <button
            onClick={() => setSentTo(null)}
            className="mt-2 text-sm text-pink-500 hover:underline"
          >
            Send another crush
          </button>
        </div>
      )}

      {!sentTo && !query && (
        <div className="text-center py-12">
          <Heart size={48} className="mx-auto text-pink-300 mb-4" />
          <p className="text-dark-500">
            Search for someone to add as your secret crush.
          </p>
        </div>
      )}
    </div>
  );
};

export default DatingCrushPage;