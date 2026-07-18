import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import api from '../../lib/api';

const PreservationFocus = {
  LANGUAGE_ARCHIVE: 'language_archive',
  TRADITION_ARCHIVE: 'tradition_archive',
  MEMORY_ARCHIVE: 'memory_archive',
  ORAL_HISTORY: 'oral_history',
  CULTURAL_EDUCATION: 'cultural_education',
};

const ArchiveMaterialType = {
  AUDIO: 'audio',
  VIDEO: 'video',
  TEXT: 'text',
  IMAGE: 'image',
  STORY: 'story',
  TRANSLATION: 'translation',
};

const CommunityRole = {
  ARCHIVIST: 'archivist',
  LINGUIST: 'linguist',
  STORYTELLER: 'storyteller',
  CULTURAL_STEWARD: 'cultural_steward',
};

interface CulturalArchiveEntry {
  id: string;
  communityId: string;
  authorId?: string;
  materialType: string;
  title: string;
  description: string;
  language?: string;
  sourceOrTranscript?: string;
  mediaUrl?: string;
  createdAt: string;
  author?: { id: string; username?: string; email?: string };
  librarySummary?: { title: string; summary: string; materialType: string; language: string };
}

interface CulturalPreservationCommunity {
  id: string;
  name: string;
  focusAreas: string[];
  languages?: string[];
  description?: string;
  archiveMethods?: string[];
  memberCount: number;
  archiveEntries?: CulturalArchiveEntry[];
  creator?: any;
  createdAt: string;
}

interface CulturalPreservationCommunityMember {
  id: string;
  communityId: string;
  userId?: string;
  role?: string;
  preferredLanguage?: string;
  joinedAt: string;
  community?: CulturalPreservationCommunity;
}

export const CulturalPreservationCommunities: React.FC = () => {
  const [communities, setCommunities] = useState<CulturalPreservationCommunity[]>([]);
  const [myMemberships, setMyMemberships] = useState<CulturalPreservationCommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>(CommunityRole.ARCHIVIST);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('English');
  const [archiveForm, setArchiveForm] = useState({
    communityId: '',
    title: '',
    materialType: ArchiveMaterialType.STORY,
    language: 'English',
    description: '',
    sourceOrTranscript: '',
    mediaUrl: '',
  });

  const fetchData = async () => {
    try {
      const [commsRes, memsRes] = await Promise.all([
        api.get('/cultural-preservation-communities'),
        api.get('/cultural-preservation-communities/user/my-memberships'),
      ]);
      setCommunities(commsRes.data);
      setMyMemberships(memsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!archiveForm.communityId && communities.length > 0) {
      setArchiveForm((current) => ({ ...current, communityId: communities[0].id }));
    }
  }, [communities, archiveForm.communityId]);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === archiveForm.communityId),
    [communities, archiveForm.communityId],
  );

  const isMember = (communityId: string) => myMemberships.some((membership) => membership.communityId === communityId);

  const joinCommunity = async (id: string) => {
    try {
      await api.post(`/cultural-preservation-communities/${id}/join`, {
        role: selectedRole,
        preferredLanguage: selectedLanguage,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveCommunity = async (id: string) => {
    try {
      await api.delete(`/cultural-preservation-communities/${id}/leave`);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const createArchiveEntry = async () => {
    if (!archiveForm.communityId || !archiveForm.title.trim() || !archiveForm.description.trim()) {
      return;
    }

    try {
      await api.post(`/cultural-preservation-communities/${archiveForm.communityId}/archive`, {
        title: archiveForm.title,
        materialType: archiveForm.materialType,
        language: archiveForm.language,
        description: archiveForm.description,
        sourceOrTranscript: archiveForm.sourceOrTranscript,
        mediaUrl: archiveForm.mediaUrl,
      });
      setArchiveForm((current) => ({
        ...current,
        title: '',
        description: '',
        sourceOrTranscript: '',
        mediaUrl: '',
      }));
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getFocusBadge = (focus: string) => {
    const colors: Record<string, string> = {
      [PreservationFocus.LANGUAGE_ARCHIVE]: 'bg-emerald-100 text-emerald-800',
      [PreservationFocus.TRADITION_ARCHIVE]: 'bg-amber-100 text-amber-800',
      [PreservationFocus.MEMORY_ARCHIVE]: 'bg-cyan-100 text-cyan-800',
      [PreservationFocus.ORAL_HISTORY]: 'bg-violet-100 text-violet-800',
      [PreservationFocus.CULTURAL_EDUCATION]: 'bg-rose-100 text-rose-800',
    };
    return colors[focus] || 'bg-gray-100 text-gray-800';
  };

  const getArchiveBadge = (materialType: string) => {
    const colors: Record<string, string> = {
      [ArchiveMaterialType.AUDIO]: 'bg-sky-100 text-sky-800',
      [ArchiveMaterialType.VIDEO]: 'bg-indigo-100 text-indigo-800',
      [ArchiveMaterialType.TEXT]: 'bg-slate-100 text-slate-800',
      [ArchiveMaterialType.IMAGE]: 'bg-teal-100 text-teal-800',
      [ArchiveMaterialType.STORY]: 'bg-rose-100 text-rose-800',
      [ArchiveMaterialType.TRANSLATION]: 'bg-amber-100 text-amber-800',
    };
    return colors[materialType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-center text-gray-500">Loading cultural preservation communities...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">Cultural Preservation Communities</h2>
        <p className="text-gray-500 mt-2">
          Groups that archive endangered languages, traditions, and family memories with searchable digital records
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Share an archive entry</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Community</Label>
            <Select value={archiveForm.communityId} onValueChange={(value) => setArchiveForm((current) => ({ ...current, communityId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a community" />
              </SelectTrigger>
              <SelectContent>
                {communities.map((community) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Material type</Label>
            <Select value={archiveForm.materialType} onValueChange={(value) => setArchiveForm((current) => ({ ...current, materialType: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ArchiveMaterialType).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {key.replaceAll('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={archiveForm.title} onChange={(event) => setArchiveForm((current) => ({ ...current, title: event.target.value }))} placeholder="Grandmother's harvest song" />
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Input value={archiveForm.language} onChange={(event) => setArchiveForm((current) => ({ ...current, language: event.target.value }))} placeholder="Quechua" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Description</Label>
            <Textarea
              value={archiveForm.description}
              onChange={(event) => setArchiveForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Describe the language sample, tradition, or memory in detail"
              rows={4}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Transcript or source notes</Label>
            <Textarea
              value={archiveForm.sourceOrTranscript}
              onChange={(event) => setArchiveForm((current) => ({ ...current, sourceOrTranscript: event.target.value }))}
              placeholder="Optional transcription, translation, or source context"
              rows={3}
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Media URL</Label>
            <Input value={archiveForm.mediaUrl} onChange={(event) => setArchiveForm((current) => ({ ...current, mediaUrl: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={createArchiveEntry} disabled={!isMember(archiveForm.communityId)}>
              Share archive entry
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 mb-6">
        <Card className="mb-2">
          <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Your role when joining</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CommunityRole).map(([key, value]) => (
                    <SelectItem key={key} value={value}>{key.replaceAll('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Your preferred language</Label>
              <Input value={selectedLanguage} onChange={(event) => setSelectedLanguage(event.target.value)} placeholder="English" />
            </div>
          </CardContent>
        </Card>

        {communities.map((community) => (
          <Card key={community.id}>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  {community.description && <p className="text-sm text-gray-500 mt-1">{community.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {community.focusAreas.map((focus) => (
                    <Badge key={focus} className={getFocusBadge(focus)}>
                      {focus.replaceAll('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {(community.languages ?? []).map((language) => (
                      <Badge key={language} className="bg-slate-100 text-slate-800">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Archive methods</h4>
                  <div className="flex flex-wrap gap-2">
                    {(community.archiveMethods ?? []).map((method) => (
                      <Badge key={method} className="bg-zinc-100 text-zinc-800">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Recent archive entries</h4>
                <div className="space-y-3">
                  {(community.archiveEntries ?? []).slice(0, 3).map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-sm">{entry.title}</p>
                        <Badge className={getArchiveBadge(entry.materialType)}>
                          {entry.materialType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{entry.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        {entry.language && <span>Language: {entry.language}</span>}
                        {entry.author?.username && <span>Contributor: {entry.author.username}</span>}
                      </div>
                      {entry.librarySummary && (
                        <div className="mt-3 rounded-md border border-teal-200 bg-teal-50 p-2 text-sm text-teal-900">
                          <p className="font-semibold">{entry.librarySummary.title}</p>
                          <p className="mt-1">{entry.librarySummary.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {(community.archiveEntries ?? []).length === 0 && (
                    <p className="text-sm text-gray-500">No archive entries yet. Add the first oral history, translation, or memory.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 justify-between flex-wrap">
                <p className="text-sm text-gray-500">Members: {community.memberCount}</p>
                {isMember(community.id) ? (
                  <Button variant="destructive" onClick={() => leaveCommunity(community.id)}>
                    Leave
                  </Button>
                ) : (
                  <Button onClick={() => joinCommunity(community.id)}>Join Community</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {communities.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">No cultural preservation communities yet</p>
            </CardContent>
          </Card>
        )}
      </div>
      {selectedCommunity && !isMember(selectedCommunity.id) && (
        <p className="text-sm text-gray-500">Join {selectedCommunity.name} to publish archive entries there.</p>
      )}
    </div>
  );
};