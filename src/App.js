import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AskQuestion from './pages/AskQuestion';
import Login from './admin/pages/Login';
import Signup from './admin/pages/Signup';
import QuestionDetail from './admin/pages/QuestionDetail';
import AnswerQuestion from './admin/pages/AnswerQuestion';
import Header from './components/Header';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NotificationBell from './admin/components/NotificationBell';

function AdminRoute({ children }) {
  const { role } = useAuth();
  if (role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ask" element={<AskQuestion />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/admin/question/:id"
            element={
              <AdminRoute>
                <QuestionDetail />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/answer/:id"
            element={
              <AdminRoute>
                <AnswerQuestion />
              </AdminRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div className="min-h-screen flex flex-col items-center justify-center text-white">
                  <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
                  <NotificationBell />
                </div>
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
