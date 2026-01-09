//src/App.tsx

import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import AirportHome from './components/AirportHome';
import VisualFeedDetail from './components/VisualFeedDetail';
import NotamDetail from './components/NotamDetail';
import WeatherModal from './components/WeatherModal';

const AppContent: React.FC = () => {
  const [isWeatherModalOpen, setWeatherModalOpen] = useState(false);
  const location = useLocation();
  // Convention: when opening from the feed we set state: { background: location }
  const state = location.state as { background?: Location };
  const background = state && state.background;

  return (
    <div className="relative min-h-screen bg-background-dark text-white selection:bg-primary selection:text-white">
      {/* Render main routes; if background exists we render routes using the background location
          so the UI behind the modal remains the feed */}
      <Routes location={background || location}>
        <Route 
          path="/" 
          element={<AirportHome onOpenWeather={() => setWeatherModalOpen(true)} />} 
        />
        <Route path="/post/:id" element={<VisualFeedDetail />} />
        <Route path="/notam/:id" element={<NotamDetail />} />
      </Routes>

      {/* If there is a background, render the modal route on top */}
      {background && (
        <Routes>
          <Route 
            path="/post/:id" 
            element={<VisualFeedDetail onClose={() => window.history.back()} modal />} 
          />
        </Routes>
      )}

      {isWeatherModalOpen && (
        <WeatherModal onClose={() => setWeatherModalOpen(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
