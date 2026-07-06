import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import ItemIcon from '../lib/ItemIcon.jsx';

export const SLOT_LABEL = {
  weapon: 'Armas', head: 'Cabeça', face: 'Rosto', body: 'Corpo', back: 'Costas',
  arms: 'Braços', legs: 'Pernas', feet: 'Pés', effect: 'Efeitos',
};
export const RARITY_LABEL = { comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário' };

export default function Shop({ profile, onProfile }) {
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [coins, setCoins] = useState(profile.coins);
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api('/api/shop').then((d) => {
      setItems(d.items);
      setCoins(d.coins);
    });
  }, []);

  const buy = async (item) => {
    setBusy(item.id);
    setNotice(null);
    try {
      const d = await api('/api/shop/buy', { method: 'POST', body: { itemId: item.id } });
      setCoins(d.coins);
      onProfile?.((p) => ({ ...p, coins: d.coins }));
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, owned: true } : i)));
      setNotice({ ok: true, text: `${item.name} comprado! Foi para o seu baú.` });
    } catch (err) {
      setNotice({ ok: false, text: err.message });
    } finally {
      setBusy('');
    }
  };

  const shown = items.filter((i) => filter === 'all' || i.slot === filter);

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      <h1 className="brand" style={{ fontSize: 'clamp(36px, 7vw, 54px)' }}>
        LOJA <img className="h1-logo" src="/logo.webp" alt="STIKDEAD" />
      </h1>
      <div className="coins-pill">🪙 {coins.toLocaleString('pt-BR')} moedas</div>

      <div className="shop-filters">
        <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>Tudo</button>
        {Object.entries(SLOT_LABEL).map(([k, v]) => (
          <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{v}</button>
        ))}
      </div>

      {notice && (
        <div className={`shop-notice ${notice.ok ? 'ok' : 'err'}`} role="status">{notice.text}</div>
      )}

      <div className="shop-grid">
        {shown.map((item) => (
          <div key={item.id} className={`item-card r-${item.rarity}`}>
            <span className="item-rarity">{RARITY_LABEL[item.rarity]}</span>
            <ItemIcon item={item} size={64} />
            <span className="item-name">{item.name}</span>
            <span className="item-slot">{SLOT_LABEL[item.slot]}</span>
            {item.owned ? (
              <span className="item-owned">NO BAÚ ✓</span>
            ) : (
              <button
                className="item-buy"
                disabled={busy === item.id || coins < item.price}
                onClick={() => buy(item)}
              >
                🪙 {item.price.toLocaleString('pt-BR')}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
        <button className="btn btn-blood" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/inventario')}>
          Abrir baú e equipar
        </button>
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '12px 26px' }} onClick={() => nav('/perfil')}>
          Voltar
        </button>
      </div>
    </div>
  );
}
