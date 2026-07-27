// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Avatar } from '../../Avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Building2, MapPin, Calendar, Award, Briefcase, GraduationCap, FolderOpen, ThumbsUp, CheckCircle, PlayCircle } from 'lucide-react';
import { ProfessionalProfile, SkillAssessment, SkillEndorsement, WorkExperience, Education, Certification, Project, AVAILABLE_SKILL_ASSESSMENTS } from '../../../lib/types';
import { EditProfessionalProfileForm } from './EditProfessionalProfileForm';
import { EndorseSkillForm } from './EndorseSkillForm';
import { TakeSkillAssessmentForm } from './TakeSkillAssessmentForm';

interface ProfessionalProfileViewProps {
  communityId: string;
  currentUserId: string;
  profile?: ProfessionalProfile;
  isOwnProfile?: boolean;
}

export const ProfessionalProfileView = ({ 
  communityId, 
  currentUserId, 
  profile, 
  isOwnProfile = false 
}: ProfessionalProfileViewProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showEndorseForm, setShowEndorseForm] = useState<string | null>(null);
  const [showAssessmentForm, setShowAssessmentForm] = useState<string | null>(null);
  const [displayProfile, setDisplayProfile] = useState(profile || {
    userId: currentUserId,
    headline: 'Add your professional headline',
    currentCompany: '',
    industry: '',
    location: '',
    about: 'Tell the community about your professional background...',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: []
  } as ProfessionalProfile);

  const hasSkillAssessment = (skillId: string) => {
    return AVAILABLE_SKILL_ASSESSMENTS.some(a => a.skillId === skillId);
  };

  const handleAssessmentComplete = (assessment: SkillAssessment) => {
    setDisplayProfile(prev => ({
      ...prev,
      skills: prev.skills.map(skill => 
        skill.skillId === assessment.skillId
          ? { ...skill, assessment }
          : skill
      )
    }));
    setShowAssessmentForm(null);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar userId={displayProfile.userId} className="w-20 h-20" />
              <div>
                <CardTitle className="text-2xl">{displayProfile.headline}</CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  {displayProfile.currentCompany && (
                    <span className="flex items-center gap-2">
                      <Building2 size={16} />
                      {displayProfile.currentCompany}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <MapPin size={16} />
                    {displayProfile.location || 'Add your location'}
                  </span>
                  <span className="flex items-center gap-2">
                    <Briefcase size={16} />
                    {displayProfile.industry || 'Add your industry'}
                  </span>
                </CardDescription>
              </div>
            </div>
            {isOwnProfile && (
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button>Edit Profile</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Your Professional Profile</DialogTitle>
                  </DialogHeader>
                  <EditProfessionalProfileForm 
                    communityId={communityId}
                    currentProfile={displayProfile}
                    onSave={() => setIsEditing(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4">
            <h4 className="font-semibold mb-2">About</h4>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{displayProfile.about}</p>
          </div>
        </CardContent>
      </Card>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="text-blue-500" />
            Skills & Endorsements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayProfile.skills.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No skills added yet. {isOwnProfile && 'Edit your profile to add your professional skills.'}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {displayProfile.skills.map(skill => (
                <div key={skill.skillId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      {skill.assessment?.passed && (
                        <CheckCircle size={14} className="text-green-500" title="Verified skill assessment" />
                      )}
                    </div>
                    {!isOwnProfile && (
                      <Dialog open={showEndorseForm === skill.skillId} onOpenChange={(open) => setShowEndorseForm(open ? skill.skillId : null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="secondary" className="gap-1">
                            <ThumbsUp size={14} />
                            Endorse ({skill.endorsements.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Endorse {skill.name}</DialogTitle>
                          </DialogHeader>
                          <EndorseSkillForm 
                            communityId={communityId}
                            profileUserId={displayProfile.userId}
                            skillId={skill.skillId}
                            onSubmit={() => setShowEndorseForm(null)}
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                    {isOwnProfile && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{skill.endorsements.length} endorsements</span>
                        {hasSkillAssessment(skill.skillId) && !skill.assessment && (
                          <Dialog open={showAssessmentForm === skill.skillId} onOpenChange={(open) => setShowAssessmentForm(open ? skill.skillId : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="default" className="gap-1">
                                <PlayCircle size={14} />
                                Take Assessment
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Skill Assessment: {skill.name}</DialogTitle>
                              </DialogHeader>
                              <TakeSkillAssessmentForm
                                communityId={communityId}
                                currentUserId={currentUserId}
                                skillId={skill.skillId}
                                skillName={skill.name}
                                onComplete={handleAssessmentComplete}
                                onCancel={() => setShowAssessmentForm(null)}
                              />
                            </DialogContent>
                          </Dialog>
                        )}
                        {skill.assessment && (
                          <Badge variant={skill.assessment.passed ? "default" : "secondary"}>
                            {skill.assessment.passed ? 'Verified' : `${skill.assessment.score.toFixed(0)}%`}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {skill.endorsements.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Endorsed by {skill.endorsements.slice(0, 3).map(e => e.endorserName).join(', ')}
                      {skill.endorsements.length > 3 && ` and ${skill.endorsements.length - 3} others`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Experience Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="text-green-500" />
            Work Experience
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayProfile.experience.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No experience added yet. {isOwnProfile && 'Edit your profile to add your work history.'}</p>
          ) : (
            <div className="space-y-6">
              {displayProfile.experience.map((exp: WorkExperience) => (
                <div key={exp.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 pb-4">
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{exp.company} • {exp.location}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                    {exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{exp.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="text-purple-500" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayProfile.education.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No education added yet. {isOwnProfile && 'Edit your profile to add your educational background.'}</p>
          ) : (
            <div className="space-y-6">
              {displayProfile.education.map((edu: Education) => (
                <div key={edu.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 pb-4">
                  <h4 className="font-semibold">{edu.school}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{edu.degree} in {edu.fieldOfStudy}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                    {new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications Section */}
      {displayProfile.certifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="text-amber-500" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {displayProfile.certifications.map((cert: Certification) => (
                <div key={cert.id} className="p-3 border rounded-lg">
                  <h4 className="font-medium">{cert.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{cert.issuingOrganization}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Issued {new Date(cert.issueDate).toLocaleDateString()}
                    {cert.expirationDate && ` • Expires ${new Date(cert.expirationDate).toLocaleDateString()}`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Section */}
      {displayProfile.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="text-indigo-500" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayProfile.projects.map((project: Project) => (
                <div key={project.id} className="p-4 border rounded-lg">
                  <h4 className="font-semibold">{project.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{project.description}</p>
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};