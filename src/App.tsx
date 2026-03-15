import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/global/Footer/index';
import SideNavigator from './components/global/SideNavigator/index';
import TopController from './components/global/TopController/index';
import AdminPage from './pages/admin/index';
import AgentPage from './pages/agent/index';
import GalleryPage from './pages/gallery/index';
import HomePage from './pages/home/index';
import NotFoundPage from './pages/not-found/index';
import NotePage from './pages/note/index';

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopController />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-16 shrink-0 border-r border-border bg-background">
          <SideNavigator />
        </aside>

        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 overflow-y-auto">
            <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/note" element={<NotePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/agent" element={<AgentPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default App;
