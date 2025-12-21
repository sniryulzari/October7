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

import Route from "./Route";

import AdminStats from "./AdminStats";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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
    
    Route: Route,
    
    AdminStats: AdminStats,
    
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

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Map" element={<Map />} />
                
                <Route path="/Location" element={<Location />} />
                
                <Route path="/Search" element={<Search />} />
                
                <Route path="/AccessDenied" element={<AccessDenied />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AdminLocations" element={<AdminLocations />} />
                
                <Route path="/AdminEditLocation" element={<AdminEditLocation />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/Route" element={<Route />} />
                
                <Route path="/AdminStats" element={<AdminStats />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}