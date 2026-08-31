import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import 'augmented-ui/augmented-ui.min.css';
import './styles/tailwind.css';
import './styles/main.scss';
import {ThemeProvider} from './themes/ThemeProvider.tsx';
import {AuthSessionProvider} from './auth/AuthSessionProvider.tsx';
import {LiveHelpProvider} from './live-help/LiveHelpProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider><AuthSessionProvider><LiveHelpProvider><App /></LiveHelpProvider></AuthSessionProvider></ThemeProvider>
  </StrictMode>,
);
