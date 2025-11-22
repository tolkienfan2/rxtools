// src/layout/Layout.tsx
import React from 'react';
import { Link } from 'react-router-dom';

import logoRx from '../assets/logo_rx.svg';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-left justify-between">
      {/* Logo and Branding */}
      <header className="text-left py-6 ml-6 flex items-center">
        <Link to="/">
          <img src={logoRx} alt="RXTools Logo" className="w-12 h-12 mr-2" />
        </Link>
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-extrabold text-blue-600 leading-none">RXTools</h1>
          <p className="mt-2 text-base text-gray-600 leading-none">by <span className="text-base font-light text-gray-500 leading-none">CreativeIce</span></p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full px-6 sm:px-12">{children}</main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500">
        <p>©2024 CreativeIce. All rights reserved.</p>
      </footer>
    </div>
  );
};

