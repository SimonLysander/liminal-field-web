/*
 * App — Root layout & routing
 *
 * Layout architecture (Apple Books inspired):
 *   - LEFT:  Sidebar / TreePanel — floating grey card (sidebar-bg #F2F2F2),
 *            with margin + borderRadius + boxShadow to lift off the background.
 *   - RIGHT: Main content area — flat white surface (paper #FFFFFF), no card
 *            styling (no margin/borderRadius/boxShadow), so the content feels
 *            expansive against the compact navigation card.
 *   - Page background is white (--paper), matching the right side seamlessly.
 *
 * Route split:
 *   - Display pages (home/note/gallery/agent) share MainLayout with the
 *     display Sidebar component.
 *   - Admin pages (/admin, /admin/edit/:id) are standalone — they have their
 *     own TreePanel sidebar and are code-split via React.lazy.
 */

import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { smoothBounce } from './lib/motion';

import Sidebar from './components/global/Sidebar';
import Topbar from './components/global/Topbar';
import AgentPage from './pages/agent';
import GalleryPage from './pages/gallery';
import HomePage from './pages/home';
import NotePage from './pages/note';
import NotFoundPage from './pages/not-found';

const AdminShell = lazy(() => import('./pages/admin'));
const ContentAdmin = lazy(() => import('./pages/admin/content'));
const GalleryAdmin = lazy(() => import('./pages/admin/gallery'));
const DraftEditPage = lazy(() => import('./pages/admin/edit'));

const pageVariants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

function MainLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen" style={{ background: 'var(--paper)' }}>
      {/* Sidebar — floating grey card; see Sidebar.tsx for styling details */}
      <Sidebar />

      {/* Main content — flat white, no card styling (left card / right flat pattern) */}
      <main
        className="relative z-0 flex flex-1 flex-col overflow-hidden"
        style={{ background: 'var(--paper)' }}
      >
        <Topbar />

        <AnimatePresence mode="wait">
          {/* 打开具体文档时 key 变化触发入场动画，浏览目录时稳定 key 不做动画 */}
          <motion.div
            key={(() => {
              const doc = new URLSearchParams(location.search).get('doc');
              return doc ? `/note/${doc}` : '/note';
            })()}
            className="relative z-[1] flex flex-1 overflow-hidden"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: smoothBounce }}
          >
            <Routes location={location}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/note" element={<NotePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/admin" element={<Suspense fallback={null}><AdminShell /></Suspense>}>
        <Route index element={<Navigate to="/admin/content" replace />} />
        <Route path="content" element={<Suspense fallback={null}><ContentAdmin /></Suspense>} />
        <Route path="gallery" element={<Suspense fallback={null}><GalleryAdmin /></Suspense>} />
      </Route>
      <Route
        path="/admin/edit/:id"
        element={
          <Suspense fallback={null}>
            <DraftEditPage />
          </Suspense>
        }
      />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
