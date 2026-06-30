import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/button';
import { createGroup } from '../../lib/api';
import { GroupPrivacy } from '../../types';

export function CreateGroupForm() {
  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState<GroupPrivacy>(GroupPrivacy.PUBLIC);
  const [tokenGated, setTokenGated] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [requiredTokenBalance, setRequiredTokenBalance] = useState('');
  const [allowAnonymousPosting, setAllowAnonymousPosting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Group name cannot be empty');
      addToast('Group name cannot be empty', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await createGroup(
        name,
        privacy,
        tokenGated,
        contractAddress,
        requiredTokenBalance,
        allowAnonymousPosting,
      );
      setName('');
      setPrivacy(GroupPrivacy.PUBLIC);
      setTokenGated(false);
      setContractAddress('');
      setRequiredTokenBalance('');
      addToast('Group created successfully!', 'success');
    } catch (error) {
      console.error('Failed to create group:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create group';
      setError(errorMsg);
      addToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="surface-soft mb-lg p-5 animate-fade-in sm:p-6">
      {error && (
        <div className="mb-md rounded-xl border border-red-200 bg-red-50 p-sm text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold text-dark-900 dark:text-white">Create a new group</p>
        </div>
      </div>
      <div className="mb-md">
        <input
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field rounded-2xl border-dark-200 bg-white/90 shadow-sm dark:border-dark-700 dark:bg-dark-900/70"
        />
      </div>
      <div className="mb-md">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="privacy"
              value={GroupPrivacy.PUBLIC}
              checked={privacy === GroupPrivacy.PUBLIC}
              onChange={(e) => setPrivacy(e.target.value as GroupPrivacy)}
            />
            <span>Public</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="privacy"
              value={GroupPrivacy.PRIVATE}
              checked={privacy === GroupPrivacy.PRIVATE}
              onChange={(e) => setPrivacy(e.target.value as GroupPrivacy)}
            />
            <span>Private</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="privacy"
              value={GroupPrivacy.SECRET}
              checked={privacy === GroupPrivacy.SECRET}
              onChange={(e) => setPrivacy(e.target.value as GroupPrivacy)}
            />
            <span>Secret</span>
          </label>
        </div>
      </div>
      <div className="mb-md">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowAnonymousPosting}
            onChange={(e) => setAllowAnonymousPosting(e.target.checked)}
          />
          <span>Allow anonymous posting</span>
        </label>
      </div>
      <div className="mb-md">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={tokenGated}
            onChange={(e) => setTokenGated(e.target.checked)}
          />
          <span>Token-Gated</span>
        </label>
      </div>
      {tokenGated && (
        <>
          <div className="mb-md">
            <input
              placeholder="Contract address"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="input-field rounded-2xl border-dark-200 bg-white/90 shadow-sm dark:border-dark-700 dark:bg-dark-900/70"
            />
          </div>
          <div className="mb-md">
            <input
              placeholder="Required token balance"
              value={requiredTokenBalance}
              onChange={(e) => setRequiredTokenBalance(e.target.value)}
              className="input-field rounded-2xl border-dark-200 bg-white/90 shadow-sm dark:border-dark-700 dark:bg-dark-900/70"
            />
          </div>
        </>
      )}
      <Button
        type="submit"
        variant="primary"
        size="md"
        className="min-w-28"
        disabled={!name.trim() || isLoading}
      >
        {isLoading ? 'Creating...' : 'Create Group'}
      </Button>
    </form>
  );
}