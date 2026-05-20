import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { DemoApp } from './demo/DemoApp';
import { HumanEvalApp } from './humanEval/HumanEvalApp';
import { FrontendDemoApp } from './recording/FrontendDemoApp';
import { LiveSimulationDemoApp } from './recording/LiveSimulationDemoApp';
import './styles.css';

const searchParams = new URLSearchParams(window.location.search);
const recordingMode = searchParams.get('recording');
const RootApp = window.location.pathname === '/human-eval'
  ? HumanEvalApp
  : window.location.pathname === '/demo'
    ? DemoApp
  : recordingMode === 'frontend-demo'
  ? FrontendDemoApp
  : recordingMode === 'live-simulation'
    ? LiveSimulationDemoApp
    : App;

document.body.classList.toggle('human-eval-route', window.location.pathname === '/human-eval');
document.body.classList.toggle('demo-route', window.location.pathname === '/demo');
document.body.classList.toggle('recording-frontend-demo', recordingMode === 'frontend-demo');
document.body.classList.toggle('recording-live-simulation', recordingMode === 'live-simulation');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
);
