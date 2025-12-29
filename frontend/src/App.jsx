import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LeaderboardPage from './pages/LeaderboardPage';
import UserProfilePage from './pages/UserProfilePage';
import AddUser from './components/UserManagement/AddUser';
import ProtectedRoute from './components/common/ProtectedRoute';
import './App.css';

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
