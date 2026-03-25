/* eslint-disable import-x/extensions */
import "@fontsource/azeret-mono/400.css";
import "@fontsource/azeret-mono/500.css";
import "@fontsource/azeret-mono/700.css";
import "@fontsource/azeret-mono/900.css";
/* eslint-enable import-x/extensions */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
