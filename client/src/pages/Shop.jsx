import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Navbar from '../lib/Navbar.jsx';
import ItemIcon from '../lib/ItemIcon.jsx';
import Icon from '../ds/Icon.jsx';
import { playUi } from '../game/audioLibrary.js';

// LOTE 5: cada raridade celebra a compra com o próprio timbre
const SOM_COMPRA = {
  comum: 'reward_item_common_01',
  raro: 'reward_item_rare_01',
  epico: 'reward_item_epic_01',
  lendario: 'reward_item_legendary_01',
  diamante: 'reward_diamond_01',
};

const ICONE_SLOT = {
  weapon: 'espada', head: 'mascara', face: 'perfil', body: 'armadura', back: 'esquiva',
  arms: 'soco', legs: 'chute', effect: 'aura', style: 'ultimate',
};
const ORDEM_RAR = ['diamante', 'lendario', 'epico', 'raro', 'comum'];

export const SLOT_LABEL = {
  weapon: 'Armas', head: 'Cabeça', face: 'Rosto', body: 'Corpo', back: 'Costas',
  arms: 'Braços', legs: 'Pernas', effect: 'Efeitos', style: 'Estilos ⚡',
};
export const RARITY_LABEL = { comum: 'Comum', raro: 'Raro', epico: 'Épico', lendario: 'Lendário', diamante: 'Diamante 💎' };

export default function Shop({ profile, onProfile }) {
  const [packs, setPacks] = useState([]);
  const [mpNotice, setMpNotice] = useState(null);
  useEffect(() => {
    api('/api/diamonds/packs').then((d) => {
      setPacks(d.packs || []);
      if (d.public_key && !window.MercadoPago) {
        const sc = document.createElement('script');
        sc.src = 'https://sdk.mercadopago.com/js/v2';
        sc.onload = () => { window.__mpKey = d.public_key; };
        document.head.appendChild(sc);
      } else if (d.public_key) {
        window.__mpKey = d.public_key;
      }
    }).catch(() => {});
    const pg = new URLSearchParams(window.location.search).get('pg');
    if (pg === 'ok') setMpNotice('💎 Pagamento aprovado! Seus diamantes chegam em instantes...');
    if (pg === 'pendente') setMpNotice('⏳ Pagamento em processamento — os diamantes entram assim que aprovar.');
    if (pg === 'erro') setMpNotice('❌ Pagamento não concluído. Nenhum valor foi cobrado.');
    if (pg === 'ok' || pg === 'pendente') setTimeout(() => window.location.replace('/loja'), 6000);
  }, []);
  const [buying, setBuying] = useState(false);
  const buyPack = async (id) => {
    if (buying) return;
    playUi('ui_confirm_01'); // LOTE 5: abrir checkout de diamantes
    setBuying(true);
    try {
      const d = await api('/api/diamonds/checkout', { method: 'POST', body: { pack: id } });
      if (window.MercadoPago && window.__mpKey && d.preference_id) {
        // modal dentro do jogo (iframe seguro do MP)
        const mp = new window.MercadoPago(window.__mpKey, { locale: 'pt-BR' });
        mp.checkout({ preference: { id: d.preference_id }, autoOpen: true });
        setBuying(false);
      } else {
        window.location.href = d.init_point; // fallback: página do MP
      }
    } catch (e) {
      // UPDATE 3.1: sem alert() bloqueante — aviso padrão da loja + som de erro
      setMpNotice(`❌ ${e.message || 'Pagamentos indisponíveis no momento.'}`);
      playUi('ui_error_01');
      setBuying(false);
    }
  };

  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [coins, setCoins] = useState(profile.coins);
  const [payWith, setPayWith] = useState('coins');
  const [filter, setFilter] = useState(() => new URLSearchParams(window.location.search).get('slot') || 'all');
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
      if (d.diamonds !== undefined) {
        onProfile?.((p) => ({ ...p, diamonds: d.diamonds }));
      } else {
        setCoins(d.coins);
        onProfile?.((p) => ({ ...p, coins: d.coins }));
      }
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, owned: true } : i)));
      setNotice({ ok: true, text: `${item.name} comprado! Foi para o seu baú.` });
      playUi(SOM_COMPRA[item.rarity] || 'reward_item_common_01'); // LOTE 5
    } catch (err) {
      setNotice({ ok: false, text: err.message });
      playUi('ui_error_01'); // LOTE 5: erro tem voz própria
    } finally {
      setBusy('');
    }
  };

  const shown = items.filter((i) => ((i.currency || 'coins') === payWith) && (filter === 'all' || i.slot === filter));
  const porRaridade = [...shown].sort((a, b) => ORDEM_RAR.indexOf(a.rarity) - ORDEM_RAR.indexOf(b.rarity));
  const destaque = porRaridade.find((i) => !i.owned) || porRaridade[0];
  const emDestaque = porRaridade.find((i) => i !== destaque && !i.owned) || porRaridade.find((i) => i !== destaque);
  const podePagar = (it) => (it.currency === 'diamonds' ? (profile.diamonds || 0) >= it.price : coins >= it.price);

  return (
    <div className="scene scene-nav">
      <Navbar profile={profile} />
      {notice && (
        <div className={`shop-notice ${notice.ok ? 'ok' : 'err'}`} role="status">{notice.text}</div>
      )}
      {mpNotice && <div className="mp-notice">{mpNotice}</div>}

      <div className="loja-layout">
        {/* ===== categorias (mockup: sidebar esquerda) ===== */}
        <aside className="loja-menu">
          <h1 className="loja-titulo"><Icon name="loja" size={19} weight="forte" /> LOJA</h1>
          <button className={filter === 'all' ? 'on' : ''} onClick={() => { playUi('ui_tab_switch_01'); setFilter('all'); }}>
            <Icon name="favorito" size={14} weight="forte" /> DESTAQUES
          </button>
          {Object.entries(SLOT_LABEL).map(([k, v]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => { playUi('ui_tab_switch_01'); setFilter(k); }}>
              <Icon name={ICONE_SLOT[k] || 'inventario'} size={14} weight="forte" /> {v.replace(' ⚡', '').toUpperCase()}
            </button>
          ))}
          <div className="loja-pagar">
            <small>PAGAR COM</small>
            <button className={`lp-btn ${payWith === 'coins' ? 'on' : ''}`} onClick={() => setPayWith('coins')}>
              <Icon name="moeda" size={14} weight="forte" /> {coins.toLocaleString('pt-BR')}
            </button>
            <button className={`lp-btn lp-dia ${payWith === 'diamonds' ? 'on' : ''}`} onClick={() => setPayWith('diamonds')}>
              <Icon name="diamante" size={14} weight="forte" /> {Number(profile.diamonds || 0).toLocaleString('pt-BR')}
            </button>
          </div>
        </aside>

        {/* ===== centro: destaque + catálogo ===== */}
        <main className="loja-centro">
          {destaque && (
            <section className={`loja-destaque r-${destaque.rarity}`}>
              <div className="ld-info">
                <small>DESTAQUE {payWith === 'diamonds' ? 'PREMIUM' : ''}</small>
                <h2>{destaque.name}</h2>
                <span className="ld-tags">
                  <em className="ld-rar">{RARITY_LABEL[destaque.rarity]}</em>
                  <em>{SLOT_LABEL[destaque.slot]}</em>
                </span>
                {destaque.owned ? (
                  <span className="item-owned">NO BAÚ ✓</span>
                ) : (
                  <button className="ld-comprar" disabled={busy === destaque.id || !podePagar(destaque)} onClick={() => buy(destaque)}>
                    <Icon name={destaque.currency === 'diamonds' ? 'diamante' : 'moeda'} size={15} weight="forte" /> {destaque.price.toLocaleString('pt-BR')} · COMPRAR
                  </button>
                )}
              </div>
              <div className="ld-arte"><ItemIcon item={destaque} size={128} /></div>
            </section>
          )}

          <div className="loja-sec-titulo"><Icon name="inventario" size={14} weight="forte" /> CATÁLOGO <b>{shown.length}</b></div>
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
                    disabled={busy === item.id || !podePagar(item)}
                    onClick={() => buy(item)}
                  >
                    <Icon name={item.currency === 'diamonds' ? 'diamante' : 'moeda'} size={12} weight="forte" /> {item.price.toLocaleString('pt-BR')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* ===== direita: diamantes + vitrine (mockup: ofertas especiais) ===== */}
        <aside className="loja-direita">
          <section className="dash-card diamantes-painel">
            <h2><Icon name="diamante" size={15} weight="forte" className="h2-ico" /> DIAMANTES</h2>
            <p className="dash-empty" style={{ margin: '0 0 8px' }}>Compra segura via Mercado Pago — Pix ou cartão.</p>
            {packs.map((p) => (
              <button key={p.id} className="dp-linha" onClick={() => buyPack(p.id)} disabled={buying}>
                <span className="dp-qtd"><Icon name="diamante" size={15} weight="forte" /> {p.diamonds.toLocaleString('pt-BR')}</span>
                <span className="dp-nome">{p.label.replace(' de Diamantes', '')}</span>
                <b className="dp-preco">R$ {(p.cents / 100).toFixed(2).replace('.', ',')}</b>
              </button>
            ))}
          </section>

          {emDestaque && (
            <section className={`dash-card item-vitrine r-${emDestaque.rarity}`}>
              <h2><Icon name="favorito" size={15} weight="forte" className="h2-ico" /> ITEM EM DESTAQUE</h2>
              <div className="iv-arte"><ItemIcon item={emDestaque} size={92} /></div>
              <b className="iv-nome">{emDestaque.name}</b>
              <span className="iv-rar">{RARITY_LABEL[emDestaque.rarity]} · {SLOT_LABEL[emDestaque.slot]}</span>
              {emDestaque.owned ? (
                <span className="item-owned">NO BAÚ ✓</span>
              ) : (
                <button className="item-buy" disabled={busy === emDestaque.id || !podePagar(emDestaque)} onClick={() => buy(emDestaque)}>
                  <Icon name={emDestaque.currency === 'diamonds' ? 'diamante' : 'moeda'} size={13} weight="forte" /> {emDestaque.price.toLocaleString('pt-BR')}
                </button>
              )}
            </section>
          )}

          <button className="btn btn-ghost loja-bau" onClick={() => nav('/inventario')}>
            <Icon name="inventario" size={14} weight="forte" /> ABRIR BAÚ E EQUIPAR
          </button>
        </aside>
      </div>
    </div>
  );
}
