/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActiveTab } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomeView } from './components/home/HomeView';
import { MaterialsView } from './components/materials/MaterialsView';
import { AssignmentsView } from './components/assignments/AssignmentsView';
import { QuizzesView } from './components/quizzes/QuizzesView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { AnnouncementsView } from './components/announcements/AnnouncementsView';
import { StudentGateModal } from './components/common/StudentGateModal';
import { TeacherLoginModal } from './components/common/TeacherLoginModal';
import { AnnouncementService, subscribe } from './services/db';

function MainContent() {
  const { isLecturer, isTeacherModalOpen, closeTeacherModal } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [announcementsCount, setAnnouncementsCount] = useState<number>(0);

  useEffect(() => {
    const updateAnnCount = () => {
      setAnnouncementsCount(AnnouncementService.getAll().length);
    };
    updateAnnCount();
    const unsub = subscribe('announcements', updateAnnCount);
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] font-sans antialiased text-slate-800">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadAnnouncementsCount={announcementsCount}
      />

      {/* Full 16:9 Widescreen Expanded Main Container */}
      <main className="flex-1 w-full max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        {activeTab === 'home' && <HomeView onNavigate={setActiveTab} />}
        {activeTab === 'materials' && <MaterialsView />}
        {activeTab === 'assignments' && <AssignmentsView />}
        {activeTab === 'quizzes' && <QuizzesView />}
        {activeTab === 'analytics' && (
          isLecturer ? (
            <AnalyticsView />
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200 max-w-xl mx-auto my-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-[#F28C28] flex items-center justify-center mx-auto text-2xl font-bold">
                🔒
              </div>
              <h2 className="text-xl font-bold text-[#17365D]">Khu vực Thống kê kết quả dành riêng cho Giáo viên</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Vui lòng đăng nhập với tài khoản giáo viên <strong>(ngothimaianh / 2026)</strong> để xem thống kê kết quả học tập và xuất bảng điểm.
              </p>
              <div className="pt-2">
                <TeacherLoginModal
                  isOpen={true}
                  onClose={() => setActiveTab('home')}
                  onSuccess={() => setActiveTab('analytics')}
                />
              </div>
            </div>
          )
        )}
        {activeTab === 'announcements' && <AnnouncementsView />}
      </main>

      <Footer />

      {/* Mandatory Student Registration/Verification Modal */}
      <StudentGateModal />

      {/* Teacher Authentication Modal */}
      <TeacherLoginModal
        isOpen={isTeacherModalOpen}
        onClose={closeTeacherModal}
        onSuccess={() => setActiveTab('analytics')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
