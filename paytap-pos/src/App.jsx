// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import Orders from "./pages/Orders";
import ContactSupport from "./pages/ContactSupport";
import Header from "./components/shared/Header";
import Menu from "./pages/Menu";
import ProtectedRoute from "./components/ProtectedRoute";

// Layout component for protected routes
const ProtectedLayout = ({ children }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Home />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Orders />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/menu"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <Menu />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contact-support"
            element={
              <ProtectedRoute>
                <ProtectedLayout>
                  <ContactSupport />
                </ProtectedLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;