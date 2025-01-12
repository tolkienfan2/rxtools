import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './layout/Layout';
import { Home } from './features/Home';
import { DosingCalculator } from './features/DosingCalculator';
import { PillCounter } from './features/PillCounter';


const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/dosing" element={<Layout><DosingCalculator /></Layout>} />
        <Route path="/pill-counter" element={<Layout><PillCounter /></Layout>} />
      </Routes>
    </Router>
  );
};

export default App;
