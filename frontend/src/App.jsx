import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LeaderboardPage from './pages/LeaderboardPage';
import UserProfilePage from './pages/UserProfilePage';
import AddUser from './components/UserManagement/AddUser';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

/**
 * Root application component that sets up client-side routing for the app.
 *
 * Routes:
 * - "/" renders the LeaderboardPage.
 * - "/user/:id" renders the UserProfilePage for the given user id.
 * - "/add-user" renders the AddUser page wrapped with ProtectedRoute to enforce access control.
 *
 * @returns {JSX.Element} The router and route configuration for the application.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LeaderboardPage />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route 
          path="/add-user" 
          element={
            <ProtectedRoute>
              <AddUser />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;