import { lazy, Suspense } from "react";
import Layout from "./Layout.jsx";

import Home from "./Home";

const Map                  = lazy(() => import("./Map"));
const Location             = lazy(() => import("./Location"));
const Search               = lazy(() => import("./Search"));
const AccessDenied         = lazy(() => import("./AccessDenied"));
const AdminDashboard       = lazy(() => import("./AdminDashboard"));
const AdminLocations       = lazy(() => import("./AdminLocations"));
const AdminEditLocation    = lazy(() => import("./AdminEditLocation"));
const AdminUsers           = lazy(() => import("./AdminUsers"));
const About                = lazy(() => import("./About"));
const Privacy              = lazy(() => import("./Privacy"));
const Contact              = lazy(() => import("./Contact"));
const RoutePage            = lazy(() => import("./Route"));
const AdminStats           = lazy(() => import("./AdminStats"));
const Login                = lazy(() => import("./Login"));
const ResetPassword        = lazy(() => import("./ResetPassword"));
const AccessibilityStatement = lazy(() => import("./AccessibilityStatement"));
const Terms                = lazy(() => import("./Terms"));

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

function PageFallback() {
    return (
        <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#1D4E8F] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            <Suspense fallback={<PageFallback />}>
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
            </Suspense>
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
