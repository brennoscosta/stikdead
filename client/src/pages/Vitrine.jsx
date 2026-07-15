// ============================================================
// STIKDEAD DS — /vitrine : a sala de aprovação do Design System.
// Tela interna. Mostra tokens, tipografia, ícones, componentes,
// microanimações e as 3 intensidades de atmosfera, lado a lado.
// ============================================================
import { useState } from 'react';
import {
  Panel, Button, Card, Input, ProgressBar, HealthBar, XpBar, Badge, Tabs,
  Modal, Tooltip, ToastProvider, useToast, Dropdown, StatBlock, AnimatedNumber,
  Icon, ICON_NAMES, Atmosphere,
} from '../ds';

const CORES = [
  ['--sd-ink', 'Ink'], ['--sd-coal', 'Coal'], ['--sd-iron', 'Iron'], ['--sd-steel', 'Steel'],
  ['--sd-blood', 'Blood'], ['--sd-blood-hot', 'Blood Hot'], ['--sd-blood-deep', 'Blood Deep'],
  ['--sd-neon', 'Neon'], ['--sd-ice', 'Ice'], ['--sd-gold', 'Ouro'], ['--sd-gold-hot', 'Ouro Hot'],
  ['--sd-bone', 'Bone'], ['--sd-muted', 'Muted'],
];
const RARIDADES = ['comum', 'incomum', 'raro', 'epico', 'lendario', 'mitico', 'diamante'];

function Conteudo() {
  const [tab, setTab] = useState('armas');
  const [drop, setDrop] = useState('katana');
  const [modal, setModal] = useState(false);
  const [atmo, setAtmo] = useState('alta');
  const [num, setNum] = useState(48350);
  const [hp, setHp] = useState(72);
  const toast = useToast();

  return (
    <div className="sd-page sd-tela" style={{ position: 'relative', zIndex: 2 }}>
      <header style={{ margin: '8px 0 26px' }}>
        <p className="sd-h4">Design System · Fase 2 · aprovação</p>
        <h1 className="sd-h1">STIK<em>DEAD</em> — Sangue &amp; Aço</h1>
        <p className="sd-body-s">Tudo que está nesta tela é o padrão oficial. Nenhuma tela futura poderá fugir disto.</p>
      </header>

      {/* ===== 1. PALETA ===== */}
      <Panel title="1 · Paleta oficial" icon="aura" className="sd-anim-rise" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CORES.map(([v, nome]) => (
            <div key={v} style={{ width: 92 }}>
              <div style={{ height: 52, background: `var(${v})`, borderRadius: 8, boxShadow: 'var(--sd-depth-1)' }} />
              <p className="sd-caption" style={{ margin: '5px 0 0' }}>{nome}</p>
              <p className="sd-caption" style={{ margin: 0, color: 'var(--sd-faint)' }}>{v}</p>
            </div>
          ))}
        </div>
        <p className="sd-h4" style={{ margin: '18px 0 8px' }}>Raridades</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {RARIDADES.map((r) => (
            <Badge key={r} tone="muted"><i style={{ width: 10, height: 10, borderRadius: 99, background: `var(--sd-r-${r})`, boxShadow: `0 0 8px var(--sd-r-${r})` }} />{r}</Badge>
          ))}
        </div>
      </Panel>

      {/* ===== 2. TIPOGRAFIA ===== */}
      <Panel title="2 · Tipografia — 3 vozes por função" icon="missoes" style={{ marginBottom: 24 }}>
        <p className="sd-h4">Display · Rubik Wet Paint — marca e títulos de tela</p>
        <h1 className="sd-h1" style={{ margin: '2px 0 14px' }}>VITÓRIA <em>SANGRENTA</em></h1>
        <p className="sd-h4">UI · Barlow Condensed — menus, textos, inventário</p>
        <h2 className="sd-h2" style={{ margin: '2px 0 2px' }}>H2 — Seção do inventário</h2>
        <h3 className="sd-h3" style={{ margin: '2px 0 2px' }}>H3 — Cabeçalho de painel</h3>
        <p className="sd-body-l" style={{ margin: '6px 0 2px' }}>Body Large — descrições importantes de itens e eventos.</p>
        <p className="sd-body-m" style={{ margin: '2px 0 2px' }}>Body Medium — o texto padrão da interface do jogo.</p>
        <p className="sd-body-s" style={{ margin: '2px 0 10px' }}>Body Small — apoio, rodapés e metadados. <span className="sd-caption">Caption 12px.</span></p>
        <p className="sd-h4">Impact · Bebas Neue — SÓ números e feedback</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, flexWrap: 'wrap' }}>
          <span className="sd-impact-xl sd-impact--blood">×12</span>
          <span className="sd-impact-xl sd-impact--gold"><AnimatedNumber value={num} /></span>
          <span className="sd-impact">99</span>
          <span className="sd-impact-sm sd-impact--ice">+250 XP</span>
          <Button size="sm" variant="ghost" onClick={() => setNum((n) => n + 4870)}>+ ouro (counter)</Button>
        </div>
      </Panel>

      {/* ===== 3. ÍCONES ===== */}
      <Panel title="3 · StikDead Icon System" icon="espada" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {ICON_NAMES.map((n) => (
            <Tooltip key={n} text={n}>
              <span style={{ display: 'grid', placeItems: 'center', width: 58, height: 58, background: 'rgba(0,0,0,.35)', borderRadius: 10, color: 'var(--sd-bone)' }}>
                <Icon name={n} size="lg" />
              </span>
            </Tooltip>
          ))}
        </div>
        <p className="sd-h4" style={{ margin: '18px 0 8px' }}>Tamanhos · pesos · raridade · glow</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', color: 'var(--sd-bone)' }}>
          <Icon name="espada" size="xs" /><Icon name="espada" size="sm" /><Icon name="espada" size="md" />
          <Icon name="espada" size="lg" /><Icon name="espada" size="xl" /><Icon name="espada" size="hero" />
          <span style={{ width: 18 }} />
          <Icon name="cla" size="lg" weight="fino" /><Icon name="cla" size="lg" weight="medio" /><Icon name="cla" size="lg" weight="forte" />
          <span style={{ width: 18 }} />
          <Icon name="foice" size="lg" rarity="lendario" /><Icon name="diamante" size="lg" rarity="diamante" />
          <Icon name="mascara" size="lg" rarity="epico" /><Icon name="ultimate" size="lg" rarity="mitico" className="sd-anim-glow" />
        </div>
      </Panel>

      {/* ===== 4. BOTÕES / BADGES / INPUTS ===== */}
      <Panel title="4 · Botões · badges · inputs" icon="soco" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button size="lg" icon="espada" onClick={() => toast('Partida encontrada!', 'blood', 'espada')}>Buscar partida</Button>
          <Button variant="gold" icon="moeda" onClick={() => toast('+500 de ouro coletado', 'gold', 'moeda')}>Coletar</Button>
          <Button variant="void" icon="ultimate">Skill</Button>
          <Button variant="ghost" icon="config">Config</Button>
          <Button size="sm" icon="convite">Convidar</Button>
          <Button disabled icon="cadeado">Bloqueado</Button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
          <Badge icon="trofeu" tone="gold">Diamante I</Badge>
          <Badge icon="xp" tone="blood">Win streak ×7</Badge>
          <Badge icon="cla" tone="void">Shinobi Blood</Badge>
          <Badge icon="escudo" tone="ice">Defesa +12%</Badge>
          <Badge tone="muted">84/350 itens</Badge>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <Input label="Nome do lutador" placeholder="Digite seu nome..." icon="perfil" />
          <Input label="Buscar item" placeholder="katana, máscara..." icon="buscar" />
          <Dropdown label="Arma favorita" value={drop} onChange={setDrop} options={[
            { value: 'katana', label: 'Katana Infernal' }, { value: 'foice', label: 'Foice Sangrenta' },
            { value: 'arco', label: 'Arco Fantasma' },
          ]} />
        </div>
      </Panel>

      {/* ===== 5. CARDS DE RARIDADE ===== */}
      <Panel title="5 · Cards — raridades" icon="inventario" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))', gap: 12 }}>
          {RARIDADES.map((r, i) => (
            <Card key={r} rarity={r} equipado={r === 'lendario'} selected={r === 'diamante'}>
              <Icon name={['soco', 'chute', 'espada', 'mascara', 'foice', 'ultimate', 'diamante'][i]} size="xl" rarity={r} />
              <span className="sd-body-m sd-w700">{['Punho', 'Bota', 'Katana', 'Máscara', 'Foice', 'Estrela', 'Gema'][i]}</span>
              <span className="sd-caption">{r === 'lendario' ? 'EQUIPADO · aceso' : r === 'diamante' ? 'selecionado' : 'hover para sentir'}</span>
            </Card>
          ))}
        </div>
      </Panel>

      {/* ===== 6. PROGRESSO / VIDA / XP / STATS ===== */}
      <Panel title="6 · Barras e números" icon="xp" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gap: 14, maxWidth: 640 }}>
          <ProgressBar label="Missão: vença 3 partidas" value={2} max={3} tone="gold" showNumber />
          <ProgressBar label="Ki" value={64} tone="void" />
          <ProgressBar label="Cooldown da skill" value={38} tone="ice" />
          <div>
            <HealthBar hp={hp} nome="BRENNO" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => setHp((h2) => Math.max(0, h2 - 17))}>Tomar hit</Button>
              <Button size="sm" variant="ghost" onClick={() => setHp(100)}>Curar</Button>
            </div>
          </div>
          <XpBar nivel={72} xp={15430} max={25000} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 10 }}>
          <StatBlock icon="trofeu" label="Vitórias" value="2.568" tone="gold" />
          <StatBlock icon="combo" label="Maior combo" value="×14" tone="blood" />
          <StatBlock icon="xp" label="Win rate" value="71,5%" />
          <StatBlock icon="diamante" label="Diamantes" value={<AnimatedNumber value={2370} />} tone="ice" />
        </div>
      </Panel>

      {/* ===== 7. TABS / MODAL / TOAST / TOOLTIP ===== */}
      <Panel title="7 · Navegação e sobreposições" icon="chat" style={{ marginBottom: 24 }}>
        <Tabs value={tab} onChange={setTab} tabs={[
          { value: 'armas', label: 'Armas', icon: 'espada' },
          { value: 'armaduras', label: 'Armaduras', icon: 'armadura' },
          { value: 'mascaras', label: 'Máscaras', icon: 'mascara' },
          { value: 'auras', label: 'Auras', icon: 'aura' },
          { value: 'pets', label: 'Pets', icon: 'pet' },
        ]} />
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <Button variant="ghost" icon="convite" onClick={() => setModal(true)}>Abrir modal cerimonial</Button>
          <Button variant="ghost" icon="chat" onClick={() => toast('SHADOW-X te desafiou para um X1!', 'blood', 'espada')}>Disparar toast</Button>
          <Tooltip text="Golpes críticos causam 40% de dano extra">
            <Badge icon="espada" tone="blood">Passiva (hover)</Badge>
          </Tooltip>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Novo item desbloqueado!" icon="espada"
          actions={<><Button variant="ghost" onClick={() => setModal(false)}>Depois</Button><Button icon="espada" onClick={() => { setModal(false); toast('Katana Infernal equipada', 'gold', 'espada'); }}>Equipar</Button></>}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Icon name="espada" size="banner" rarity="lendario" className="sd-anim-glow" />
            <div>
              <p className="sd-h3" style={{ color: 'var(--sd-r-lendario)' }}>Katana Infernal</p>
              <p className="sd-body-m">A lâmina que sangra fogo. Golpes críticos aplicam <b>Sangramento</b>.</p>
              <Badge tone="gold" icon="ultimate">Lendária</Badge>
            </div>
          </div>
        </Modal>
      </Panel>

      {/* ===== 8. ATMOSFERA ===== */}
      <Panel title="8 · Atmosphere Manager — intensidade contextual" icon="aura" tone="red">
        <p className="sd-body-m">A atmosfera desta página está em <b style={{ color: 'var(--sd-blood-hot)' }}>{atmo.toUpperCase()}</b>. Troque e sinta a diferença (brasas, névoa, lua e vinheta escalam sozinhas pelo hardware).</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          {['alta', 'media', 'baixa'].map((n) => (
            <Button key={n} size="sm" variant={atmo === n ? 'blood' : 'ghost'} onClick={() => setAtmo(n)}>{n}</Button>
          ))}
        </div>
        <p className="sd-caption" style={{ marginTop: 12 }}>
          alta → login, lobby, matchmaking, cerimônias · media → perfil, inventário, loja, clã, ranking · baixa → configurações, formulários, admin
        </p>
      </Panel>

      <Atmosphere level={atmo} key={atmo} />
    </div>
  );
}

export default function Vitrine() {
  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', background: 'var(--sd-ink)' }}>
        <Conteudo />
      </div>
    </ToastProvider>
  );
}
