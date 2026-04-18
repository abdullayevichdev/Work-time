import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/layout/Navbar';
import { HomePage } from '@/components/home/HomePage';
import { AuthPage } from '@/components/auth/AuthPage';
import { DashboardPage } from '@/components/dashboard/DashboardPage';
import { JobsPage } from '@/components/jobs/JobsPage';
import { JobDetailsPage } from '@/components/jobs/JobDetailsPage';
import { TalentsPage } from '@/components/talents/TalentsPage';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { MessagesPage } from '@/components/messages/MessagesPage';
import '@/lib/i18n';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full h-full will-change-[opacity,transform]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-mesh relative">
        <div className="noise-bg" />
        <Navbar />
        <main>
          <PageTransition>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/jobs" element={<JobsPage />} />
              <Route path="/jobs/:id" element={<JobDetailsPage />} />
              <Route path="/talents" element={<TalentsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </main>
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}
