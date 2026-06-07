import React from 'react';
import { createRoot } from 'react-dom/client';
import LandingPage from './LandingPage';

let reactRoot = null;

export function mountLandingPage(rootId, onExplore) {
  const container = document.getElementById(rootId);
  if (!container) {
    console.error(`Container #${rootId} not found`);
    return;
  }
  
  if (!reactRoot) {
    reactRoot = createRoot(container);
  }
  
  // Wrap the onExplore callback to unmount the React app after animation/click
  const handleExplore = () => {
    // Optional: Add a fade-out animation logic here before unmounting
    // React 18 createRoot shouldn't be repeatedly unmounted if we are going to mount it again on the same container without re-creating it.
    // Instead of unmounting, we just let it hide via CSS (which is handled by main.js)
    
    // Call the original onExplore callback from main.js to show the LUMORA UI
    if (onExplore) {
      onExplore();
    }
  };

  reactRoot.render(
    <React.StrictMode>
      <LandingPage onExplore={handleExplore} />
    </React.StrictMode>
  );
}
