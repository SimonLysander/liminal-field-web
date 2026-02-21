import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import SideNavigator from './components/global/SideNavigator/index';
import TopController from './components/global/TopController/index';
import AdminPage from './pages/admin/index';
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
    <>
      <TopController />
      {/* grid grid-cols-[fit, 1fr, fit] gap-4 */}
      <div className="flex items-start gap-4 w-full">
        <nav className="fixed left-0 top-1/2 -translate-y-1/2 flex-shrink-0 bg-gray-50 shadow-md border-r border-gray-200">
          <SideNavigator />
        </nav>
        <article className="flex-grow ml-32 overflow-y-auto h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/note" element={<NotePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </article>
      </div>
      <footer />
    </>
  );
}

export default App;
