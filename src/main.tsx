import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameShell } from './app/GameShell';
import './style.css';
createRoot(document.getElementById('root')!).render(<StrictMode><GameShell /></StrictMode>);
