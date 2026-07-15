// STIKDEAD DESIGN SYSTEM — ponto único de entrada.
// import { Panel, Button, Icon, ... } from '../ds';
import './tokens.css';
import './typography.css';
import './components.css';
import './atmosphere.css';
import './bridge.css'; // FASE 3: reveste as telas legadas com a identidade

export { default as Icon } from './Icon.jsx';
export { ICONS, ICON_NAMES } from './icons.js';
export { default as Atmosphere, ATMO_POR_TELA } from './Atmosphere.jsx';
export {
  Panel, Button, Card, Input, ProgressBar, HealthBar, XpBar,
  Badge, Tabs, Modal, Tooltip, ToastProvider, useToast,
  Dropdown, StatBlock, AnimatedNumber,
} from './components.jsx';
