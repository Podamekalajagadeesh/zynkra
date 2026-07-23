import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { createTokenGatedContent, createTokenGatedGroup } from '../lib/token-gated';

export default function TokenGatedPage() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [minTokenBalance, setMinTokenBalance] = useState('');
  const [type, setType] = useState<'content' | 'group'>('content');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      if (type === 'content') {
        await createTokenGatedContent(name, description, tokenAddress, parseFloat(minTokenBalance));
      } else {
        await createTokenGatedGroup(name, description, tokenAddress, parseFloat(minTokenBalance));
      }
      setName('');
      setDescription('');
      setTokenAddress('');
      setMinTokenBalance('');
    }
  };

  return (
    <div>
      <h1>Create Token-Gated {type === 'content' ? 'Content' : 'Group'}</h1>
      <form onSubmit={handleCreate}>
        <div>
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as 'content' | 'group')}>
            <option value="content">Content</option>
            <option value="group">Group</option>
          </select>
        </div>
        <div>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label>Token Address</label>
          <input type="text" value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
        </div>
        <div>
          <label>Minimum Token Balance</label>
          <input type="text" value={minTokenBalance} onChange={(e) => setMinTokenBalance(e.target.value)} />
        </div>
        <button type="submit">Create</button>
      </form>
    </div>
  );
}