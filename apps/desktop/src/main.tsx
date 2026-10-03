import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AvatarLab } from '@amyu/shared-ui';
import '@amyu/shared-ui/styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Avatar Lab mount is missing.');

createRoot(container).render(
  <StrictMode>
    <AvatarLab />
  </StrictMode>,
);
