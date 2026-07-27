import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import { GraduationCap, Users, BookOpen, Plus, Clock, Award } from 'lucide-react';
import { api } from '../lib/api';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  author: { id: string; username: string; displayName: string };
  enrollmentCount: number;
  lessonCount: number;
  status: string;
  createdAt: string;
}

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses/feed');
      setCourses(response.data.courses || []);
    } catch (error) {
      addToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell eyebrow="Learn" title="Courses" description="Learn new skills from expert creators.">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Browse Courses</h2>
          <Link to="/courses/new"><Button icon={<Plus size={16} />}>Create Course</Button></Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl h-64" />)}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No courses yet.</p>
            <Link to="/courses/new"><Button className="mt-4" icon={<Plus size={16} />}>Create First Course</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <Link key={course.id} to={`/courses/${course.id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                {course.coverImage ? (
                  <img src={course.coverImage} alt={course.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                    <GraduationCap size={48} className="text-white/80" />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-dark-900 dark:text-white mb-1">{course.title}</h3>
                  <p className="text-sm text-dark-500 line-clamp-2 mb-3">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-dark-500">
                    <span className="flex items-center gap-1"><BookOpen size={12} />{course.lessonCount} lessons</span>
                    <span className="flex items-center gap-1"><Users size={12} />{course.enrollmentCount} enrolled</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dark-100 dark:border-dark-700">
                    <span className="text-sm font-medium text-dark-700 dark:text-dark-300">
                      {course.author.displayName || course.author.username}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default CoursesPage;
