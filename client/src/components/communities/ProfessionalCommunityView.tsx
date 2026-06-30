import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Avatar } from '../Avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Briefcase, Users, FileText, Award, Plus, Building2, MapPin, Clock } from 'lucide-react';
import { Community, JobListing, ProfessionalProfile, SkillEndorsement } from '../../lib/types';
import { JobListingsPanel } from './professional/JobListingsPanel';
import { MembersPanel } from './professional/MembersPanel';
import { ProfessionalProfileView } from './professional/ProfessionalProfileView';
import { CreateJobForm } from './professional/CreateJobForm';

interface ProfessionalCommunityViewProps {
  community: Community;
  currentUserId: string;
}

export const ProfessionalCommunityView = ({ community, currentUserId }: ProfessionalCommunityViewProps) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedProfile, setSelectedProfile] = useState<ProfessionalProfile | null>(null);

  const jobListings = community.jobListings || [];
  const professionalProfiles = community.professionalProfiles || [];
  const isAdmin = community.members.find(m => m.id === currentUserId && m.role === 'owner') !== undefined;

  return (
    <div className="space-y-6">
      {/* Community Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Briefcase className="text-blue-500" />
                {community.name}
              </CardTitle>
              <CardDescription className="mt-2">{community.description}</CardDescription>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {community.memberCount.toLocaleString()} members
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={16} />
                  {jobListings.length} job openings
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {community.industryTags?.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
            {isAdmin && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus size={16} />
                    Post Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Job Listing</DialogTitle>
                  </DialogHeader>
                  <CreateJobForm communityId={community.id} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Updates</CardTitle>
              <CardDescription>Latest discussions and professional news from {community.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea placeholder="Share an update, article, or professional insight with the community..." />
                <div className="flex justify-end">
                  <Button>Post Update</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <JobListingsPanel jobListings={jobListings} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersPanel 
            profiles={professionalProfiles} 
            onSelectProfile={setSelectedProfile} 
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfessionalProfileView 
            communityId={community.id}
            currentUserId={currentUserId}
          />
        </TabsContent>
      </Tabs>

      {/* Selected Profile Modal */}
      {selectedProfile && (
        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <ProfessionalProfileView 
              communityId={community.id}
              profile={selectedProfile}
              isOwnProfile={selectedProfile.userId === currentUserId}
              currentUserId={currentUserId}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};