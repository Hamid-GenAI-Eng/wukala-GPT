
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
          
          {/* Main app routes with layout */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/leadership" element={<Layout><LeadershipPage /></Layout>} />
          <Route path="/chat" element={<Layout><ChatPage /></Layout>} />
          <Route path="/documents" element={<Layout><DocumentsPage /></Layout>} />
          <Route path="/lawyers" element={<Layout><LawyersPage /></Layout>} />
          <Route path="/lawyer/:id" element={<Layout><LawyerDetailPage /></Layout>} />
          <Route path="/lawyer-profile" element={<Layout><LawyerProfilePage /></Layout>} />
          <Route path="/news" element={<Layout><NewsPage /></Layout>} />
          <Route path="/messages" element={<Layout><MessagingPage /></Layout>} />
          <Route path="/dictionary" element={<Layout><DictionaryPage /></Layout>} />
          <Route path="/book/:id" element={<Layout><BookReaderPage /></Layout>} />
          <Route path="/case-law" element={<Layout><CaseLawPage /></Layout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
