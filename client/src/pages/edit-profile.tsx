// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { api, getProfile, updateProfile, createLifeEvent, deleteLifeEvent } from '../lib/api';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { LifeEvent } from '../lib/types';
import { themes, Theme } from '../themes';

export function EditProfilePage() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [profileTheme, setProfileTheme] = useState('default');
  const [profileThemeColor, setProfileThemeColor] = useState('#000000');
  const [profileBioFont, setProfileBioFont] = useState('default');
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [showAddLifeEvent, setShowAddLifeEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    type: 'other' as LifeEvent['type']
  });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
      setRelationshipStatus(user.relationshipStatus || '');
      setProfileTheme(user.profileTheme || 'default');
      setProfileThemeColor(user.profileThemeColor || '#000000');
      setProfileBioFont(user.profileBioFont || 'default');
      setLifeEvents(user.lifeEvents || []);
      setIsLoading(false);
    } else {
      getProfile().then(profile => {
        setUser(profile);
        setDisplayName(profile.displayName || '');
        setUsername(profile.username || '');
        setBio(profile.bio || '');
        setWebsite(profile.website || '');
        setProfileTheme(profile.profileTheme || 'default');
      setProfileThemeColor(profile.profileThemeColor || '#000000');
      setProfileBioFont(profile.profileBioFont || 'default');
      setLifeEvents(profile.lifeEvents || []);
      // Load life events from server
      api.get('/users/me/life-events').then(res => { if (res.data) setLifeEvents(res.data); }).catch(() => {});
        setIsLoading(false);
      });
    }
  }, [user, setUser]);

  // Load life events when user is loaded directly
  useEffect(() => {
    if (user) {
      api.get('/users/me/life-events').then(res => { if (res.data) setLifeEvents(res.data); }).catch(() => {});
    }
  }, [user]);

  const addLifeEvent = async () => {
    if (!newEvent.title || !newEvent.date) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    try {
      const created = await createLifeEvent(newEvent);
      setLifeEvents([...lifeEvents, created]);
      setNewEvent({ title: '', description: '', date: '', type: 'other' });
      setShowAddLifeEvent(false);
      addToast('Life event added', 'success');
    } catch {
      addToast('Failed to add life event', 'error');
    }
  };

  const removeLifeEvent = async (eventId: string) => {
    try {
      await deleteLifeEvent(eventId);
      setLifeEvents(lifeEvents.filter(event => event.id !== eventId));
      addToast('Life event removed', 'success');
    } catch {
      addToast('Failed to remove life event', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData();
    formData.append('displayName', displayName);
    formData.append('username', username);
    formData.append('bio', bio);
    formData.append('website', website);
    formData.append('relationshipStatus', relationshipStatus);
    formData.append('profileTheme', profileTheme);
    formData.append('profileThemeColor', profileThemeColor);
    formData.append('profileBioFont', profileBioFont);
    formData.append('lifeEvents', JSON.stringify(lifeEvents));
    if (avatar) {
      formData.append('avatar', avatar);
    }

    try {
      const updatedUser = await updateProfile(formData);
      setUser(updatedUser);
      addToast('Profile updated successfully!', 'success');
      navigate(`/profile/${user.id}`);
    } catch (error) {
      addToast('Failed to update profile', 'error');
    }
  };

  if (isLoading) {
    return (
      <PageShell title="Edit Profile">
        <div>Loading...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Edit Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName">Display Name</label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="username">Username</label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bio">Bio</label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="website">Website</label>
          <Input
            id="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="avatar">Profile Photo</label>
          <Input
            id="avatar"
            type="file"
            onChange={(e) => setAvatar(e.target.files ? e.target.files[0] : null)}
          />
        </div>
        <div>
          <label htmlFor="relationshipStatus">Relationship Status</label>
          <select
            id="relationshipStatus"
            value={relationshipStatus}
            onChange={(e) => setRelationshipStatus(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select...</option>
            <option value="Single">Single</option>
            <option value="In a Relationship">In a Relationship</option>
            <option value="Engaged">Engaged</option>
            <option value="Married">Married</option>
            <option value="It's Complicated">It's Complicated</option>
            <option value="Separated">Separated</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>
        <div>
          <label>Life Events</label>
          <div className="space-y-2 mt-2">
            {lifeEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()} - {event.type}</p>
                  {event.description && <p className="text-sm">{event.description}</p>}
                </div>
                <Button type="button" variant="destructive" onClick={() => removeLifeEvent(event.id)}>Remove</Button>
              </div>
            ))}
            
            {showAddLifeEvent ? (
              <div className="p-4 border rounded space-y-3">
                <Input
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                />
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                />
                <Select value={newEvent.type} onValueChange={(value: LifeEvent['type']) => setNewEvent({...newEvent, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="new_job">New Job</SelectItem>
                    <SelectItem value="moved">Moved</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button type="button" onClick={addLifeEvent}>Add Event</Button>
                  <Button type="button" variant="secondary" onClick={() => setShowAddLifeEvent(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button type="button" onClick={() => setShowAddLifeEvent(true)}>Add Life Event</Button>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="profileTheme">Profile Theme</label>
          <select
            id="profileTheme"
            value={profileTheme}
            onChange={(e) => setProfileTheme(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {Object.keys(themes).map(themeKey => (
              <option key={themeKey} value={themeKey}>
                {themes[themeKey as Theme].name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="profileThemeColor">Profile Theme Color</label>
          <Input
            id="profileThemeColor"
            type="color"
            value={profileThemeColor}
            onChange={(e) => setProfileThemeColor(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="profileBioFont">Bio Font Style</label>
          <select
            id="profileBioFont"
            value={profileBioFont}
            onChange={(e) => setProfileBioFont(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="default">Default</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
            <option value="cursive">Cursive</option>
            <option value="fantasy">Fantasy</option>
            <option value="italic">Italic</option>
            <option value="bold">Bold</option>
          </select>
        </div>
        {/* Account Verification Section */}
        <div className="mt-6 p-4 border rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">Account Verification</h3>
          {user?.verified ? (
            <div className="flex items-center gap-2 text-green-600">
              <BadgeCheck className="h-5 w-5" />
              <span>Your account is verified</span>
            </div>
          ) : user?.verificationStatus === 'pending' ? (
            <div className="text-yellow-600">
              <p>Your verification request is pending review.</p>
              <p className="text-sm">Submitted on {new Date(user.verificationSubmittedAt!).toLocaleDateString()}</p>
              {user?.subscription?.active && (
                <p className="text-sm text-blue-600 mt-1">
                  ✓ Your premium subscription gives you priority processing - your request will be reviewed faster!
                </p>
              )}
            </div>
          ) : user?.verificationStatus === 'rejected' ? (
            <div className="space-y-3">
              <p className="text-red-600">Your previous verification request was rejected. You can resubmit below.</p>
              {user?.subscription?.active && (
                <p className="text-sm text-blue-600">
                  ✓ Your premium subscription gives you priority processing - your new request will be reviewed faster!
                </p>
              )}
              <div>
                <label htmlFor="idDocument" className="block mb-1">Upload ID Document (JPG, PNG, PDF)</label>
                <Input
                  id="idDocument"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setIdDocument(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <Button 
                type="button" 
                onClick={async () => {
                  if (!idDocument) {
                    addToast('Please select a file first', 'error');
                    return;
                  }
                  const formData = new FormData();
                  formData.append('idDocument', idDocument);
                  try {
                    await api.post('/users/me/submit-verification', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    addToast('Verification request submitted successfully!', 'success');
                    const updatedProfile = await getProfile();
                    setUser(updatedProfile);
                  } catch (error) {
                    addToast('Failed to submit verification request', 'error');
                  }
                }}
              >
                Resubmit Verification
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600">Submit a government-issued ID to get your account verified with a blue checkmark.</p>
              {user?.subscription?.active && (
                <p className="text-sm text-blue-600">
                  ✓ Your premium subscription gives you priority processing - your request will be reviewed faster!
                </p>
              )}
              <div>
                <label htmlFor="idDocument" className="block mb-1">Upload ID Document (JPG, PNG, PDF)</label>
                <Input
                  id="idDocument"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => setIdDocument(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <Button 
                type="button" 
                onClick={async () => {
                  if (!idDocument) {
                    addToast('Please select a file first', 'error');
                    return;
                  }
                  const formData = new FormData();
                  formData.append('idDocument', idDocument);
                  try {
                    await api.post('/users/me/submit-verification', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    addToast('Verification request submitted successfully!', 'success');
                    const updatedProfile = await getProfile();
                    setUser(updatedProfile);
                  } catch (error) {
                    addToast('Failed to submit verification request', 'error');
                  }
                }}
              >
                Submit Verification
              </Button>
            </div>
          )}
        </div>
        <Button type="submit">Save Changes</Button>
      </form>
    </PageShell>
  );
}