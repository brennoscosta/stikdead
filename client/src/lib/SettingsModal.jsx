// STIKDEAD :: ⚙️ Configurações — Gráficos, Áudio e Controles.
// A tela NÃO controla som por conta própria: todo ajuste passa pelo AudioManager.
// Qualidade máxima e Teclas de combate preservados exatamente como eram.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../ds/Icon.jsx';
import { getBinds, setBind, resetBinds, keyLabel, BIND_ORDER, BIND_LABELS, RESERVED } from '../game/keybinds.js';
import { sfx, unlockAudio } from '../game/audio.js';
import {
  getAudioSettings, onAudioChange,
  setMasterEnabled, setMasterVolume, setMusicEnabled, setMusicVolume,
  setSfxEnabled, setSfxVolume, setAmbienceEnabled, setAmbienceVolume, setMuteOnBlur,
  setVoiceEnabled, setVoiceVolume,
  playUi, playVoice,
} from '../game/audioManager.js';
import { previewAmbience } from '../game/ambience.js';

const IS_PC = typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;

// switch StikDead: vermelho ligado, escuro desligado, acessível por teclado
function Chave({ on, onToggle, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label}
      className={`cfg-switch2 ${on ? 'on' : ''}`}
      onClick={() => { unlockAudio(); onToggle(!on); }}
    >
      <span className="cfg-switch2-txt">{on ? 'ON' : 'OFF'}</span><i />
    </button>
  );
}

// slider StikDead: trilho escuro, preenchimento vermelho, valor ao lado
function Regua({ label, value, onChange, disabled, onPreview }) {
  const pct = Math.round(value * 100);
  return (
    <label className={`cfg-regua ${disabled ? 'off' : ''}`}>
      <span className="cfg-regua-nome">{label}</span>
      <input
        type="range" min="0" max="100" step="1" value={pct} disabled={disabled}
        aria-label={`${label} — ${pct}%`}
        style={{ '--pct': `${pct}%` }}
        onChange={(e) => { unlockAudio(); onChange(Number(e.target.value) / 100); onPreview?.(); }}
      />
      <b className="cfg-regua-val">{pct}%</b>
    </label>
  );
}

export default function SettingsModal({ onClose }) {
  const [maxQ, setMaxQ] = useState((localStorage.getItem('stik_quality') || 'lite') === 'max');
  const [binds, setBinds] = useState(getBinds());
  const [capturando, setCapturando] = useState(null); // ação aguardando tecla
  const [audio, setAudio] = useState(getAudioSettings);
  const [saindo, setSaindo] = useState(false);

  // a tela só REFLETE o AudioManager — o estado mora lá (zero duplicação)
  useEffect(() => onAudioChange(setAudio), []);

  // FASE 7: tecido + whoosh reais ao abrir/fechar o painel (bíblia, seção 5)
  useEffect(() => { playUi('ui_panel_open_01'); }, []);

  const fechar = () => { playUi('ui_panel_close_01'); setSaindo(true); setTimeout(onClose, 190); };

  // ESC fecha (mas se estiver capturando tecla, só cancela a captura)
  useEffect(() => {
    const esc = (e) => { if (e.code === 'Escape' && !capturando) fechar(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [capturando]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    const novo = !maxQ;
    setMaxQ(novo);
    localStorage.setItem('stik_quality', novo ? 'max' : 'lite');
  };

  // preview de efeitos com debounce: um clique por rajada de arraste, nunca metralhadora
  const prevTimer = useRef(null);
  const previewSfx = () => {
    clearTimeout(prevTimer.current);
    prevTimer.current = setTimeout(() => sfx.click(), 160);
  };
  useEffect(() => () => clearTimeout(prevTimer.current), []);

  // captura da tecla: próxima tecla física vira o binding
  useEffect(() => {
    if (!capturando) return;
    const pega = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') { setCapturando(null); return; }
      if (RESERVED.has(e.code)) return; // setas são do movimento
      setBinds(setBind(capturando, e.code));
      setCapturando(null);
    };
    window.addEventListener('keydown', pega, true);
    return () => window.removeEventListener('keydown', pega, true);
  }, [capturando]);

  return createPortal(
    <div className={`pc-overlay cfg-overlay ${saindo ? 'saindo' : ''}`} style={{ zIndex: 480 }} onClick={fechar}>
      <div className="fa-card cfg-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Configurações do jogo">
        <button className="av-close" onClick={fechar} aria-label="Fechar configurações"><Icon name="fechar" size={16} /></button>
        <h2 className="fa-title" style={{ textAlign: 'center' }}><Icon name="config" size={18} weight="forte" /> Configurações</h2>

        <div className="cfg-corpo">
          {/* ===== GRÁFICOS (comportamento intocado) ===== */}
          <h3 className="cfg-secao">GRÁFICOS</h3>
          <div className="cfg-row" onClick={toggle} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); toggle(); } }}>
            <div>
              <div className="cfg-label">🎬 Qualidade máxima</div>
              <div className="cfg-desc">
                {maxQ
                  ? 'Arenas em vídeo cinematográfico. Se o jogo estiver lento no seu aparelho, desligue.'
                  : 'Modo leve: arenas em imagem — máxima fluidez em qualquer aparelho.'}
              </div>
            </div>
            <div className={`cfg-switch ${maxQ ? 'on' : ''}`}><span /></div>
          </div>

          {/* ===== ÁUDIO ===== */}
          <h3 className="cfg-secao">ÁUDIO</h3>
          <div className="cfg-au-row master">
            <div>
              <div className="cfg-label">Som geral</div>
              <div className="cfg-desc">Desligar silencia tudo. Os volumes individuais ficam salvos.</div>
            </div>
            <Chave on={audio.masterEnabled} onToggle={setMasterEnabled} label="Som geral" />
          </div>
          <Regua label="VOLUME GERAL" value={audio.masterVolume} disabled={!audio.masterEnabled}
            onChange={setMasterVolume} onPreview={previewSfx} />

          <div className="cfg-au-row">
            <div className="cfg-label">Música</div>
            <Chave on={audio.musicEnabled} onToggle={setMusicEnabled} label="Música" />
          </div>
          <Regua label="VOLUME DA MÚSICA" value={audio.musicVolume}
            disabled={!audio.masterEnabled || !audio.musicEnabled} onChange={setMusicVolume} />

          <div className="cfg-au-row">
            <div className="cfg-label">Efeitos da interface</div>
            <span className="cfg-au-acoes">
              <button className="cfg-teste" onClick={() => { unlockAudio(); sfx.drop(); }} disabled={!audio.masterEnabled || !audio.sfxEnabled}>testar</button>
              <Chave on={audio.sfxEnabled} onToggle={setSfxEnabled} label="Efeitos da interface" />
            </span>
          </div>
          <Regua label="VOLUME DOS EFEITOS" value={audio.sfxVolume}
            disabled={!audio.masterEnabled || !audio.sfxEnabled} onChange={setSfxVolume} onPreview={previewSfx} />

          <div className="cfg-au-row">
            <div className="cfg-label">Som ambiente</div>
            <span className="cfg-au-acoes">
              <button className="cfg-teste" onClick={() => { unlockAudio(); previewAmbience(); }} disabled={!audio.masterEnabled || !audio.ambienceEnabled}>testar</button>
              <Chave on={audio.ambienceEnabled} onToggle={setAmbienceEnabled} label="Som ambiente" />
            </span>
          </div>
          <Regua label="VOLUME DO AMBIENTE" value={audio.ambienceVolume}
            disabled={!audio.masterEnabled || !audio.ambienceEnabled} onChange={setAmbienceVolume} />

          {/* FASE 6/10: canal do narrador (voz grave pt-BR do jogo) */}
          <div className="cfg-au-row">
            <div className="cfg-label">Narrador</div>
            <span className="cfg-au-acoes">
              <button className="cfg-teste" onClick={() => { unlockAudio(); playVoice('voice_victory_01'); }} disabled={!audio.masterEnabled || !audio.voiceEnabled}>testar</button>
              <Chave on={audio.voiceEnabled} onToggle={setVoiceEnabled} label="Narrador" />
            </span>
          </div>
          <Regua label="VOLUME DO NARRADOR" value={audio.voiceVolume}
            disabled={!audio.masterEnabled || !audio.voiceEnabled} onChange={setVoiceVolume} />

          <div className="cfg-au-row">
            <div>
              <div className="cfg-label">Silenciar em segundo plano</div>
              <div className="cfg-desc">Sem som quando a aba perde o foco; volta suave ao retornar.</div>
            </div>
            <Chave on={audio.muteOnBlur} onToggle={setMuteOnBlur} label="Silenciar em segundo plano" />
          </div>

          {/* ===== CONTROLES (comportamento intocado) ===== */}
          {IS_PC && (
            <div className="cfg-keys">
              <h3 className="cfg-secao">CONTROLES</h3>
              <div className="cfg-label" style={{ margin: '4px 0 2px' }}>⌨️ Teclas de combate</div>
              <div className="cfg-desc" style={{ marginBottom: 8 }}>
                Clique na tecla e pressione a nova. Setas movem, pulam (↑) e abaixam (↓) — fixas.
              </div>
              {BIND_ORDER.map((acao) => (
                <div className="cfg-key-row" key={acao}>
                  <span className="cfg-key-acao">{BIND_LABELS[acao]}</span>
                  <button
                    className={`cfg-key-btn ${capturando === acao ? 'is-capturing' : ''}`}
                    onClick={() => setCapturando(capturando === acao ? null : acao)}
                  >
                    {capturando === acao ? 'pressione...' : keyLabel(binds[acao])}
                  </button>
                </div>
              ))}
              <button className="btn-link" style={{ marginTop: 6 }} onClick={() => { setBinds(resetBinds()); setCapturando(null); }}>
                ↺ restaurar padrão (C V B N M · ESPAÇO)
              </button>
            </div>
          )}

          <p className="cfg-hint">Teclas e áudio valem na hora. A qualidade vale a partir da próxima luta.</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-ghost" style={{ width: 'auto', padding: '10px 26px' }} onClick={fechar}>Fechar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
