import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AccountPage from "./pages/AccountPage";
import AdoptionApplicationsPage from "./pages/AdoptionApplicationsPage";
import AdoptionListingsPage from "./pages/AdoptionListingsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import CareRecordsPage from "./pages/CareRecordsPage";
import ChatsPage from "./pages/ChatsPage";
import ClinicsPage from "./pages/ClinicsPage";
import CommunityFeedPage from "./pages/CommunityFeedPage";
import GroomingPage from "./pages/GroomingPage";
import HealthPassportPage from "./pages/HealthPassportPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import DashboardPage from "./pages/DashboardPage";
import LostFoundPage from "./pages/LostFoundPage";
import MarketplaceInquiriesPage from "./pages/MarketplaceInquiriesPage";
import MarketplacePage from "./pages/MarketplacePage";
import MarketplaceProductPage from "./pages/MarketplaceProductPage";
import MessagesPage from "./pages/MessagesPage";
import NotificationsPage from "./pages/NotificationsPage";
import PetsPage from "./pages/PetsPage";
import PetFormPage from "./pages/PetFormPage";
import RemindersPage from "./pages/RemindersPage";
import RescueCasesPage from "./pages/RescueCasesPage";
import RolesPage from "./pages/RolesPage";
import ServiceBookingsPage from "./pages/ServiceBookingsPage";
import ServicesPage from "./pages/ServicesPage";
import SittingPage from "./pages/SittingPage";
import TransactionsPage from "./pages/TransactionsPage";
import VetProfilesPage from "./pages/VetProfilesPage";
import VolunteersPage from "./pages/VolunteersPage";
import HomePage from "./pages/HomePage";
import { modules } from "./modules";

const modulePages = {
  "/pets": PetsPage,
  "/health-passport": HealthPassportPage,
  "/reminders": RemindersPage,
  "/care-records": CareRecordsPage,
  "/vet-profiles": VetProfilesPage,
  "/clinics": ClinicsPage,
  "/appointments": AppointmentsPage,
  "/adoption-listings": AdoptionListingsPage,
  "/adoption-applications": AdoptionApplicationsPage,
  "/rescue-cases": RescueCasesPage,
  "/volunteers": VolunteersPage,
  "/marketplace": MarketplacePage,
  "/marketplace-inquiries": MarketplaceInquiriesPage,
  "/services": ServicesPage,
  "/grooming": GroomingPage,
  "/sitting": SittingPage,
  "/service-bookings": ServiceBookingsPage,
  "/transactions": TransactionsPage,
  "/community": CommunityFeedPage,
  "/lost-found": LostFoundPage,
  "/chats": ChatsPage,
  "/messages": MessagesPage,
  "/notifications": NotificationsPage,
  "/roles": RolesPage,
  "/admin": AdminDashboardPage,
};

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Getting PawVerse ready...</div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function NotFoundPage() {
  return <main className="not-found"><span>🐾</span><h1>Oops, this path wandered off.</h1><p>Let's get you back to a familiar place.</p><a className="button button-dark" href="/">Back to PawVerse</a></main>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {modules.map(({ path }) => {
            const Page = modulePages[path];
            return <Route key={path} path={path} element={<Page />} />;
          })}
          <Route path="/marketplace/:id" element={<MarketplaceProductPage />} />
          <Route path="/pets/new" element={<PetFormPage />} />
          <Route path="/pets/:id" element={<PetFormPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
