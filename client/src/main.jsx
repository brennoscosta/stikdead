import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './theme.css'; // tema premium — só aparência, carrega por cima

// detector reserva de mobile (classe no body, imune a peculiaridades de media query)
const syncMobile = () => document.body.classList.toggle('is-mobile', window.innerWidth <= 760);
syncMobile();
window.addEventListener('resize', syncMobile);

// trilha do menu: liga no primeiro gesto (política de autoplay), fora de luta
const bootMusic = () => {
  Promise.all([import('./game/music.js'), import('./game/audio.js')]).then(([m, a]) => {
    a.unlockAudio();
    if (!document.body.classList.contains('in-fight')) m.startMusic('menu');
  });
  window.removeEventListener('pointerdown', bootMusic);
};
window.addEventListener('pointerdown', bootMusic);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
