import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AnonymousOnly, HomeRedirect, RequireActiveRole, RequireAuth } from "./auth/routes";
import { AppShell } from "./components/AppShell";
import { CustomerHome } from "./pages/customer/CustomerHome";
import { JobDetails } from "./pages/customer/JobDetails";
import { MyJobs } from "./pages/customer/MyJobs";
import { ForgotPassword } from "./pages/ForgotPassword";
import { LegalPlaceholder } from "./pages/LegalPlaceholder";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ResetPassword } from "./pages/ResetPassword";
import { VerifyPhone } from "./pages/VerifyPhone";
import { WorkerHome } from "./pages/worker/WorkerHome";

// Loaded on first visit, so the dashboard opens faster on mobile data.
const PostJob = lazy(() => import("./pages/customer/PostJob").then((m) => ({ default: m.PostJob })));
const EditJob = lazy(() => import("./pages/customer/EditJob").then((m) => ({ default: m.EditJob })));
const FindWork = lazy(() => import("./pages/worker/FindWork").then((m) => ({ default: m.FindWork })));
const WorkJobDetails = lazy(() => import("./pages/worker/WorkJobDetails").then((m) => ({ default: m.WorkJobDetails })));
const Payments = lazy(() => import("./pages/customer/Payments").then((m) => ({ default: m.Payments })));
const Earnings = lazy(() => import("./pages/worker/Earnings").then((m) => ({ default: m.Earnings })));
const MyApplications = lazy(() => import("./pages/worker/MyApplications").then((m) => ({ default: m.MyApplications })));
const Messages = lazy(() => import("./pages/messages/Messages").then((m) => ({ default: m.Messages })));
const NoConversationChosen = lazy(() =>
  import("./pages/messages/Messages").then((m) => ({ default: m.NoConversationChosen })),
);
const ConversationView = lazy(() =>
  import("./pages/messages/ConversationView").then((m) => ({ default: m.ConversationView })),
);
const SettingsLayout = lazy(() => import("./pages/settings/SettingsLayout").then((m) => ({ default: m.SettingsLayout })));
const ProfileSettings = lazy(() => import("./pages/settings/ProfileSettings").then((m) => ({ default: m.ProfileSettings })));
const PrivacySettings = lazy(() => import("./pages/settings/PrivacySettings").then((m) => ({ default: m.PrivacySettings })));
const AppearanceSettings = lazy(() =>
  import("./pages/settings/AppearanceSettings").then((m) => ({ default: m.AppearanceSettings })),
);
const SecuritySettings = lazy(() => import("./pages/settings/SecuritySettings").then((m) => ({ default: m.SecuritySettings })));

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
        <Route element={<AppShell />}>
          <Route path="/customer" element={<RequireActiveRole role="CUSTOMER" />}>
            <Route index element={<CustomerHome />} />
            <Route path="jobs" element={<MyJobs />} />
            <Route path="jobs/new" element={<PostJob />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="jobs/:id/edit" element={<EditJob />} />
            <Route path="payments" element={<Payments />} />
          </Route>
          <Route path="/worker" element={<RequireActiveRole role="WORKER" />}>
            <Route index element={<WorkerHome />} />
            <Route path="jobs" element={<FindWork />} />
            <Route path="jobs/:id" element={<WorkJobDetails />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="earnings" element={<Earnings />} />
          </Route>
          <Route path="/messages" element={<Messages />}>
            <Route index element={<NoConversationChosen />} />
            <Route path=":id" element={<ConversationView />} />
          </Route>
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="privacy" element={<PrivacySettings />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="appearance" element={<AppearanceSettings />} />
          </Route>
        </Route>
      </Route>

      <Route path="/terms" element={<LegalPlaceholder title="terms" />} />
      <Route path="/privacy" element={<LegalPlaceholder title="privacy" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
