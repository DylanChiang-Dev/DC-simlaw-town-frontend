import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { FrontendDemoApp } from './recording/FrontendDemoApp';
import './styles.css';

const searchParams = new URLSearchParams(window.location.search);
const recordingMode = searchParams.get('recording');
const RootApp = recordingMode === 'frontend-demo' ? FrontendDemoApp : App;

document.body.classList.toggle('recording-frontend-demo', recordingMode === 'frontend-demo');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
