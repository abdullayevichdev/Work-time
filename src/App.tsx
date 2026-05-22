import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { OnboardingWizard } from '@/components/profile/OnboardingWizard';
import { RequestsPage } from '@/components/profile/RequestsPage';
import { ProfileCompletionBanner } from '@/components/profile/ProfileCompletionBanner';
import { RequireCompleteProfile } from '@/components/profile/RequireCompleteProfile';
import '@/lib/i18n';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full will-change-[opacity,transform]"
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/onboarding" element={<OnboardingWizard />} />
          
          <Route path="/dashboard" element={<RequireCompleteProfile><DashboardPage /></RequireCompleteProfile>} />
          <Route path="/jobs" element={<RequireCompleteProfile><JobsPage /></RequireCompleteProfile>} />
          <Route path="/jobs/:id" element={<RequireCompleteProfile><JobDetailsPage /></RequireCompleteProfile>} />
          <Route path="/talents" element={<RequireCompleteProfile><TalentsPage /></RequireCompleteProfile>} />
          <Route path="/profile" element={<RequireCompleteProfile><ProfilePage /></RequireCompleteProfile>} />
          <Route path="/profile/:id" element={<RequireCompleteProfile><ProfilePage /></RequireCompleteProfile>} />
          <Route path="/messages" element={<RequireCompleteProfile><MessagesPage /></RequireCompleteProfile>} />
          <Route path="/requests" element={<RequireCompleteProfile><RequestsPage /></RequireCompleteProfile>} />
          
          <Route path="/admin" element={<div className="pt-32 pb-20 container mx-auto px-6"><AdminDashboard /></div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen relative overflow-x-hidden">
        {/* Fixed Background Layers */}
        <div className="bg-mesh" />
        <div className="noise-bg" />
        
        <Navbar />
        <div className="pt-20">
          <ProfileCompletionBanner />
        </div>
        <main className="relative z-10">
          <AnimatedRoutes />
        </main>
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}
