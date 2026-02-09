import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChatPage } from './pages/Chat';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { ThemeProvider } from './context/ThemeContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
};

export default App;