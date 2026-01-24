import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import GalleryPage from './pages/gallery/gallery';
import HomePage from './pages/home/home';
import NotFoundPage from './pages/not-found/not-found';
import NotePage from './pages/note/note';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/note" element={<NotePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
