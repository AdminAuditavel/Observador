// src/App.tsx
import React, { useState } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import AirportHome from "./components/AirportHome";
import VisualFeedDetail from "./components/VisualFeedDetail";
import NotamDetail from "./components/NotamDetail";
import WeatherModal from "./components/WeatherModal";
import Login from "./pages/Login";
import { AuthProvider } from "./auth/AuthContext";
import Signup from "./pages/Signup";
import InviteCreate from "./pages/InviteCreate";
import InviteList from "./pages/InviteList";

type LocationState = {
  background?: ReturnType<typeof useLocation>;
};

const AppContent: React.FC = () => {
  const [isWeatherModalOpen, setWeatherModalOpen] = useState(false);
  const location = useLocation();

  // Quando abrimos o detalhe "por cima", passamos state: { background: location }
  const state = location.state as any;
  const background = state?.background as typeof location | undefined;

  return (
    <div className="relative min-h-screen bg-background-dark text-white selection:bg-primary selection:text-white">
      {/* Rotas principais (quando existir background, renderiza "por trás") */}
      <Routes location={background || location}>
        <Route
          path="/"
          element={<AirportHome onOpenWeather={() => setWeatherModalOpen(true)} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Rotas de convites */}
        <Route path="/invites" element={<InviteList />} />
        <Route path="/invites/new" element={<InviteCreate />} />

        <Route path="/post/:id" element={<VisualFeedDetail />} />
        <Route path="/notam/:id" element={<NotamDetail />} />
      </Routes>

      {/* Rotas “modal” por cima (apenas quando background existe) */}
      {background && (
        <Routes>
          <Route path="/post/:id" element={<VisualFeedDetail />} />
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
