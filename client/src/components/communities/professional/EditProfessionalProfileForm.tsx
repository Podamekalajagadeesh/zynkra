import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { useToast } from '../../../hooks/useToast';
import { ProfessionalProfile, WorkExperience, Education, Certification, Project, Skill } from '../../../lib/types';

// Common skills for professional communities
const availableSkills: Skill[] = [
  { id: 'skill-1', name: 'JavaScript', category: 'Software Development' },
  { id: 'skill-2', name: 'TypeScript', category: 'Software Development' },
  { id: 'skill-3', name: 'React', category: 'Software Development' },
  { id: 'skill-4', name: 'Node.js', category: 'Software Development' },
  { id: 'skill-5', name: 'Python', category: 'Software Development' },
  { id: 'skill-6', name: 'Machine Learning', category: 'Data Science' },
  { id: 'skill-7', name: 'Digital Marketing', category: 'Marketing' },
  { id: 'skill-8', name: 'Product Management', category: 'Product' },
  { id: 'skill-9', name: 'UI/UX Design', category: 'Design' },
  { id: 'skill-10', name: 'Data Analysis', category: 'Data Science' },
];

interface EditProfessionalProfileFormProps {
  communityId: string;
  currentProfile: ProfessionalProfile;
  onSave: () => void;
}

export const EditProfessionalProfileForm = ({ communityId, currentProfile, onSave }: EditProfessionalProfileFormProps) => {
  const { showToast } = useToast();
  const [headline, setHeadline] = useState(currentProfile.headline);
  const [currentCompany, setCurrentCompany] = useState(currentProfile.currentCompany || '');
  const [industry, setIndustry] = useState(currentProfile.industry);
  const [location, setLocation] = useState(currentProfile.location);
  const [about, setAbout] = useState(currentProfile.about);
  const [experience, setExperience] = useState<WorkExperience[]>(currentProfile.experience);
  const [education, setEducation] = useState<Education[]>(currentProfile.education);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentProfile.skills.map(s => s.skillId));
  const [certifications, setCertifications] = useState<Certification[]>(currentProfile.certifications);
  const [projects, setProjects] = useState<Project[]>(currentProfile.projects);

  const addExperience = () => {
    setExperience([...experience, {
      id: Date.now().toString(),
      title: '',
      company: '',
      location: '',
      employmentType: 'full-time',
      startDate: '',
      description: ''
    }]);
  };

  const addEducation = () => {
    setEducation([...education, {
      id: Date.now().toString(),
      school: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: ''
    }]);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would save the profile to the server
    const updatedProfile: ProfessionalProfile = {
      ...currentProfile,
      headline,
      currentCompany,
      industry,
      location,
      about,
      experience,
      education,
      skills: selectedSkills.map(skillId => {
        const skill = availableSkills.find(s => s.id === skillId)!;
        return {
          skillId,
          name: skill.name,
          endorsements: currentProfile.skills.find(s => s.skillId === skillId)?.endorsements || []
        };
      }),
      certifications,
      projects
    };

    console.log('Updated professional profile:', updatedProfile);
    
    showToast({
      title: 'Profile saved!',
      description: 'Your professional profile has been updated.',
      type: 'success'
    });

    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Professional Headline</label>
          <Input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g., Senior Software Engineer at Tech Corp"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Company</label>
            <Input
              value={currentCompany}
              onChange={(e) => setCurrentCompany(e.target.value)}
              placeholder="Where do you work now?"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Industry</label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Software, Finance, Healthcare"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., San Francisco, CA"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">About</label>
          <Textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Tell the community about your professional background..."
            className="min-h-[150px]"
          />
        </div>
      </div>

      {/* Skills */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Skills</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableSkills.map(skill => (
            <label key={skill.id} className="flex items-center gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                checked={selectedSkills.includes(skill.id)}
                onChange={() => toggleSkill(skill.id)}
                className="rounded"
              />
              <span className="text-sm">{skill.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Work Experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Work Experience</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addExperience}>Add Experience</Button>
        </div>
        {experience.map((exp, index) => (
          <div key={exp.id} className="p-4 border rounded-lg space-y-3">
            <Input
              value={exp.title}
              onChange={(e) => {
                const updated = [...experience];
                updated[index].title = e.target.value;
                setExperience(updated);
              }}
              placeholder="Job Title"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={exp.company}
                onChange={(e) => {
                  const updated = [...experience];
                  updated[index].company = e.target.value;
                  setExperience(updated);
                }}
                placeholder="Company"
              />
              <Input
                value={exp.location}
                onChange={(e) => {
                  const updated = [...experience];
                  updated[index].location = e.target.value;
                  setExperience(updated);
                }}
                placeholder="Location"
              />
            </div>
            <Textarea
              value={exp.description}
              onChange={(e) => {
                const updated = [...experience];
                updated[index].description = e.target.value;
                setExperience(updated);
              }}
              placeholder="Describe your role and achievements..."
            />
          </div>
        ))}
      </div>

      {/* Education */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Education</h3>
          <Button type="button" variant="secondary" size="sm" onClick={addEducation}>Add Education</Button>
        </div>
        {education.map((edu, index) => (
          <div key={edu.id} className="p-4 border rounded-lg space-y-3">
            <Input
              value={edu.school}
              onChange={(e) => {
                const updated = [...education];
                updated[index].school = e.target.value;
                setEducation(updated);
              }}
              placeholder="School/University"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={edu.degree}
                onChange={(e) => {
                  const updated = [...education];
                  updated[index].degree = e.target.value;
                  setEducation(updated);
                }}
                placeholder="Degree"
              />
              <Input
                value={edu.fieldOfStudy}
                onChange={(e) => {
                  const updated = [...education];
                  updated[index].fieldOfStudy = e.target.value;
                  setEducation(updated);
                }}
                placeholder="Field of Study"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 border-t p-4 -mx-4">
        <Button type="button" variant="secondary" onClick={onSave}>Cancel</Button>
        <Button type="submit">Save Profile</Button>
      </div>
    </form>
  );
};