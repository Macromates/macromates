import { BrowserRouter, Route, Routes } from "react-router";
import AuthenticationLayout from "../components/auth/AuthenticationLayout";
import SignInForm from "../components/auth/SignInForm";
import SignUpForm from "../components/auth/SignUpForm";
import Dashboard from "../pages/Dashboard";
import PhotoCapture from "../pages/PhotoCapture";
import AnalysisResults from "../pages/AnalysisResults";
import CongratsSection from "../components/auth/CongratsSection";
import VerificationSection from "../components/auth/VerificationSection.jsx";
import ForgotPasswordSection from "../components/auth/ForgotPasswordSection.jsx";
import ResetCodeSection from "../components/auth/ResetCodeSection.jsx";
import ResetPasswordSection from "../components/auth/ResetPasswordSection.jsx";
import OnboardingWizard from "../components/Onboarding/Onboarding.jsx";
import AIValidation from "../pages/AIValidation.jsx";
import Profile from "../pages/UserProfile.jsx";
import ProtectedRoutes from "./ProtectedRoutes.jsx";
import Settings from "../components/Settings/Settings.jsx";
import EditProfile from "../components/Profile/EditProfile.jsx";
import GoalsList from "../components/ai/GoalsList.jsx";
import Track from "../pages/Track.jsx";
import DayView from "../pages/DayView.jsx";

const PageRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Layout Routes */}
        <Route path="/" element={<AuthenticationLayout />}>
          <Route index element={<SignInForm />} />
          <Route path="signup" element={<SignUpForm />} />
          <Route path="congratulations" element={<CongratsSection />} />
          <Route path="verification" element={<VerificationSection />} />
          <Route path="forgot-password" element={<ForgotPasswordSection />} />
          <Route path="reset-code" element={<ResetCodeSection />} />
          <Route path="reset-password" element={<ResetPasswordSection />} />
          <Route path="onboarding" element={<OnboardingWizard />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ai-validation" element={<AIValidation />} />
          <Route path="goals" element={<GoalsList />} />
          <Route path="profile" element={<Profile />} />
          <Route path="users/:profileId" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="track" element={<Track />} />
          <Route path="day/:date" element={<DayView />} />
          <Route path="camera" element={<PhotoCapture />} />
          <Route path="analysis-results" element={<AnalysisResults />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default PageRoutes;
