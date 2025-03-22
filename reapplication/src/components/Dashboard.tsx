import { useEffect, useState } from 'react';
import { Filter, Plus, Bell, Search, Bookmark, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import JobTable from '@/components/JobTable';
import JobInput from '@/components/JobInput';
import SettingsPage from '@/components/Settings';
import MyAccount from '@/components/MyAccount';
import { Job } from '@/lib/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';

const navigationItems = [
  { icon: Search, label: 'Dashboard', view: 'dashboard', active: true },
  { icon: Filter, label: 'Application Tracker', view: 'tracker' },
  { icon: Search, label: 'Job Search', view: 'search' },
  { icon: Bookmark, label: 'Saved Jobs', view: 'saved' },
  { icon: Settings, label: 'Settings', view: 'settings' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    totalApplied: 0,
    interviewed: 0,
    rejected: 0,
    pending: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user?.id)
        .order('applied_date', { ascending: false });

      if (error) throw error;

      const formattedJobs = data.map(job => ({
        ...job,
        appliedDate: new Date(job.applied_date).toISOString(),
        jobStatus: job.job_status,
      }));

      setJobs(formattedJobs);
      updateStats(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    }
  };

  const updateStats = (jobs: Job[]) => {
    const stats = jobs.reduce((acc, job) => ({
      totalApplied: acc.totalApplied + 1,
      interviewed: acc.interviewed + (job.status === 'Interviewing' ? 1 : 0),
      rejected: acc.rejected + (job.status === 'Rejected' ? 1 : 0),
      pending: acc.pending + (job.status === 'Applied' ? 1 : 0),
    }), {
      totalApplied: 0,
      interviewed: 0,
      rejected: 0,
      pending: 0,
    });

    setStats(stats);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const addJob = async (job: Job) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          user_id: user?.id,
          company: job.company,
          position: job.position,
          job_status: job.jobStatus,
          location: job.location,
          status: job.status,
          applied_date: new Date(job.appliedDate).toISOString().split('T')[0],
          description: job.description,
          recruiter_email: job.recruiterEmail,
        }])
        .select()
        .single();

      if (error) throw error;

      setJobs(prev => [data, ...prev]);
      updateStats([...jobs, data]);
      setIsDialogOpen(false);
      toast.success('Job added successfully');
    } catch (error) {
      console.error('Error adding job:', error);
      toast.error('Failed to add job');
    }
  };

  const handleNavigation = (item: typeof navigationItems[0]) => {
    setCurrentView(item.view);
  };

  const renderView = () => {
    switch (currentView) {
      case 'settings':
        return <SettingsPage />;
      case 'account':
        return <MyAccount />;
      case 'dashboard':
      default:
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl font-semibold mb-2">{stats.totalApplied}</div>
                <div className="text-gray-600">Total Applied</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl font-semibold mb-2">{stats.interviewed}</div>
                <div className="text-gray-600">Interviewed</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl font-semibold mb-2">{stats.rejected}</div>
                <div className="text-gray-600">Rejected</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl font-semibold mb-2">{stats.pending}</div>
                <div className="text-gray-600">Pending Response</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-b gap-4">
                <h2 className="text-lg font-semibold">Recent Applications</h2>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Job
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogTitle>Add New Job Application</DialogTitle>
                      <JobInput onAddJob={addJob} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <JobTable jobs={jobs} />
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={cn(
        "w-64 bg-white border-r shrink-0 transition-transform duration-300",
        "fixed inset-y-0 z-50 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-indigo-600 text-white p-2 rounded">
                <Search className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg">Flashjobs</span>
            </div>
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <a
                  key={item.label}
                  href="#"
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm rounded-lg',
                    currentView === item.view
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b shrink-0">
          <div className="flex h-full items-center px-4 gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Filter className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-4 ml-auto">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-10 w-10">
                    <div 
                      className="h-10 w-10 rounded-full bg-[#2D3748] flex items-center justify-center"
                      style={{ 
                        fontSize: '16px',
                        fontWeight: 600,
                        fontFamily: 'Arial, sans-serif',
                        lineHeight: 1
                      }}
                    >
                      <span className="text-white">
                        {user?.email?.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={() => setCurrentView('account')}>
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCurrentView('settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}