import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SystemConfig } from '../types';
import { UserService, initializeDatabase, subscribe, DEFAULT_LECTURER } from '../services/db';

const STUDENT_STORAGE_KEY = 'tl_active_student_v2';
const TEACHER_MODE_KEY = 'tl_teacher_mode_active_v2';

interface AuthContextType {
  currentUser: UserProfile | null;
  studentProfile: UserProfile | null;
  hasStudentProfile: boolean;
  systemConfig: SystemConfig;
  isLecturer: boolean;
  isStudent: boolean;
  isAuthenticated: boolean;
  saveStudentProfile: (data: {
    fullName: string;
    studentId: string;
    studentClass: string;
    school: string;
  }) => void;
  loginTeacher: (username: string, pass: string) => boolean;
  exitTeacherMode: () => void;
  isTeacherModalOpen: boolean;
  openTeacherModal: () => void;
  closeTeacherModal: () => void;
  isStudentModalOpen: boolean;
  openStudentModal: () => void;
  closeStudentModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [studentProfile, setStudentProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TEACHER_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [systemConfig, setSystemConfig] = useState<SystemConfig>(UserService.getConfig());
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  useEffect(() => {
    initializeDatabase();
    setSystemConfig(UserService.getConfig());

    const unsubConfig = subscribe('config', () => {
      setSystemConfig(UserService.getConfig());
    });

    return () => {
      unsubConfig();
    };
  }, []);

  const hasStudentProfile = Boolean(
    studentProfile?.displayName?.trim() &&
    studentProfile?.studentId?.trim() &&
    studentProfile?.studentClass?.trim() &&
    studentProfile?.school?.trim()
  );

  const saveStudentProfile = (data: {
    fullName: string;
    studentId: string;
    studentClass: string;
    school: string;
  }) => {
    const formattedId = data.studentId.trim().toUpperCase();
    const formattedClass = data.studentClass.trim().toUpperCase();
    const formattedSchool = data.school.trim();
    const formattedName = data.fullName.trim();

    const updated: UserProfile = {
      uid: studentProfile?.uid || `student-${Date.now()}`,
      displayName: formattedName,
      studentId: formattedId,
      studentClass: formattedClass,
      school: formattedSchool,
      email: `${formattedId.toLowerCase()}@pccc.edu.vn`,
      role: 'student',
      course: 'Lý luận Nhà nước và Pháp luật',
      createdAt: studentProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(updated));
    UserService.registerOrUpdateUser(updated);
    setStudentProfile(updated);
    setIsStudentModalOpen(false);

    // If currently not in teacher mode, this is also currentUser
    if (!isTeacherMode) {
      UserService.setCurrentUser(updated);
    }
  };

  const loginTeacher = (username: string, pass: string): boolean => {
    if (UserService.verifyTeacher(username, pass)) {
      setIsTeacherMode(true);
      try {
        localStorage.setItem(TEACHER_MODE_KEY, 'true');
      } catch (e) {
        // Ignore
      }
      UserService.setCurrentUser(DEFAULT_LECTURER);
      setIsTeacherModalOpen(false);
      return true;
    }
    return false;
  };

  const exitTeacherMode = () => {
    setIsTeacherMode(false);
    try {
      localStorage.removeItem(TEACHER_MODE_KEY);
    } catch (e) {
      // Ignore
    }
    if (studentProfile) {
      UserService.setCurrentUser(studentProfile);
    } else {
      UserService.setCurrentUser(null);
    }
  };

  const openTeacherModal = () => setIsTeacherModalOpen(true);
  const closeTeacherModal = () => setIsTeacherModalOpen(false);

  const openStudentModal = () => setIsStudentModalOpen(true);
  const closeStudentModal = () => setIsStudentModalOpen(false);

  // currentUser depends on isTeacherMode
  const currentUser: UserProfile | null = isTeacherMode
    ? DEFAULT_LECTURER
    : studentProfile;

  const isLecturer = isTeacherMode;
  const isStudent = !isTeacherMode;
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        studentProfile,
        hasStudentProfile,
        systemConfig,
        isLecturer,
        isStudent,
        isAuthenticated,
        saveStudentProfile,
        loginTeacher,
        exitTeacherMode,
        isTeacherModalOpen,
        openTeacherModal,
        closeTeacherModal,
        isStudentModalOpen,
        openStudentModal,
        closeStudentModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
