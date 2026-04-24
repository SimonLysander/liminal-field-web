import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SideNavigator from './components/global/SideNavigator/index';
import TopController from './components/global/TopController/index';
import AdminPage from './pages/admin/index';
import AgentPage from './pages/agent/index';
import GalleryPage from './pages/gallery/index';
import HomePage from './pages/home/index';
import NotFoundPage from './pages/not-found/index';
import NotePage from './pages/note/index';

function PublicShell() {
  return (
    <>
      <TopController />
      <div className="layout mt-[2.625rem] flex h-[calc(100vh-2.625rem)]">
        <SideNavigator />
        <main className="main flex flex-1 overflow-hidden">
          <div className="view-wrapper flex flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/note" element={<NotePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}

function App() {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    );
  }

  return <PublicShell />;
}

export default App;
