import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './services/storage';

// Layout
import { AppShell } from './components/layout/AppShell';
import { RoleGuard } from './components/layout/RoleGuard';

// Auth
import { Login } from './pages/auth/Login';

// Bidder Pages
import { BidderDashboard } from './pages/bidder/BidderDashboard';
import { BidderProfilePage } from './pages/bidder/BidderProfile';
import { TenderListing } from './pages/bidder/TenderListing';
import { TenderDetails } from './pages/bidder/TenderDetails';
import { BidApplicationForm } from './pages/bidder/BidApplicationForm';
import { ApplicationReview } from './pages/bidder/ApplicationReview';
import { MyApplications } from './pages/bidder/MyApplications';
import { BidderDocuments } from './pages/bidder/BidderDocuments';
import { BidderNotifications } from './pages/bidder/BidderNotifications';

// Officer Pages
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { OfficerTenders } from './pages/officer/OfficerTenders';
import { CreateTender } from './pages/officer/CreateTender';
import { OfficerBids } from './pages/officer/OfficerBids';
import { OfficerBidDetails } from './pages/officer/OfficerBidDetails';
import { OfficerVerification } from './pages/officer/OfficerVerification';
import { OfficerReports } from './pages/officer/OfficerReports';
import { OfficerReportView } from './pages/officer/OfficerReportView';
import { OfficerAudit } from './pages/officer/OfficerAudit';

// Root redirect component
const RootRedirect: React.FC = () => {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user.role === 'bidder' ? '/bidder/dashboard' : '/officer/dashboard'} replace />;
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Bidder Protected Routes */}
        <Route element={<RoleGuard allowedRole="bidder" />}>
          <Route element={<AppShell />}>
            <Route path="/bidder/dashboard" element={<BidderDashboard />} />
            <Route path="/bidder/profile" element={<BidderProfilePage />} />
            <Route path="/bidder/profile/edit" element={<BidderProfilePage isEditMode={true} />} />
            <Route path="/bidder/tenders" element={<TenderListing />} />
            <Route path="/bidder/tenders/:id" element={<TenderDetails />} />
            <Route path="/bidder/tenders/:id/apply" element={<BidApplicationForm />} />
            <Route path="/bidder/applications" element={<MyApplications />} />
            <Route path="/bidder/applications/:id" element={<ApplicationReview />} />
            <Route path="/bidder/applications/:id/review" element={<ApplicationReview />} />
            <Route path="/bidder/documents" element={<BidderDocuments />} />
            <Route path="/bidder/notifications" element={<BidderNotifications />} />
          </Route>
        </Route>

        {/* Officer Protected Routes */}
        <Route element={<RoleGuard allowedRole="officer" />}>
          <Route element={<AppShell />}>
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/officer/tenders" element={<OfficerTenders />} />
            <Route path="/officer/tenders/create" element={<CreateTender />} />
            <Route path="/officer/bids" element={<OfficerBids />} />
            <Route path="/officer/bids/:id" element={<OfficerBidDetails />} />
            <Route path="/officer/verification/:bidId" element={<OfficerVerification />} />
            <Route path="/officer/verification" element={<OfficerVerification />} />
            <Route path="/officer/reports" element={<OfficerReports />} />
            <Route path="/officer/reports/:bidId" element={<OfficerReportView />} />
            <Route path="/officer/audit" element={<OfficerAudit />} />
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
