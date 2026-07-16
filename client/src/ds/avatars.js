// STIKDEAD — Galeria de avatares (Profile Icons)
// Cada avatar é um .webp em /arte/avatar-<key>.webp, no frame estilizado da marca.
export const AVATARS = [
  { key: 'padrao',   label: 'Clássico', cor: '#ff3b4e' },
  { key: 'ninja',    label: 'Shinobi',  cor: '#ff3b4e' },
  { key: 'samurai',  label: 'Samurai',  cor: '#5bb8ff' },
  { key: 'ceifador', label: 'Ceifador', cor: '#7de0a8' },
  { key: 'oni',      label: 'Oni',      cor: '#b98cff' },
  { key: 'caveira',  label: 'Caveira',  cor: '#ffd76a' },
  { key: 'raposa',   label: 'Kitsune',  cor: '#4de6e6' },
];

export const AVATAR_KEYS = AVATARS.map((a) => a.key);

// caminho da arte, com fallback seguro pro padrão
export const avatarSrc = (key) => `/arte/avatar-${AVATAR_KEYS.includes(key) ? key : 'padrao'}.webp`;
