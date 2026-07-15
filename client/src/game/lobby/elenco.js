// STIKDEAD :: LOBBY V2 — elenco ambiente da praça
// Figurantes fictícios (andam, duelam, soltam emotes e frases) + NPCs fixos.
// 100% visual: nunca entram na lista real de jogadores nem no contador.

const NOMES = [
  'Shadow', 'Killer87', 'Darkness', 'Samurai', 'RoninBR', 'Fantasma', 'Zeca_Blade',
  'Mira', 'Oni', 'Vulto', 'Katana_Zero', 'Breu', 'Lamina', 'Corvo', 'Tempestade',
  'Anbu', 'Sombra7', 'Ceifador', 'Dragao', 'Espectro', 'Nix', 'Fera', 'Aki',
];

const FRASES = [
  'gg', 'alguém x1?', 'bora torneio 🏆', 'essa skin é nova? 🔥', 'quase diamante…',
  'cadê o ferreiro?', 'perdi pro bot insano de novo 💀', 'x1 valendo moedas?',
  'meu combo tá afiado', 'boa luta!', 'alguém de dupla?', 'to farmando missão',
];

const EMOTES = ['⚔️', '🔥', '👋', '😂', '💀', '🏆', '💪', '😤'];

const CORES = ['#d90429', '#8b5cf6', '#4da3ff', '#4dee98', '#ffd166', '#ff7a1a', '#e0558a'];
const ARMAS = ['katana', 'bo', 'axe', 'spear', 'scythe', 'dual', 'nunchaku'];
const CARAS = ['bandana', 'mask_oni', 'mask_skull', 'mask_hockey', null, null];

const sorteia = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function loadoutFigurante() {
  const l = [{ slot: 'weapon', template: sorteia(ARMAS), params: {} }];
  const cara = sorteia(CARAS);
  if (cara) l.push({ slot: 'face', template: cara, params: { color: sorteia(CORES) } });
  if (Math.random() < 0.45) l.push({ slot: 'body', template: 'scarf', params: { color: sorteia(CORES) } });
  if (Math.random() < 0.3) l.push({ slot: 'back', template: 'cape', params: { color: sorteia(CORES) } });
  if (Math.random() < 0.14) l.push({ slot: 'back', template: 'aura', params: { color: sorteia(CORES) } });
  return l;
}

export const NPCS = [
  { id: 'npc:ferreiro', kind: 'ferreiro', name: 'FERREIRO', px: 0.1, loadout: [{ slot: 'weapon', template: 'axe', params: { blade: '#9a948a' } }, { slot: 'body', template: 'scarf', params: { color: '#6b4b2a' } }] },
  { id: 'npc:loja', kind: 'loja', name: 'LOJA', px: 0.26, loadout: [{ slot: 'body', template: 'scarf', params: { color: '#ffd166' } }, { slot: 'head', template: 'hat', params: { color: '#2a1a20' } }] },
  { id: 'npc:eventos', kind: 'eventos', name: 'EVENTOS', px: 0.74, loadout: [{ slot: 'back', template: 'cape', params: { color: '#8b5cf6' } }] },
  { id: 'npc:torneio', kind: 'torneio', name: 'TORNEIO', px: 0.9, loadout: [{ slot: 'face', template: 'mask_oni', params: { color: '#d90429' } }] },
];

// ---------- diretor ----------
// Mantém a praça povoada e dirige duelos/emotes/frases dos figurantes.
export function createDiretor({ alvo = 8, digaBalao, emote, faiscas }) {
  const vivos = new Map(); // id -> ator (registrado pela praça)
  let usados = new Set();
  let tCena = 3 + Math.random() * 4;
  let duelo = null;

  const nomeLivre = () => {
    const livres = NOMES.filter((n) => !usados.has(n));
    if (!livres.length) { usados = new Set(); return sorteia(NOMES); }
    const n = sorteia(livres);
    usados.add(n);
    return n;
  };

  const novoFigurante = () => ({
    id: `fig:${Math.random().toString(36).slice(2, 8)}`,
    name: nomeLivre(),
    loadout: loadoutFigurante(),
    figurante: true,
  });

  return {
    registra(id, ator) { vivos.set(id, ator); },
    esquece(id) {
      vivos.delete(id);
      if (duelo && (duelo.a.id === id || duelo.b.id === id)) {
        duelo.a.emCena = false;
        duelo.b.emCena = false;
        duelo = null;
      }
    },
    precisa(qtosReais) {
      // quantos figurantes garantem a praça cheia
      return Math.max(0, alvo - qtosReais);
    },
    novoFigurante,

    tick(dt) {
      // ===== duelo em andamento =====
      if (duelo) {
        duelo.t -= dt;
        const { a, b } = duelo;
        if (!vivos.has(a.id) || !vivos.has(b.id)) { duelo = null; return; }
        const A = vivos.get(a.id), B = vivos.get(b.id);
        if (duelo.fase === 'aproxima') {
          const dist = Math.abs(A.f.x - B.f.x);
          A.f.face = A.f.x < B.f.x ? 1 : -1; B.f.face = -A.f.face;
          if (dist > 86) {
            A.f.state = 'walk'; B.f.state = 'walk';
            A.f.x += A.f.face * 46 * dt; B.f.x += B.f.face * 46 * dt;
          } else { duelo.fase = 'troca'; duelo.t = 0.4; A.f.state = 'idle'; B.f.state = 'idle'; }
        } else if (duelo.fase === 'troca') {
          if (duelo.t <= 0) {
            duelo.golpes--;
            const atk = Math.random() < 0.5 ? A : B;
            const def = atk === A ? B : A;
            atk.f.state = Math.random() < 0.6 ? 'light' : 'heavy'; atk.f.t = 0;
            const defende = Math.random() < 0.6;
            def.f.state = defende ? 'block' : 'hit'; def.f.t = 0; def.f.hitstun = 0.3;
            if (!defende) def.f.x += def.f.face * -7;
            faiscas?.((A.f.x + B.f.x) / 2, 96, defende ? 4 : 9, defende ? 0x9fd8ff : 0xffb84d);
            duelo.t = 0.5 + Math.random() * 0.5;
            if (duelo.golpes <= 0) {
              duelo.fase = 'final'; duelo.t = 2.1;
              const win = Math.random() < 0.5 ? A : B;
              const lose = win === A ? B : A;
              win.f.state = 'victory'; win.f.t = 0;
              lose.f.state = 'ko'; lose.f.t = 0;
              emote?.(win, '🔥');
            }
          }
        } else if (duelo.fase === 'final' && duelo.t <= 0) {
          A.f.state = 'walk'; B.f.state = 'walk'; A.f.t = 0; B.f.t = 0;
          A.f.face = -1; B.f.face = 1;
          A.emCena = false; B.emCena = false;
          duelo = null;
        }
        return;
      }

      // ===== próxima cena ambiente =====
      tCena -= dt;
      if (tCena > 0) return;
      tCena = 6 + Math.random() * 9;
      const figurantes = [...vivos.values()].filter((v) => v.figurante && !v.saindo && v.f.state !== 'ko');
      if (!figurantes.length) return;
      const dado = Math.random();
      if (dado < 0.3 && figurantes.length >= 2) {
        // começa um duelo entre dois figurantes
        const a = sorteia(figurantes);
        let b = sorteia(figurantes);
        if (a === b) b = figurantes.find((f) => f !== a);
        if (!b) return;
        a.emCena = true; b.emCena = true;
        duelo = { a, b, fase: 'aproxima', t: 0, golpes: 6 + Math.floor(Math.random() * 7) };
      } else if (dado < 0.62) {
        emote?.(sorteia(figurantes), sorteia(EMOTES));
      } else {
        digaBalao?.(sorteia(figurantes), sorteia(FRASES));
      }
    },
  };
}
