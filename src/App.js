import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Library, { CalendarDemo } from './pages/Library';
import Pricing from './pages/Pricing';
import AICoachPage from './pages/AI Coach';
import LoadingPage from './components/LoadingPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';
import './components/InfiniteScroll.css';
import { ThemeProvider, useTheme } from './ThemeContext';
import AskQuestions from './pages/AskQuestions';
import ReportBugs from './pages/ReportBugs';
import Community from './pages/Community';
import CommunityForum from './pages/CommunityForum';
import CommunityPhotos from './pages/CommunityPhotos';
import CommunityWorkouts from './pages/CommunityWorkouts';
import Nutrition from './pages/Nutrition';
import NutritionProtein from './pages/NutritionProtein';
import NutritionMeals from './pages/NutritionMeals';
import NutritionPlans from './pages/NutritionPlans';
import WorkoutLogs from './pages/WorkoutLogs';
import VideoLibrary from './pages/VideoLibrary';
import FormCheckerAI from './pages/FormCheckerAI';
import MyRoutines from './pages/MyRoutines';
import ExerciseEncyclopedia from './pages/ExerciseEncyclopedia';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './pages/Profile';
import ChatWidget from './components/ui/ChatWidget';

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingPage />;

  return (
    <div className={`app-container ${theme}`}>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <Routes>
          {/* Public route */}
          <Route path="/" element={<Home />} />
          
          {/* Protected routes */}
          <Route path="/library" element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          } />
          <Route path="/library/calender" element={
            <ProtectedRoute>
              <CalendarDemo />
            </ProtectedRoute>
          } />
          <Route path="/library/workout-logs" element={
            <ProtectedRoute>
              <WorkoutLogs />
            </ProtectedRoute>
          } />
          <Route path="/library/video-library" element={
            <ProtectedRoute>
              <VideoLibrary />
            </ProtectedRoute>
          } />
          <Route path="/library/form-checker" element={
            <ProtectedRoute>
              <FormCheckerAI />
            </ProtectedRoute>
          } />
          <Route path="/library/routines" element={
            <ProtectedRoute>
              <MyRoutines />
            </ProtectedRoute>
          } />
          <Route path="/library/exercises" element={
            <ProtectedRoute>
              <ExerciseEncyclopedia />
            </ProtectedRoute>
          } />
          <Route path="/pricing" element={
            <ProtectedRoute>
              <Pricing />
            </ProtectedRoute>
          } />
          <Route path="/aicoach" element={
            <ProtectedRoute>
              <AICoachPage />
            </ProtectedRoute>
          } />
          <Route path="/contact/ask-questions" element={
            <ProtectedRoute>
              <AskQuestions />
            </ProtectedRoute>
          } />
          <Route path="/contact/report-bugs" element={
            <ProtectedRoute>
              <ReportBugs />
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          }>
            <Route path="forum" element={
              <ProtectedRoute>
                <CommunityForum />
              </ProtectedRoute>
            } />
            <Route path="photos" element={
              <ProtectedRoute>
                <CommunityPhotos />
              </ProtectedRoute>
            } />
            <Route path="workouts" element={
              <ProtectedRoute>
                <CommunityWorkouts />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="/nutrition" element={
            <ProtectedRoute>
              <Nutrition />
            </ProtectedRoute>
          }>
            <Route path="protein" element={
              <ProtectedRoute>
                <NutritionProtein />
              </ProtectedRoute>
            } />
            <Route path="meals" element={
              <ProtectedRoute>
                <NutritionMeals />
              </ProtectedRoute>
            } />
            <Route path="plans" element={
              <ProtectedRoute>
                <NutritionPlans />
              </ProtectedRoute>
            } />
          </Route>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;