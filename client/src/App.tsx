import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import MoodTrackerPage from './pages/MoodTrackerPage';
import JournalPage from './pages/JournalPage';
import ResourcesPage from './pages/ResourcesPage';
import AboutPage from './pages/AboutPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import { Login, Signup } from './pages/LoginSignup';
import CalendarPage from './pages/CalendarPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/mood-tracker" element={<MoodTrackerPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
