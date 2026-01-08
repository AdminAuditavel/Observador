
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import AirportHome from './components/AirportHome';
import VisualFeedDetail from './components/VisualFeedDetail';
import NotamDetail from './components/NotamDetail';
import WeatherModal from './components/WeatherModal';

const AppContent: React.FC = () => {
  const [isWeatherModalOpen, setWeatherModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background-dark text-white selection:bg-primary selection:text-white">
      <Routes>
        <Route 
          path="/" 
          element={<AirportHome onOpenWeather={() => setWeatherModalOpen(true)} />} 
        />
        <Route path="/post/:id" element={<VisualFeedDetail />} />
        <Route path="/notam/:id" element={<NotamDetail />} />
      </Routes>

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
