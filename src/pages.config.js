import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import MyCampaigns from './pages/MyCampaigns';
import CampaignView from './pages/CampaignView';
import Library from './pages/Library';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Dashboard": Dashboard,
    "Generator": Generator,
    "MyCampaigns": MyCampaigns,
    "CampaignView": CampaignView,
    "Library": Library,
    "Profile": Profile,
    "Help": Help,
    "Settings": Settings,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
