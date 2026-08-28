import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'augmented-ui/augmented-ui.min.css';
import './themes/hud.css';
import './themes/hud-augmented.css';
import {ThemeProvider} from './themes/ThemeProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider><App /></ThemeProvider>
  </StrictMode>,
);
