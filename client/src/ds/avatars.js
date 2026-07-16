// STIKDEAD — Galeria de avatares (Profile Icons)
// Arte em /arte/avatar-<key>.webp — 10 personagens na identidade da marca.
export const AVATARS = [
  { key: 'shinobi',   label: 'Shinobi',   cor: '#b98cff' },
  { key: 'kitsune',   label: 'Kitsune',   cor: '#ff3b4e' },
  { key: 'espectro',  label: 'Espectro',  cor: '#ff3344' },
  { key: 'predador',  label: 'Predador',  cor: '#b07cff' },
  { key: 'dourado',   label: 'Dourado',   cor: '#ffd76a' },
  { key: 'campeao',   label: 'Campeão',   cor: '#ffd76a' },
  { key: 'samurai',   label: 'Samurai',   cor: '#ff5a4e' },
  { key: 'oni',       label: 'Oni',       cor: '#ff7a1a' },
  { key: 'ceifador',  label: 'Ceifador',  cor: '#a78bfa' },
  { key: 'imperador', label: 'Imperador', cor: '#ffcf5a' },
];

export const AVATAR_KEYS = AVATARS.map((a) => a.key);
const FALLBACK = AVATARS[0].key;

// caminho da arte, com fallback seguro (valores antigos caem no 1º avatar)
export const avatarSrc = (key) => `/arte/avatar-${AVATAR_KEYS.includes(key) ? key : FALLBACK}.webp`;
