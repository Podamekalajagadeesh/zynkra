import { Avatar } from '../../Avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Search, Briefcase, Building2 } from 'lucide-react';
import { ProfessionalProfile } from '../../../lib/types';
import { useState } from 'react';

interface MembersPanelProps {
  profiles: { userId: string; profile: ProfessionalProfile }[];
  onSelectProfile: (profile: ProfessionalProfile) => void;
  currentUserId: string;
}

export const MembersPanel = ({ profiles, onSelectProfile, currentUserId }: MembersPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const industries = [...new Set(profiles.map(p => p.profile.industry))];
  
  const filteredProfiles = profiles.filter(({ profile }) => {
    const matchesSearch = profile.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.about.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = !industryFilter || profile.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  if (profiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Members</CardTitle>
          <CardDescription>Be the first to add your professional profile to this community!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search members by name, title, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        >
          <option value="">All Industries</option>
          {industries.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>
      </div>

      {/* Members Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredProfiles.map(({ userId, profile }) => (
          <Card 
            key={userId} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectProfile(profile)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar userId={userId} className="w-12 h-12" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">{profile.headline.split(' at ')[0]}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1 truncate">
                    <Building2 size={14} />
                    {profile.currentCompany || 'Independent'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{profile.about}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {profile.skills.slice(0, 3).map(skill => (
                  <Badge key={skill.skillId} variant="secondary" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
                {profile.skills.length > 3 && (
                  <span className="text-xs text-gray-500">+{profile.skills.length - 3} more</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};