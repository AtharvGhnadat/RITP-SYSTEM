
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useDatabase } from './contexts/DatabaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';

// Import page components
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Faculty from './pages/admin/Faculty';
import Subjects from './pages/admin/Subjects';
import FacultyRequests from './pages/admin/FacultyRequests';
import Settings from './pages/admin/Settings';
import Import from './pages/admin/Import';
import Analytics from './pages/admin/Analytics';
import Templates from './pages/admin/Templates';
import AuditLog from './pages/admin/AuditLog';
import Batches from './pages/admin/Batches';
import DataManagement from './pages/admin/DataManagement';
import TimetableManagement from './pages/admin/Timetable';
import FacultyTimetables from './pages/admin/FacultyTimetables';

// Faculty Pages
const FacultyDashboard = React.lazy(() => import('./pages/faculty/Dashboard'));
import AttendanceMarking from './pages/faculty/AttendanceMarking';
import History from './pages/faculty/History';
import AddStudent from './pages/faculty/AddStudent';
import StudentSearch from './pages/faculty/StudentSearch';
import MessageGenerator from './pages/faculty/MessageGenerator';
import Defaulters from './pages/faculty/Defaulters';

const App = () => {
  const { user, setUser, setRole } = useAuth();
  const { initializeDatabase, isInitialized } = useDatabase();

  useEffect(() => {
    initializeDatabase();
  }, [initializeDatabase]);

  useEffect(() => {
    if (isInitialized) {
      const storedUser = localStorage.getItem('user');
      const storedRole = localStorage.getItem('role');
      if (storedUser && storedRole) {
        console.log('Restoring user session:', storedUser);
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      }
    }
  }, [isInitialized, setUser, setRole]);

  // ProtectedRoute component
  const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles: string[], children: React.ReactNode }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="attendance-theme">
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-foreground">Unauthorized Access</h1>
                  <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
              </div>
            } />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><Students /></ProtectedRoute>} />
            <Route path="/admin/faculty" element={<ProtectedRoute allowedRoles={['admin']}><Faculty /></ProtectedRoute>} />
            <Route path="/admin/subjects" element={<ProtectedRoute allowedRoles={['admin']}><Subjects /></ProtectedRoute>} />
            <Route path="/admin/faculty-requests" element={<ProtectedRoute allowedRoles={['admin']}><FacultyRequests /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/admin/import" element={<ProtectedRoute allowedRoles={['admin']}><Import /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute allowedRoles={['admin']}><Templates /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>} />
            <Route path="/admin/audit-log" element={<ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>} />
            <Route path="/admin/batches" element={<ProtectedRoute allowedRoles={['admin']}><Batches /></ProtectedRoute>} />
            <Route path="/admin/data-management" element={<ProtectedRoute allowedRoles={['admin']}><DataManagement /></ProtectedRoute>} />
            <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['admin']}><TimetableManagement /></ProtectedRoute>} />
            <Route path="/admin/faculty-timetables" element={<ProtectedRoute allowedRoles={['admin']}><FacultyTimetables /></ProtectedRoute>} />

            {/* Faculty Routes */}
            <Route path="/faculty/dashboard" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/attendance" element={<ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>} />
            <Route path="/faculty/attendance/:subjectId" element={<ProtectedRoute allowedRoles={['faculty']}><AttendanceMarking /></ProtectedRoute>} />
            <Route path="/faculty/history" element={<ProtectedRoute allowedRoles={['faculty']}><History /></ProtectedRoute>} />
            <Route path="/faculty/add-student" element={<ProtectedRoute allowedRoles={['faculty']}><AddStudent /></ProtectedRoute>} />
            <Route path="/faculty/student-search" element={<ProtectedRoute allowedRoles={['faculty']}><StudentSearch /></ProtectedRoute>} />
            <Route path="/faculty/message-generator" element={<ProtectedRoute allowedRoles={['faculty']}><MessageGenerator /></ProtectedRoute>} />
            <Route path="/faculty/defaulters" element={<ProtectedRoute allowedRoles={['faculty']}><Defaulters /></ProtectedRoute>} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
