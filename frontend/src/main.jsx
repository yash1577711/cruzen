import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { CartProvider } from './contexts/CartContext.jsx';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <HelmetProvider>
  <BrowserRouter>
    <AuthProvider>
    <CartProvider>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </CartProvider>
    </AuthProvider>
  </BrowserRouter>
  </HelmetProvider>
);

// Reveal body after React's first paint to eliminate FOUC / broken-for-1s flash
requestAnimationFrame(() => requestAnimationFrame(() => {
  document.body.classList.add('app-ready');
}));
