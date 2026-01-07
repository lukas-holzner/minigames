import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TwisterWheel from './games/TwisterWheel';

function App() {
  return (
    <BrowserRouter basename="/minigames">
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/twister-wheel" element={<TwisterWheel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
