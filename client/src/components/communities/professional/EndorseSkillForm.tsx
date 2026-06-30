import { useState } from 'react';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { useToast } from '../../../hooks/useToast';

interface EndorseSkillFormProps {
  communityId: string;
  profileUserId: string;
  skillId: string;
  onSubmit: () => void;
}

export const EndorseSkillForm = ({ communityId, profileUserId, skillId, onSubmit }: EndorseSkillFormProps) => {
  const { showToast } = useToast();
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would send the endorsement to the server
    console.log('Endorsed skill:', skillId, { profileUserId, comment });
    
    showToast({
      title: 'Skill endorsed!',
      description: 'Your endorsement has been added to the profile.',
      type: 'success'
    });

    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Add a comment (optional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a personal note about why you're endorsing this skill..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onSubmit}>Cancel</Button>
        <Button type="submit">Endorse Skill</Button>
      </div>
    </form>
  );
};