
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LeadershipPage from "./pages/LeadershipPage";
import FaqPage from "./pages/FaqPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import LegalGuidesPage from "./pages/LegalGuidesPage";
import SecurityPrivacyPage from "./pages/SecurityPrivacyPage";
import PakistanLawsPage from "./pages/PakistanLawsPage";
import TermsPage from "./pages/TermsPage";
import HelpSupportPage from "./pages/HelpSupportPage";
import ChatPage from "./pages/ChatPage";
import DocumentsPage from "./pages/DocumentsPage";
import LawyersPage from "./pages/LawyersPage";
import LawyerDetailPage from "./pages/LawyerDetailPage";
import LawyerProfilePage from "./pages/LawyerProfilePage";
import NewsPage from "./pages/NewsPage";
import DictionaryPage from "./pages/DictionaryPage";
import BookReaderPage from "./pages/BookReaderPage";
import MessagingPage from "./pages/MessagingPage";
import CaseLawPage from "./pages/CaseLawPage";
import NotFound from "./pages/NotFound";
import RoleSelectionPage from "./pages/auth/RoleSelectionPage";
import ClientSignupPage from "./pages/auth/ClientSignupPage";
import LawyerSignupPage from "./pages/auth/LawyerSignupPage";
import LoginPage from "./pages/auth/LoginPage";
import OTPVerificationPage from "./pages/auth/OTPVerificationPage";
import ProfilePage from "./pages/auth/ProfilePage";
import AdminPanel from "./pages/admin/AdminPanel";
import LawyerDashboard from "./pages/lawyer/LawyerDashboard";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ChangePasswordPage from "./pages/auth/ChangePasswordPage";
import { useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { User } from "./services/api";
import { ThemeProvider } from "./contexts/ThemeContext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
          <Routes>
          {/* Auth routes without layout */}
          <Route path="/auth/role" element={<RoleSelectionPage />} />
          <Route path="/signup/client" element={<ClientSignupPage />} />
          <Route path="/signup/lawyer" element={<LawyerSignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          <Route 
            path="/change-password" 
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/lawyer-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['lawyer', 'admin']}>
                <LawyerDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Main app routes with layout */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/faq" element={<Layout><FaqPage /></Layout>} />
          <Route path="/how-it-works" element={<Layout><HowItWorksPage /></Layout>} />
          <Route path="/pricing" element={<Layout><PricingPage /></Layout>} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
          <Route path="/legal-guides" element={<Layout><LegalGuidesPage /></Layout>} />
          <Route path="/security-privacy" element={<Layout><SecurityPrivacyPage /></Layout>} />
          <Route path="/pakistan-laws" element={<Layout><PakistanLawsPage /></Layout>} />
          <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
          <Route path="/help" element={<Layout><HelpSupportPage /></Layout>} />
          <Route path="/leadership" element={<Layout><LeadershipPage /></Layout>} />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout><ChatPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Layout><DocumentsPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/lawyers" element={<Layout><LawyersPage /></Layout>} />
          <Route path="/lawyer/:id" element={<Layout><LawyerDetailPage /></Layout>} />
          <Route path="/lawyer-profile" element={
            <ProtectedRoute allowedRoles={['lawyer']}>
              <Layout><LawyerProfilePage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/news" element={<Layout><NewsPage /></Layout>} />
          <Route path="/messages" element={
            <ProtectedRoute>
              <Layout><MessagingPage /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/dictionary" element={<Layout><DictionaryPage /></Layout>} />
          <Route path="/book/:id" element={<Layout><BookReaderPage /></Layout>} />
          <Route path="/case-law" element={<Layout><CaseLawPage /></Layout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
