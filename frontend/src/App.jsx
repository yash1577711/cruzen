import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

import Home from './pages/Home.jsx';
import Portfolio from './pages/Portfolio.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import Services from './pages/Services.jsx';
import Blog from './pages/Blog.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import UserDashboard from './pages/user/Dashboard.jsx';
import UserServiceTracker from './pages/user/ServiceTracker.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminLeads from './pages/admin/AdminLeads.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminTracker from './pages/admin/AdminTracker.jsx';
import AdminSubAdmins from './pages/admin/AdminSubAdmins.jsx';
import AdminConsultations from './pages/admin/AdminConsultations.jsx';
import AdminEmailBlast from './pages/admin/AdminEmailBlast.jsx';
import AdminPopup from './pages/admin/AdminPopup.jsx';
import AdminServiceImages from './pages/admin/AdminServiceImages.jsx';
import AdminBlog from './pages/admin/AdminBlog.jsx';
import AdminServices from './pages/admin/AdminServices.jsx';
import AdminTickets from './pages/admin/AdminTickets.jsx';
import AdminRequirements from './pages/admin/AdminRequirements.jsx';
import AdminOnboarding from './pages/admin/AdminOnboarding.jsx';
import AdminStaff from './pages/admin/AdminStaff.jsx';
import AiAudit from './pages/AiAudit.jsx';
import PosHeadDashboard from './pages/user/PosHeadDashboard.jsx';
import TeamMemberDashboard from './pages/user/TeamMemberDashboard.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';

function RoleBasedDashboard() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'pos_head') return <PosHeadDashboard />;
  if (user.role === 'team_member') return <TeamMemberDashboard />;
  return <UserDashboard />;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/services" element={<Services />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/ai-audit" element={<AiAudit />} />

      {/* User dashboard — role-based */}
      <Route path="/dashboard" element={<ProtectedRoute><RoleBasedDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/tracker" element={<ProtectedRoute><UserServiceTracker /></ProtectedRoute>} />
      <Route path="/dashboard/tracker/:id" element={<ProtectedRoute><UserServiceTracker /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/leads" element={<AdminRoute><AdminLeads /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/tracker" element={<AdminRoute><AdminTracker /></AdminRoute>} />
      <Route path="/admin/staff" element={<AdminRoute requireAdmin><AdminStaff /></AdminRoute>} />
      <Route path="/admin/sub-admins" element={<AdminRoute requireAdmin><AdminSubAdmins /></AdminRoute>} />
      <Route path="/admin/consultations" element={<AdminRoute><AdminConsultations /></AdminRoute>} />
      <Route path="/admin/email-blast" element={<AdminRoute requireAdmin><AdminEmailBlast /></AdminRoute>} />
      <Route path="/admin/popup" element={<AdminRoute><AdminPopup /></AdminRoute>} />
      <Route path="/admin/service-images" element={<AdminRoute><AdminServiceImages /></AdminRoute>} />
      <Route path="/admin/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
      <Route path="/admin/services" element={<AdminRoute><AdminServices /></AdminRoute>} />
      <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
      <Route path="/admin/requirements" element={<AdminRoute><AdminRequirements /></AdminRoute>} />
      <Route path="/admin/onboarding" element={<AdminRoute><AdminOnboarding /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
