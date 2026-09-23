import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
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
import Browsing from './pages/Browsing';
import Messages from './pages/Messages';
import Discover from './pages/Discover';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import SavedItems from './pages/SavedItems';
import ProductDetail from './pages/ProductDetail';
import Notifications from './pages/Notifications';

/**
 * `/home` was renamed to `/browsing`. Redirect, keeping any `?category=` or
 * `?collection=` params that older links carry.
 */
function LegacyHomeRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/browsing${search}`} replace />;
}

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

          <Route
            path="/discover"
            element={
              <ProtectedRoute>
                <Discover />
              </ProtectedRoute>
            }
          />

          <Route
            path="/browsing"
            element={
              <ProtectedRoute>
                <Browsing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          {/* Keep old links and bookmarks working after the Home → Browsing rename. */}
          <Route path="/home" element={<LegacyHomeRedirect />} />

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

          <Route
            path="/items/:id"
            element={
              <ProtectedRoute>
                <ProductDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

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
            element={<Navigate to="/browsing" replace />}
          />
          </Routes>
        </BrowserRouter>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
