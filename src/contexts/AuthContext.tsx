
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useDatabase } from './DatabaseContext';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'faculty';
  status?: 'pending' | 'approved' | 'rejected';
  department?: string;
  phoneNumber?: string;
  password?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  role: string;
  setRole: (role: string) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => Promise<boolean>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { db } = useDatabase();

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Login attempt with email:', email);
      
      if (!db) {
        console.error('Database not initialized');
        return false;
      }

      // Find user in database
      const foundUser = await db.users.where('email').equals(email.trim()).first();
      console.log('Database query result:', foundUser);
      
      if (!foundUser) {
        console.log('User not found in database for email:', email);
        return false;
      }

      // Direct password comparison (plain text for now)
      const enteredPassword = password.trim();
      const storedPassword = foundUser.password?.trim();
      
      console.log('Password comparison - Entered:', enteredPassword, 'Stored:', storedPassword);
      
      if (storedPassword !== enteredPassword) {
        console.log('Password mismatch');
        return false;
      }

      // Check if user is approved (skip for admin)
      if (foundUser.role !== 'admin' && foundUser.status !== 'approved') {
        console.log('User not approved, status:', foundUser.status);
        return false;
      }

      // Create user object without password
      const userWithoutPassword: User = {
        id: foundUser.id?.toString() || '',
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
        status: foundUser.status,
        department: foundUser.department,
        phoneNumber: foundUser.phoneNumber,
        createdAt: foundUser.createdAt
      };
      
      setUser(userWithoutPassword);
      setRole(foundUser.role);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('role', foundUser.role);
      
      console.log('Login successful for user:', userWithoutPassword);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setRole('');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    console.log('User logged out successfully');
  };

  const signup = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<boolean> => {
    return register(userData);
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<boolean> => {
    try {
      if (!db) {
        console.error('Database not initialized');
        return false;
      }
      
      // Check if user already exists
      const existingUser = await db.users.where('email').equals(userData.email.trim()).first();
      if (existingUser) {
        console.log('User already exists');
        return false;
      }

      // Only allow faculty registration (admin account is predefined)
      if (userData.role !== 'faculty') {
        console.log('Only faculty registration allowed');
        return false;
      }

      // Add new user to database
      await db.users.add({
        name: userData.name.trim(),
        email: userData.email.trim(),
        password: userData.password.trim(),
        role: userData.role,
        department: userData.department,
        phoneNumber: userData.phoneNumber,
        status: 'pending', // Faculty accounts require admin approval
        createdAt: new Date().toISOString()
      });

      console.log('User registered successfully');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (!user || !db) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Create a clean update object without the id property
      const { id: _, ...dbUpdates } = updates;

      // Update in database using the numeric ID
      await db.users.update(parseInt(user.id), dbUpdates);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    setUser,
    role,
    setRole,
    isLoading,
    login,
    logout,
    signup,
    register,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
