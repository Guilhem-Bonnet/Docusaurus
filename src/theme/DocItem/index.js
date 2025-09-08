import React from 'react';
import OriginalDocItem from '@theme-original/DocItem';

let lastUpdates = {};
try {
  // créé par plugins/git-lastupdate via createData(...)
  // disponible sous : @generated/git-lastupdate/lastUpdates.json
  // charger via eval('require') pour empêcher le bundler de résoudre
  // statiquement la dépendance quand le fichier n'existe pas encore.
  // eslint-disable-next-line no-eval
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const req = eval("require");
  lastUpdates = req('@generated/git-lastupdate/lastUpdates.json');
} catch (e) {
  lastUpdates = {};
}

// Client-side fetch fallback: if the generated module wasn't available
// during bundling, attempt to fetch the static JSON at runtime.
if (typeof window !== 'undefined' && Object.keys(lastUpdates).length === 0) {
  (async () => {
    try {
      const res = await fetch('/git-lastupdate/lastUpdates.json');
      if (res && res.ok) {
        const j = await res.json();
        // Mutate the object used by the component.
        Object.assign(lastUpdates, j);
      }
    } catch (err) {
      // ignore
    }
  })();
}

export default function DocItem(props) {
  // Remplacement de l'optional chaining pour compatibilité parser
  const metadata = (props && props.content && props.content.metadata) ? props.content.metadata : {};

  // Essayer d'obtenir un chemin relatif dans ./docs
  let key = '';
  if (metadata.source && typeof metadata.source === 'string') {
    const src = metadata.source;
    const idx = src.indexOf('/docs/');
    if (idx !== -1) {
      key = src.slice(idx + 6);
    } else {
      const winIdx = src.indexOf('\\docs\\');
      if (winIdx !== -1) key = src.slice(winIdx + 6);
    }
    key = key.replace(/\\+/g, '/').replace(/\.(md|mdx)$/, '').replace(/^\/+/, '');
  }
  if (!key) key = metadata.unversionedId || metadata.id || '';

  const info = lastUpdates[key];

  return (
    <React.Fragment>
      <OriginalDocItem {...props} />
      {(info && (info.author || info.timestamp)) ? (
        <div style={{ marginTop: 24, fontSize: '0.9rem', color: 'var(--ifm-color-gray-600)' }}>
          {info.author ? (
            <>Dernière modification par {info.author}</>
          ) : (
            <>Dernière modification</>
          )}
          {info.timestamp ? (
            <>
              {' '}
              — le {new Date(info.timestamp * 1000).toLocaleString('fr-FR')}
            </>
          ) : null}
        </div>
      ) : null}
    </React.Fragment>
  );
}

