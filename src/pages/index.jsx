import Layout from "./Layout.jsx";

import Home from "./Home";

import Map from "./Map";

import Location from "./Location";

import Search from "./Search";

import AccessDenied from "./AccessDenied";

import AdminDashboard from "./AdminDashboard";

import AdminLocations from "./AdminLocations";

import AdminEditLocation from "./AdminEditLocation";

import AdminUsers from "./AdminUsers";

import About from "./About";

import Privacy from "./Privacy";

import Contact from "./Contact";

import RoutePage from "./Route";

import AdminStats from "./AdminStats";

import Login from "./Login";

import ResetPassword from "./ResetPassword";

import AccessibilityStatement from "./AccessibilityStatement";

import Terms from "./Terms";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { LanguageProvider } from '../utils/language';
import { AuthProvider, useAuth } from '../api/AuthContext';
import { createPageUrl } from '../utils';

const ADMIN_PAGES = new Set([
  'AdminDashboard',
  'AdminLocations',
  'AdminEditLocation',
  'AdminUsers',
  'AdminStats',
]);

function ProtectedRoute({ component: Component }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to={createPageUrl('Login')} replace />;
  if (!['admin', 'contributor'].includes(user.role)) return <Navigate to={createPageUrl('AccessDenied')} replace />;
  return <Component />;
}

const PAGES = {
    
    Home: Home,
    
    Map: Map,
    
    Location: Location,
    
    Search: Search,
    
    AccessDenied: AccessDenied,
    
    AdminDashboard: AdminDashboard,
    
    AdminLocations: AdminLocations,
    
    AdminEditLocation: AdminEditLocation,
    
    AdminUsers: AdminUsers,
    
    About: About,
    
    Privacy: Privacy,
    
    Contact: Contact,
    
    Route: RoutePage,
    
    AdminStats: AdminStats,

    Login: Login,

    ResetPassword: ResetPassword,

    AccessibilityStatement: AccessibilityStatement,

    Terms: Terms,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Routes>
                <Route path="/" element={<Home />} />
                {Object.entries(PAGES).map(([name, Component]) => (
                    <Route
                        key={name}
                        path={createPageUrl(name)}
                        element={
                            ADMIN_PAGES.has(name)
                                ? <ProtectedRoute component={Component} />
                                : <Component />
                        }
                    />
                ))}
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <Router>
                    <PagesContent />
                </Router>
            </LanguageProvider>
        </AuthProvider>
    );
}