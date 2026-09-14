import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { SearchProvider } from './context/SearchProvider';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/ResetPassword';
import SellItem from './pages/SellItem';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import SavedItems from './pages/SavedItems';
import ProductDetail from './pages/ProductDetail';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <BrowserRouter>
          <Navbar />

        <Routes>
          <Route
            path="/"
            element={<Navigate to="/discover" replace />}
          />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/verify-code"
            element={<VerifyCode />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <Welcome />
              </ProtectedRoute>
            }
          />

          <Route path="/discover" element={<Discover />} />

          <Route path="/about" element={<AboutUs />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          <Route path="/terms-of-use" element={<TermsOfUse />} />

          <Route path="/home" element={<Home />} />

          <Route
            path="/sell-item"
            element={
              <ProtectedRoute>
                <SellItem />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/saved"
            element={
              <ProtectedRoute>
                <SavedItems />
              </ProtectedRoute>
            }
          />

          <Route path="/items/:id" element={<ProductDetail />} />

          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/home" replace />}
          />
          </Routes>
        </BrowserRouter>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
