
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Dexie, { Table } from 'dexie';

// Database Models
export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'faculty';
  department?: string;
  phoneNumber?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface Student {
  id?: number;
  name: string;
  rollNo: string;
  email: string;
  department: string;
  year: string;
  phoneNumber: string;
  parentMobile: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Subject {
  id?: number;
  name: string;
  code: string;
  department: string;
  year: string;
  facultyId?: number;
  classroomNumber?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id?: number;
  studentId: number;
  subjectId: number;
  date: string;
  status: 'present' | 'absent';
  facultyId: number;
  createdAt: string;
  studentAttendance?: any;
  isArchived?: boolean;
  archivedAt?: string;
  timeMarked?: string;
}

export interface SystemSettings {
  id: number;
  collegeStartTime: string;
  collegeEndTime: string;
  theme: 'light' | 'dark' | 'system';
  openaiEnabled: boolean;
  openaiApiKey?: string;
  notificationsEnabled: boolean;
  attendanceThreshold: number;
  minimumAttendancePercentage: number;
  collegeLogoUrl?: string;
  storageWarningThreshold?: number;
  defaultMessageTone?: string;
  updatedAt: string;
}

export interface Notification {
  id?: number;
  userId: string;
  userRole: 'admin' | 'faculty';
  type: 'info' | 'warning' | 'alert' | 'reminder';
  title: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface FacultySubject {
  id?: number;
  facultyId: string;
  subjectId: string;
  classroomNumber: string;
  department: string;
  year: string;
  time: string;
  createdAt: string;
}

export interface Batch {
  id?: number;
  name: string;
  department: string;
  year: string;
  studentIds: number[];
  classroom?: string;
  assignedFacultyId?: string;
  assignedSubjectId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id?: number;
  userId: string;
  userRole: 'admin' | 'faculty';
  action: string;
  actionType?: string;
  details: string;
  adminUserName?: string;
  timestamp: string;
}

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  authorId: string;
  authorRole: 'admin' | 'faculty';
  targetAudience: 'all' | 'faculty' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageTemplate {
  id?: string;
  name: string;
  content: string;
  type: 'attendance' | 'general';
  category: 'General' | 'Attendance Alert' | 'Defaulter Notice' | 'Reminder';
  tone: 'strict' | 'polite' | 'friendly';
  variables: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface TimetableAssignment {
  id?: number;
  facultyId: string;
  subjectId: string;
  day: string;
  startTime: string;
  endTime: string;
  classroom: string;
  department: string;
  year: string;
  time: string;
  classroomNumber: string;
  createdAt: string;
}

// Database Class
export class AttendanceDatabase extends Dexie {
  users!: Table<User>;
  students!: Table<Student>;
  subjects!: Table<Subject>;
  attendance!: Table<AttendanceRecord>;
  settings!: Table<SystemSettings>;
  notifications!: Table<Notification>;
  facultySubjects!: Table<FacultySubject>;
  attendanceRecords!: Table<AttendanceRecord>;
  batches!: Table<Batch>;
  auditLogs!: Table<AuditLog>;
  announcements!: Table<Announcement>;
  systemSettings!: Table<SystemSettings>;
  messageTemplates!: Table<MessageTemplate>;
  timetableAssignments!: Table<TimetableAssignment>;

  constructor() {
    super('AttendanceManagementDB');
    
    // CRITICAL FIX: Updated schema version from 1 to 2 and added 'name' index to subjects store
    this.version(2).stores({
      users: '++id, email, role, status',
      students: '++id, rollNo, email, department, year',
      subjects: '++id, name, code, department, year, facultyId', // Added 'name' index to fix SchemaError
      attendance: '++id, studentId, subjectId, date, facultyId',
      settings: '++id',
      notifications: '++id, userId, userRole, type, isRead, isDismissed',
      facultySubjects: '++id, facultyId, subjectId, department, year',
      attendanceRecords: '++id, studentId, subjectId, date, facultyId',
      batches: '++id, department, year',
      auditLogs: '++id, userId, userRole, timestamp',
      announcements: '++id, authorId, authorRole, targetAudience, isActive',
      systemSettings: '++id',
      messageTemplates: '++id, name, type, category',
      timetableAssignments: '++id, facultyId, subjectId, day'
    });
  }
}

// Context
interface DatabaseContextType {
  db: AttendanceDatabase;
  initializeDatabase: () => Promise<void>;
  isInitialized: boolean;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  logAuditAction: (action: string, details: string, userId: string, userRole: 'admin' | 'faculty') => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [db] = useState(() => new AttendanceDatabase());
  const [isInitialized, setIsInitialized] = useState(false);

  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      await db.notifications.add({
        ...notification,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  };

  const logAuditAction = async (action: string, details: string, userId: string, userRole: 'admin' | 'faculty') => {
    try {
      await db.auditLogs.add({
        userId,
        userRole,
        action,
        actionType: action,
        details,
        adminUserName: undefined,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  };

  const initializeDatabase = async () => {
    try {
      console.log('Initializing database...');
      await db.open();

      // Clear existing admin accounts to avoid duplicates
      await db.users.where('email').equals('mayur.gund@ritppune.com').delete();

      // Create the admin account with exact credentials
      console.log('Creating admin account...');
      const adminId = await db.users.add({
        name: 'Mayur Gund',
        email: 'mayur.gund@ritppune.com',
        password: 'mayur@ritp07', // Store as plain text for now
        role: 'admin',
        department: 'Administration',
        phoneNumber: '+91-9999999999',
        status: 'approved',
        createdAt: new Date().toISOString()
      });
      console.log('Admin account created with ID:', adminId);

      // Verify admin account was created
      const verifyAdmin = await db.users.where('email').equals('mayur.gund@ritppune.com').first();
      console.log('Verified admin account:', verifyAdmin);

      // Initialize default system settings with light theme
      const settingsExists = await db.settings.count();
      if (settingsExists === 0) {
        await db.settings.add({
          id: 1,
          collegeStartTime: '09:00',
          collegeEndTime: '17:00',
          theme: 'light',
          openaiEnabled: false,
          notificationsEnabled: true,
          attendanceThreshold: 75,
          minimumAttendancePercentage: 75,
          collegeLogoUrl: '',
          storageWarningThreshold: 80,
          defaultMessageTone: 'formal',
          updatedAt: new Date().toISOString()
        });
      }

      // Initialize systemSettings table with light theme
      const systemSettingsExists = await db.systemSettings.count();
      if (systemSettingsExists === 0) {
        await db.systemSettings.add({
          id: 1,
          collegeStartTime: '09:00',
          collegeEndTime: '17:00',
          theme: 'light',
          openaiEnabled: false,
          notificationsEnabled: true,
          attendanceThreshold: 75,
          minimumAttendancePercentage: 75,
          collegeLogoUrl: '',
          storageWarningThreshold: 80,
          defaultMessageTone: 'formal',
          updatedAt: new Date().toISOString()
        });
      }

      setIsInitialized(true);
      console.log('Database initialized successfully with clean light theme setup');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  };

  useEffect(() => {
    initializeDatabase();
  }, []);

  const value: DatabaseContextType = {
    db,
    initializeDatabase,
    isInitialized,
    createNotification,
    logAuditAction
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
