import { AuthProvider } from '@/components/auth/AuthProvider';
import Dashboard from '@/components/Dashboard';
import AuthForm from '@/components/auth/AuthForm';
import AuthCallback from '@/components/auth/AuthCallback';
import { useAuth } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/ui/sonner';
import { X } from 'lucide-react';

function AuthenticatedApp() {
  const { user, session, loading } = useAuth();

  // Handle the callback route
  if (window.location.pathname === '/auth/callback') {
    return <AuthCallback />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-t from-[#dfe9f3] to-white">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  // If we have a session and user, show the dashboard
  if (session && user) {
    return <Dashboard />;
  }

  // Otherwise, show the auth form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-t from-[#dfe9f3] to-white">
      <AuthForm />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
      <Toaster 
        closeButton
        richColors
        toastOptions={{
          classNames: {
            closeButton: "absolute right-2 top-2 p-1 rounded-full hover:bg-gray-100"
          }
        }}
      />
    </AuthProvider>
  );
}

export default App;