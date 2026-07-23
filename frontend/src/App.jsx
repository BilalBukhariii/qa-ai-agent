import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import RequirementAnalyzer from "./pages/RequirementAnalyzer.jsx";
import TestCaseGenerator from "./pages/TestCaseGenerator.jsx";
import TestCases from "./pages/TestCases.jsx";
import Signup from "./pages/Signup.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/test-cases"
        element={
          <PrivateRoute>
            <TestCases />
          </PrivateRoute>
        }
      />
      <Route
        path="/requirement-analyzer"
        element={
          <PrivateRoute>
            <RequirementAnalyzer />
          </PrivateRoute>
        }
      />
      <Route
        path="/test-case-generator"
        element={
          <PrivateRoute>
            <TestCaseGenerator />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
