import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/Logo';

const authSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  verificationCode: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      verificationCode: '',
    },
  });

  const handleEmailSignIn = async (values: AuthFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast.error('Invalid email or password');
        } else {
          throw error;
        }
        return;
      }

      if (data.session) {
        toast.success('Signed in successfully');
      }
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (values: AuthFormValues) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.user) {
        setEmail(values.email);
        setShowVerification(true);
        toast.success('Verification code sent to your email');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (values: AuthFormValues) => {
    setIsLoading(true);
    try {
      // In a real implementation, you would verify the code here
      toast.success('Email verified successfully! You can now sign in.');
      setShowVerification(false);
      setIsSignUp(false);
      form.reset();
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      // In a real implementation, you would resend the verification code here
      toast.success('Verification code resent');
    } catch (error: any) {
      console.error('Error resending code:', error);
      toast.error(error.message || 'Failed to resend code');
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-8">
      <div className="flex justify-center mb-8">
        <Logo />
      </div>

      <h1 className="text-[22px] font-medium text-gray-900 mb-6">
        {showVerification ? 'Verify your email' : isSignUp ? 'Create account' : 'Log in'}
      </h1>

      <div className="space-y-6">
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 font-normal border border-gray-300 bg-white hover:bg-gray-50"
          onClick={() => toast.info('Google sign-in coming soon')}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white">or</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(showVerification ? handleVerification : isSignUp ? handleEmailSignUp : handleEmailSignIn)} className="space-y-4">
            {showVerification ? (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  We've sent a verification code to {email}
                </p>
                <FormField
                  control={form.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Verification code"
                            className="h-11 bg-gray-50 border-gray-300"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={handleResendCode}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Send code
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Email" 
                          className="h-11 bg-gray-50 border-gray-300" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Password" 
                            className="h-11 bg-gray-50 border-gray-300 pr-10"
                            {...field} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {!isSignUp && !showVerification && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => toast.info('Password reset functionality coming soon')}
                >
                  Reset password
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-medium"
              disabled={isLoading}
            >
              {isLoading
                ? 'Please wait...'
                : showVerification
                ? 'Verify Email'
                : isSignUp
                ? 'Sign up'
                : 'Log in'}
            </Button>
          </form>
        </Form>

        {!showVerification && (
          <>
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => toast.info('Single sign-on coming soon')}
              >
                Use single sign-on
              </button>
            </div>

            <div className="text-center text-sm text-gray-600">
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => {
                      setIsSignUp(false);
                      setShowVerification(false);
                      form.reset();
                    }}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  No account?{' '}
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                    onClick={() => {
                      setIsSignUp(true);
                      setShowVerification(false);
                      form.reset();
                    }}
                  >
                    Create one
                  </button>
                </>
              )}
            </div>

            {isSignUp && (
              <div className="text-center text-xs text-gray-500">
                By creating an account, you agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}