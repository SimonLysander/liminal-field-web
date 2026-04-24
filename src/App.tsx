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

/**
 * Page transition variants — subtle fade + vertical shift.
 * Uses Apple-style easing [0.16, 1, 0.3, 1] for natural deceleration.
 */
const pageVariants = {
  enter: { opacity: 0, y: 6 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

function App() {
  const location = useLocation();

  /*
   * Layout: sidebar (200px) sits in a paper-dark background,
   * main content area is a raised card (rounded, shadowed) to the right.
   * This creates the macOS-style split appearance from the reference design.
   */
  return (
    <div className="flex h-screen" style={{ background: 'var(--paper-dark)' }}>
      <Sidebar />

      <main
        className="relative z-0 flex flex-1 flex-col overflow-hidden"
        style={{
          background: 'var(--paper)',
          margin: '8px 8px 8px 0',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm), var(--inset-light)',
        }}
      >
        <Topbar />

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="relative z-[1] flex flex-1 overflow-hidden"
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: smoothBounce }}
          >
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/home" replace />} />
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

export default App;
