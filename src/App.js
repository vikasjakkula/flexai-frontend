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

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingPage />;

  return (
    <div className={`app-container ${theme}`}>
      <Navbar />
      <main style={{ paddingTop: '80px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/library/calender" element={<CalendarDemo />} />
          <Route path="/library/workout-logs" element={<WorkoutLogs />} />
          <Route path="/library/video-library" element={<VideoLibrary />} />
          <Route path="/library/form-checker" element={<FormCheckerAI />} />
          <Route path="/library/routines" element={<MyRoutines />} />
          <Route path="/library/exercises" element={<ExerciseEncyclopedia />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/aicoach" element={<AICoachPage />} />
          <Route path="/contact/ask-questions" element={<AskQuestions />} />
          <Route path="/contact/report-bugs" element={<ReportBugs />} />
          <Route path="/community" element={<Community />}>
            <Route path="forum" element={<CommunityForum />} />
            <Route path="photos" element={<CommunityPhotos />} />
            <Route path="workouts" element={<CommunityWorkouts />} />
          </Route>
          <Route path="/nutrition" element={<Nutrition />}>
            <Route path="protein" element={<NutritionProtein />} />
            <Route path="meals" element={<NutritionMeals />} />
            <Route path="plans" element={<NutritionPlans />} />
          </Route>
        </Routes>
      </main>
      <Footer />
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
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;