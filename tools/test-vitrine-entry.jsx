// harness: renderiza a /vitrine sem auth para screenshots
import { createRoot } from 'react-dom/client';
import Vitrine from '../client/src/pages/Vitrine.jsx';
const el = document.createElement('div');
document.body.style.margin = '0';
document.body.appendChild(el);
createRoot(el).render(<Vitrine />);
setTimeout(() => { window.__pronto = true; }, 600);
