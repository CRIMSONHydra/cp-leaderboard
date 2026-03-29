import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LeaderboardPage from './pages/LeaderboardPage';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SpacesPage from './pages/SpacesPage';
import SpaceLeaderboardPage from './pages/SpaceLeaderboardPage';
import SpaceSettingsPage from './pages/SpaceSettingsPage';
import AddUser from './components/UserManagement/AddUser';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LeaderboardPage />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated */}
        <Route path="/spaces" element={<ProtectedRoute><SpacesPage /></ProtectedRoute>} />
        <Route path="/spaces/:spaceId" element={<ProtectedRoute><SpaceLeaderboardPage /></ProtectedRoute>} />
        <Route path="/spaces/:spaceId/settings" element={<ProtectedRoute><SpaceSettingsPage /></ProtectedRoute>} />

        {/* Legacy admin */}
        <Route path="/add-user" element={<ProtectedRoute><AddUser /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
