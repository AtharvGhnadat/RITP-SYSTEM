import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, LogIn } from 'lucide-react';
const Login = () => {
  const {
    login,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log('Login form submitted with email:', formData.email);
    try {
      const success = await login(formData.email, formData.password);
      if (success) {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const role = storedUser.role;
        toast({
          title: "Login Successful",
          description: `Welcome back, ${storedUser.name}!`
        });

        // Redirect based on role
        switch (role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'faculty':
            navigate('/faculty/dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password. Please check your credentials and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 touch-target">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm sm:text-base">Back to Home</span>
          </Button>
        </div>

        <Card className="clean-card shadow-lg animate-fade-in rounded-3xl my-[100px]">
          <CardHeader className="clean-card-header text-center space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <img src="/uploads/logo.png" alt="College Logo" className="h-7 w-7 sm:h-8 sm:w-8 rounded-md flex-shrink-0" />
              <span className="text-lg sm:text-xl font-bold text-foreground">Smart Attendance</span>
            </div>
            <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl text-foreground">
              <LogIn className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Login
            </CardTitle>
            <p className="text-muted-foreground text-sm sm:text-base">Welcome back to your dashboard</p>
          </CardHeader>
          <CardContent className="clean-card-content space-y-4 sm:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} placeholder="Enter your email" required disabled={isSubmitting} className="input-clean" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base font-medium">Password</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} placeholder="Enter your password" required disabled={isSubmitting} className="input-clean" />
              </div>

              <Button type="submit" className="w-full btn-primary touch-target" disabled={isSubmitting || isLoading}>
                {isSubmitting || isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="text-center">
                <Link to="/forgot-password" className="text-sm text-primary hover:underline focus-clean">
                  Forgot your password?
                </Link>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-primary hover:underline font-medium focus-clean">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>&copy; 2024 All rights reserved to Atharv Ghandat</p>
          <p>Developed by Atharv Ghandat</p>
        </div>
      </div>
    </div>;
};
export default Login;