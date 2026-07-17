import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import { getSocket } from '../lib/socket.js';
import { createPreview } from '../game/preview.js';
import ItemIcon from '../lib/ItemIcon.jsx';
import { SLOT_LABEL, RARITY_LABEL } from './Shop.jsx';
import Icon from '../ds/Icon.jsx';
import { sfx, unlockAudio } from '../game/audio.js';

const SLOTS = ['head', 'face', 'body', 'back', 'weapon', 'arms', 'legs', 'effect'];

export default function Inventory({ profile }) {
  const nav = useNavigate();
  const [chest, setChest] = useState([]);
  const [loadout, setLoadout] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState(null); // painel de detalhe (só UI)
  const [notice, setNotice] = useState('');
  const [dragOver, setDragOver] = useState('');
  const previewHost = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    api('/api/inventory').then((d) => {
      setChest(d.chest);
      setLoadout(d.loadout);
    });
  }, []);

  useEffect(() => {
    let alive = true;
    createPreview(previewHost.current).then((p) => {
      if (!alive) return p.destroy();
      previewRef.current = p;
      p.setLoadout(loadout);
    });
    return () => {
      alive = false;
      previewRef.current?.destroy();
      previewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    previewRef.current?.setLoadout(loadout);
  }, [loadout]);

  const setSlot = async (slot, itemId) => {
    setNotice('');
    try {
      const d = await api('/api/loadout', { method: 'PUT', body: { slot, itemId } });
      setLoadout(d.loadout);
      unlockAudio(); (itemId ? sfx.drop() : sfx.click()); // UPDATE 2.8: feedback de equipar
      console.log('[stikdead] loadout salvo:', d.loadout.map((l) => `${l.slot}=${l.id}`).join(' '));
      try { getSocket().emit('loadout:refresh'); } catch { /* offline, sem problema */ }
    } catch (err) {
      setNotice(err.message);
    }
  };

  const equip = (item) => setSlot(item.slot, item.id);
  const equipped = Object.fromEntries(loadout.map((l) => [l.slot, l]));
  const shown = chest.filter((i) => filter === 'all' || i.slot === filter);

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      <div className="inv-header">
        <h1 className="inv-titulo"><Icon name="inventario" size={22} weight="forte" /> INVENTÁRIO</h1>
        <span className="inv-dica">Arraste do baú para equipar — ou toque no item para ver os detalhes</span>
      </div>
      {notice && <div className="shop-notice err" role="alert">{notice}</div>}

      <div className="inv-layout">
        <div className="inv-left">
          <div className="inv-preview" ref={previewHost} />
          <div className="inv-pose-row">
            {['idle', 'light', 'heavy', 'victory'].map((s) => (
              <button key={s} onClick={() => previewRef.current?.setPose(s)}>
                {{ idle: 'Parado', light: 'Soco', heavy: 'Chute', victory: 'Vitória' }[s]}
              </button>
            ))}
          </div>
          <div className="inv-slots">
            {SLOTS.map((slot) => {
              const it = equipped[slot];
              return (
                <div
                  key={slot}
                  className={`inv-slot ${it ? `r-${it.rarity}` : ''} ${dragOver === slot ? 'over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(slot); }}
                  onDragLeave={() => setDragOver('')}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver('');
                    const data = e.dataTransfer.getData('text/plain');
                    if (!data) return;
                    const [id, itemSlot] = data.split('|');
                    if (itemSlot === slot) setSlot(slot, id);
                    else setNotice('Esse item não encaixa nesse slot.');
                  }}
                >
                  <span className="inv-slot-label">{SLOT_LABEL[slot]}</span>
                  {it ? (
                    <>
                      <ItemIcon item={it} size={42} />
                      <button className="inv-unequip" onClick={() => setSlot(slot, null)} aria-label={`Remover ${it.name}`}>×</button>
                    </>
                  ) : (
                    <span className="inv-empty">—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="inv-right">
          <div className="inv-chest-head">
            <h2 style={{ margin: 0 }}><Icon name="inventario" size={16} weight="forte" className="h2-ico" /> BAÚ <b className="inv-total">{chest.length}</b></h2>
          </div>
          <div className="inv-tabs" role="tablist" aria-label="Filtrar por slot">
            <button role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>TODOS</button>
            {SLOTS.map((s) => (
              <button key={s} role="tab" aria-selected={filter === s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{SLOT_LABEL[s]}</button>
            ))}
          </div>
          {sel && (
            <div className={`inv-detalhe r-${sel.rarity}`}>
              <button className="inv-det-fechar" onClick={() => setSel(null)} aria-label="Fechar detalhes"><Icon name="fechar" size={14} /></button>
              <div className="inv-det-icone"><ItemIcon item={sel} size={84} /></div>
              <div className="inv-det-info">
                <h3>{sel.name}</h3>
                <div className="inv-det-tags">
                  <span className="inv-det-slot">{SLOT_LABEL[sel.slot]}</span>
                  <span className="inv-det-rar">{RARITY_LABEL[sel.rarity]}</span>
                  {sel.source === 'gift' && <span className="inv-det-gift">🎁 presente</span>}
                </div>
                {equipped[sel.slot]?.id === sel.id ? (
                  <button className="btn btn-ghost inv-det-acao" onClick={() => setSlot(sel.slot, null)}>REMOVER</button>
                ) : (
                  <button className="btn btn-blood inv-det-acao" onClick={() => equip(sel)}><Icon name="escudo" size={14} weight="forte" /> EQUIPAR</button>
                )}
              </div>
            </div>
          )}
          {chest.length === 0 && (
            <p className="switch-line" style={{ textAlign: 'left' }}>
              Seu baú está vazio. Lute para ganhar moedas e visite a loja!
            </p>
          )}
          <div className="inv-chest">
            {shown.map((item) => {
              const isOn = equipped[item.slot]?.id === item.id;
              return (
                <button
                  key={item.id}
                  className={`item-card mini r-${item.rarity} ${isOn ? 'equipped' : ''} ${sel?.id === item.id ? 'sel' : ''}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', `${item.id}|${item.slot}`)}
                  onClick={() => setSel(item)}
                  onDoubleClick={() => (isOn ? setSlot(item.slot, null) : equip(item))}
                  title={isOn ? 'Toque para detalhes · duplo toque remove' : 'Toque para detalhes · duplo toque equipa'}
                >
                  {item.source === 'gift' && <span className="inv-gift-badge" title="Ganho de presente">🎁</span>}
                  <ItemIcon item={item} size={46} />
                  <span className="item-name">{item.name}</span>
                  <span className="item-slot">{isOn ? 'EQUIPADO ✓' : `${SLOT_LABEL[item.slot]} · ${RARITY_LABEL[item.rarity]}`}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
        <button className="btn btn-blood" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/loja')}>
          Ir à loja
        </button>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/perfil')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
