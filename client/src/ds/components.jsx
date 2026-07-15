// ============================================================
// STIKDEAD DS — biblioteca oficial de componentes.
// REGRA: nenhuma página cria componente próprio de UI; tudo nasce aqui.
// Estilos em components.css · tokens em tokens.css · regras em DESIGN_SYSTEM.md
// ============================================================
import { useEffect, useRef, useState, createContext, useContext, useCallback } from 'react';
import Icon from './Icon.jsx';

/* ---------- PANEL: a moldura canônica (chanfro + filete + header) ---------- */
export function Panel({ title, icon, actions, tone = 'iron', children, className = '', ...rest }) {
  return (
    <section className={`sd-panel sd-panel--${tone} ${className}`} {...rest}>
      {(title || actions) && (
        <header className="sd-panel-head">
          {icon && <Icon name={icon} size="sm" weight="forte" className="sd-panel-ico" />}
          {title && <h3 className="sd-h3 sd-panel-title">{title}</h3>}
          {actions && <div className="sd-panel-actions">{actions}</div>}
        </header>
      )}
      <div className="sd-panel-body">{children}</div>
    </section>
  );
}

/* ---------- BUTTON: CTA de sangue + variações ---------- */
export function Button({ variant = 'blood', size = 'md', icon, children, className = '', ...rest }) {
  return (
    <button className={`sd-btn sd-btn--${variant} sd-btn--${size} ${className}`} {...rest}>
      <span className="sd-btn-borda" aria-hidden="true" />
      {icon && <Icon name={icon} size={size === 'lg' ? 'md' : 'sm'} weight="forte" />}
      <span className="sd-btn-text">{children}</span>
    </button>
  );
}

/* ---------- CARD: item/conteúdo com raridade ---------- */
export function Card({ rarity, selected = false, equipado = false, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`sd-card ${rarity ? `sd-card--${rarity}` : ''} ${selected ? 'is-selected' : ''} ${equipado ? 'is-equipado' : ''} ${className}`}
    >
      {rarity && <span className="sd-card-raridade sd-label">{rarity}</span>}
      {children}
    </button>
  );
}

/* ---------- INPUT ---------- */
export function Input({ label, icon, ...rest }) {
  return (
    <label className="sd-field">
      {label && <span className="sd-label">{label}</span>}
      <span className="sd-input-wrap">
        {icon && <Icon name={icon} size="sm" className="sd-input-ico" />}
        <input className="sd-input" {...rest} />
      </span>
    </label>
  );
}

/* ---------- PROGRESS / VIDA / XP ---------- */
export function ProgressBar({ value = 0, max = 100, tone = 'blood', label, showNumber = false }) {
  const k = Math.max(0, Math.min(1, value / max));
  return (
    <div className="sd-prog" role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-label={label}>
      {label && <span className="sd-caption sd-prog-label">{label}</span>}
      <div className={`sd-prog-track sd-prog--${tone}`}>
        <div className="sd-prog-fill" style={{ width: `${k * 100}%` }} />
        <div className="sd-prog-brilho" />
      </div>
      {showNumber && <span className="sd-impact-sm sd-prog-num">{Math.round(value)}<i>/{max}</i></span>}
    </div>
  );
}
export function HealthBar({ hp = 100, lado = 'esq', nome }) {
  return (
    <div className={`sd-vida sd-vida--${lado}`}>
      {nome && <span className="sd-label sd-vida-nome">{nome}</span>}
      <div className="sd-vida-track">
        <div className="sd-vida-fill" style={{ width: `${Math.max(0, Math.min(100, hp))}%` }} />
        <div className="sd-vida-dano" style={{ width: `${Math.max(0, Math.min(100, hp))}%` }} />
      </div>
    </div>
  );
}
export function XpBar({ xp, max, nivel }) {
  return (
    <div className="sd-xp">
      <span className="sd-xp-nivel sd-impact-sm">{nivel}</span>
      <div className="sd-xp-track"><div className="sd-xp-fill" style={{ width: `${(xp / max) * 100}%` }} /></div>
      <span className="sd-caption">{xp}/{max} XP</span>
    </div>
  );
}

/* ---------- BADGE ---------- */
export function Badge({ tone = 'blood', icon, children }) {
  return (
    <span className={`sd-badge sd-badge--${tone}`}>
      {icon && <Icon name={icon} size="xs" weight="forte" />}
      {children}
    </span>
  );
}

/* ---------- TABS ---------- */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="sd-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value} role="tab" aria-selected={value === t.value}
          className={`sd-tab ${value === t.value ? 'is-on' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.icon && <Icon name={t.icon} size="xs" weight="forte" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- MODAL cerimonial ---------- */
export function Modal({ open, onClose, title, icon, children, actions }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sd-modal-veu" onClick={onClose}>
      <div className="sd-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <header className="sd-modal-head">
          {icon && <Icon name={icon} size="md" weight="forte" className="sd-modal-ico" />}
          <h2 className="sd-h2">{title}</h2>
          <button className="sd-modal-x" onClick={onClose} aria-label="Fechar"><Icon name="fechar" size="sm" /></button>
        </header>
        <div className="sd-modal-body">{children}</div>
        {actions && <footer className="sd-modal-pe">{actions}</footer>}
      </div>
    </div>
  );
}

/* ---------- TOOLTIP ---------- */
export function Tooltip({ text, children }) {
  return (
    <span className="sd-tip-wrap">
      {children}
      <span className="sd-tip" role="tooltip">{text}</span>
    </span>
  );
}

/* ---------- TOAST ---------- */
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, tone = 'blood', icon) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, tone, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="sd-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`sd-toast sd-toast--${t.tone}`}>
            {t.icon && <Icon name={t.icon} size="sm" weight="forte" />}
            <span className="sd-body-m">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- DROPDOWN ---------- */
export function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', fn);
    return () => document.removeEventListener('pointerdown', fn);
  }, []);
  const atual = options.find((o) => o.value === value);
  return (
    <div className={`sd-drop ${open ? 'is-open' : ''}`} ref={ref}>
      {label && <span className="sd-label">{label}</span>}
      <button className="sd-drop-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{atual?.label || '—'}</span>
        <Icon name="voltar" size="xs" className="sd-drop-seta" />
      </button>
      {open && (
        <ul className="sd-drop-lista" role="listbox">
          {options.map((o) => (
            <li key={o.value}>
              <button
                className={`sd-drop-item ${o.value === value ? 'is-on' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >{o.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- STAT BLOCK ---------- */
export function StatBlock({ icon, label, value, tone = '' }) {
  return (
    <div className="sd-stat">
      {icon && <Icon name={icon} size="sm" weight="forte" className={`sd-stat-ico ${tone ? `sd-impact--${tone}` : ''}`} />}
      <span className={`sd-impact sd-stat-n ${tone ? `sd-impact--${tone}` : ''}`}>{value}</span>
      <span className="sd-label">{label}</span>
    </div>
  );
}

/* ---------- ANIMATED NUMBER (rAF, sem setInterval) ---------- */
export function AnimatedNumber({ value, duration = 700, format = (n) => Math.round(n).toLocaleString('pt-BR'), className = '' }) {
  const [shown, setShown] = useState(value);
  const de = useRef(value);
  useEffect(() => {
    const a = de.current, b = value;
    if (a === b) return;
    const t0 = performance.now();
    let raf;
    const passo = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      const e = 1 - (1 - k) * (1 - k) * (1 - k); // ease-out cubic
      setShown(a + (b - a) * e);
      if (k < 1) raf = requestAnimationFrame(passo);
      else de.current = b;
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className={`sd-num ${className}`}>{format(shown)}</span>;
}
