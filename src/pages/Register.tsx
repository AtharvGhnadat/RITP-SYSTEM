import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, UserPlus } from 'lucide-react';
const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phoneNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    register
  } = useAuth();
  const navigate = useNavigate();
  const departments = ['Computer Engineering', 'Information Technology', 'Electronics Engineering', 'Mechanical Engineering', 'Civil Engineering', 'AIML', 'Data Science'];
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }
    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: 'faculty',
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        status: 'pending'
      });
      if (success) {
        toast({
          title: "Registration Successful",
          description: "Your account is pending admin approval. You will be notified once approved."
        });
        navigate('/login');
      } else {
        setError('Registration failed. Email might already be registered.');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message || 'Registration failed');
      } else {
        setError('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3 sm:p-4">
      <div className="w-full max-w-md my-[25px]">
        <div className="mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 touch-target">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm sm:text-base">Back to Home</span>
          </Button>
        </div>

        <Card className="clean-card shadow-lg animate-fade-in">
          <CardHeader className="clean-card-header space-y-2 text-center mx-[10px]">
            <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Faculty Registration
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Create your account for attendance management
            </p>
          </CardHeader>
          <CardContent className="clean-card-content mx-[10px]">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive" className="animate-slide-up">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>}
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base font-medium">Full Name *</Label>
                <Input id="name" type="text" placeholder="Enter your full name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} required disabled={isLoading} className="input-clean" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base font-medium">Email *</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required disabled={isLoading} className="input-clean" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm sm:text-base font-medium">Department *</Label>
                <Select value={formData.department} onValueChange={value => handleInputChange('department', value)} disabled={isLoading}>
                  <SelectTrigger className="input-clean">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg">
                    {departments.map(dept => <SelectItem key={dept} value={dept} className="hover:bg-accent">
                        {dept}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm sm:text-base font-medium">Phone Number</Label>
                <Input id="phoneNumber" type="tel" placeholder="Enter your phone number" value={formData.phoneNumber} onChange={e => handleInputChange('phoneNumber', e.target.value)} disabled={isLoading} className="input-clean" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base font-medium">Password *</Label>
                <Input id="password" type="password" placeholder="Create a password (min. 6 characters)" value={formData.password} onChange={e => handleInputChange('password', e.target.value)} required disabled={isLoading} minLength={6} className="input-clean" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm sm:text-base font-medium">Confirm Password *</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm your password" value={formData.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} required disabled={isLoading} className="input-clean" />
              </div>
              
              <Button type="submit" className="w-full btn-primary touch-target" disabled={isLoading || !formData.department || !formData.name || !formData.email || !formData.password}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium focus-clean">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Note:</strong> Faculty accounts require admin approval before you can access the system.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>&copy; 2024 All rights reserved to Atharv Ghandat</p>
          <p className="font-semibold">Developed by Atharv Ghandat</p>
        </div>
      </div>
    </div>;
};
export default Register;