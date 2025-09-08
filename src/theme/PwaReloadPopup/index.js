import React from 'react';

// Minimal PWA reload popup component used by @docusaurus/plugin-pwa
// The real plugin will call this via dynamic import and pass props.
export default function PwaReloadPopup({ onReload, onClose }) {
  return (
    React.createElement('div', { style: { position: 'fixed', bottom: 16, right: 16, zIndex: 9999, background: 'white', border: '1px solid #ccc', padding: 12, borderRadius: 6 } },
      React.createElement('div', null, 'Une mise à jour est disponible.'),
      React.createElement('div', { style: { marginTop: 8, display: 'flex', gap: 8 } },
        React.createElement('button', { onClick: onReload }, 'Recharger'),
        React.createElement('button', { onClick: onClose }, 'Ignorer')
      )
    )
  );
}
