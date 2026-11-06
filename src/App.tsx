import { Navigate, Route, Routes } from "react-router-dom";
import { AnonymousOnly, HomeRedirect, RequireAuth } from "./auth/routes";
import { Dashboard } from "./pages/Dashboard";
import { ForgotPassword } from "./pages/ForgotPassword";
import { LegalPlaceholder } from "./pages/LegalPlaceholder";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ResetPassword } from "./pages/ResetPassword";
import { VerifyPhone } from "./pages/VerifyPhone";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<AnonymousOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyPhone />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/customer" element={<Dashboard role="CUSTOMER" />} />
        <Route path="/worker" element={<Dashboard role="WORKER" />} />
      </Route>

      <Route path="/terms" element={<LegalPlaceholder title="terms" />} />
      <Route path="/privacy" element={<LegalPlaceholder title="privacy" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
