import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Resume {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  isActive: boolean;
}

export default function MyAccount() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchResumes();
    }
  }, [user]);

  const fetchResumes = async () => {
    try {
      // Get active resume ID from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('active_resume_id')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // List files in user's folder
      const { data, error } = await supabase.storage
        .from('resumes')
        .list(`${user?.id}`, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        // If error is bucket not found, create it
        if (error.message.includes('Bucket not found')) {
          const { error: createError } = await supabase.storage
            .createBucket('resumes', { public: true });
          if (createError) throw createError;
          // Return empty array since bucket was just created
          setResumes([]);
          setActiveResumeId(null);
          return;
        }
        throw error;
      }

      const formattedResumes = (data || []).map(file => ({
        id: file.name,
        name: file.name,
        url: supabase.storage.from('resumes').getPublicUrl(`${user?.id}/${file.name}`).data.publicUrl,
        uploadedAt: new Date(file.created_at).toLocaleDateString(),
        isActive: file.name === profileData?.active_resume_id
      }));

      setResumes(formattedResumes);
      setActiveResumeId(profileData?.active_resume_id || null);
    } catch (error: any) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (resumes.length >= 2) {
      toast.error('Maximum 2 resumes allowed. Please remove one before uploading.');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `resume_${Date.now()}.pdf`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // If this is the first resume, set it as active
      if (resumes.length === 0) {
        await supabase
          .from('profiles')
          .update({ active_resume_id: fileName })
          .eq('id', user?.id);
      }

      toast.success('Resume uploaded successfully');
      fetchResumes();
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast.error('Failed to upload resume');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSetActive = async (resumeId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_resume_id: resumeId })
        .eq('id', user?.id);

      if (error) throw error;

      setActiveResumeId(resumeId);
      toast.success('Active resume updated');
      fetchResumes();
    } catch (error: any) {
      console.error('Error setting active resume:', error);
      toast.error('Failed to update active resume');
    }
  };

  const handleDelete = async (resumeId: string) => {
    setIsDeleting(resumeId);
    try {
      // Optimistically update UI
      setResumes(prev => prev.filter(resume => resume.id !== resumeId));
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([`${user?.id}/${resumeId}`]);

      if (storageError) throw storageError;

      // Update profile if deleting active resume
      if (resumeId === activeResumeId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            active_resume_id: null,
            resume_url: null
          })
          .eq('id', user?.id);

        if (profileError) throw profileError;
        setActiveResumeId(null);
      }

      toast.success('Resume deleted successfully');
    } catch (error: any) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
      // Revert UI on error
      fetchResumes();
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Resume Management</h1>

      <div className="space-y-6">
        {/* Active Resume Section */}
        <Card>
          <CardHeader>
            <CardTitle>Active Resume</CardTitle>
            <CardDescription>
              This resume will be used for your job applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resumes.find(r => r.id === activeResumeId) ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">
                      {resumes.find(r => r.id === activeResumeId)?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded on {resumes.find(r => r.id === activeResumeId)?.uploadedAt}
                    </p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <a href={resumes.find(r => r.id === activeResumeId)?.url} target="_blank" rel="noopener noreferrer">
                    View Resume
                  </a>
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 italic">No active resume set</p>
            )}
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>
              Upload your resume in PDF format (maximum 2 resumes allowed)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  disabled={isUploading || resumes.length >= 2}
                  className="flex-1"
                />
                <Button
                  disabled={isUploading || resumes.length >= 2}
                  className="min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              {resumes.length >= 2 && (
                <p className="text-amber-600 text-sm">
                  Maximum number of resumes reached. Delete one to upload a new resume.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumes List */}
        <Card>
          <CardHeader>
            <CardTitle>My Resumes</CardTitle>
            <CardDescription>
              Manage your uploaded resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resumes.length === 0 ? (
                <p className="text-gray-500 italic">No resumes uploaded yet</p>
              ) : (
                resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{resume.name}</p>
                        <p className="text-sm text-gray-500">
                          Uploaded on {resume.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(resume.id)}
                        disabled={resume.id === activeResumeId}
                      >
                        {resume.id === activeResumeId ? (
                          <>
                            <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" />
                            Active
                          </>
                        ) : (
                          'Set as Active'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(resume.id)}
                        disabled={isDeleting === resume.id}
                      >
                        {isDeleting === resume.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}