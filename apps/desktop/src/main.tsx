import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
if (!container) throw new Error('AMYU mount is missing.');

// The product loads no lab UI or lab stylesheet. The lab remains a separate mode.
async function mount() {
  if (new URLSearchParams(window.location.search).get('mode') === 'lab') {
    document.title = 'AMYU · Avatar Lab (Developer)';
    const [{ AvatarLab }] = await Promise.all([import('@amyu/shared-ui'), import('@amyu/shared-ui/styles.css')]);
    createRoot(container!).render(<StrictMode><AvatarLab /></StrictMode>);
  } else {
    const [{ PetShell }] = await Promise.all([import('./PetShell'), import('./pet.css')]);
    createRoot(container!).render(<StrictMode><PetShell /></StrictMode>);
  }
}
void mount();
