// STIKDEAD :: UPDATE 3.0 — toast de conquista desbloqueada
// Nunca desbloquear em silêncio: explosão dourada + glow + som + badge.
// Escuta o evento global 'stik:patente' (disparado pelo App ao subir de nível).
import { useEffect, useRef, useState } from 'react';
import { sfx, unlockAudio } from '../game/audio.js';

export default function PatentToast() {
  const [fila, setFila] = useState([]); // conquistas aguardando exibição
  const [atual, setAtual] = useState(null);
  const timer = useRef(0);

  useEffect(() => {
    const onPatente = (e) => setFila((f) => [...f, e.detail.patent]);
    window.addEventListener('stik:patente', onPatente);
    return () => window.removeEventListener('stik:patente', onPatente);
  }, []);

  // consome a fila: uma conquista por vez, 4.6s cada
  useEffect(() => {
    if (atual || fila.length === 0) return;
    const [prox, ...resto] = fila;
    setFila(resto);
    setAtual(prox);
    try { unlockAudio(); sfx.drop(); setTimeout(() => sfx.victory(), 240); } catch { /* sem áudio */ }
    timer.current = setTimeout(() => setAtual(null), 4600);
    return () => clearTimeout(timer.current);
  }, [fila, atual]);

  if (!atual) return null;
  return (
    <div className="pat-toast" role="status" aria-live="polite">
      <span className="pat-toast-burst" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
      </span>
      <img className="pat-toast-icone" src={atual.icon} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      <span className="pat-toast-texto">
        <small>CONQUISTA DESBLOQUEADA</small>
        <b>{atual.name}</b>
        <em>{atual.ato} · Nível {atual.level}</em>
      </span>
    </div>
  );
}
