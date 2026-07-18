import { Suspense, useEffect, useMemo, useState } from 'react';
import { demos } from './registry';
import './app.scss';

function useHash(): [string, (h: string) => void] {
  const [hash, setHash] = useState(() => window.location.hash.slice(1));
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return [hash, (h) => (window.location.hash = h)];
}

export function App() {
  const [hash, navigate] = useHash();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('sc-theme') as 'light' | 'dark') || 'light',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sc-theme', theme);
  }, [theme]);

  const active = demos.find((d) => d.id === hash) ?? demos[0];
  const groups = useMemo(() => {
    const map = new Map<string, typeof demos>();
    for (const d of demos) {
      if (!map.has(d.group)) map.set(d.group, []);
      map.get(d.group)!.push(d);
    }
    return [...map.entries()];
  }, []);

  const Active = active.component;

  return (
    <div className="sc-app">
      <aside className="sc-app__sidebar">
        <div className="sc-app__brand">
          <span className="sc-app__logo">uikit</span>
          <button
            className="sc-app__theme"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Toggle theme"
          >
            {theme === 'light' ? '☾' : '☀'}
          </button>
        </div>
        <nav>
          {groups.map(([group, items]) => (
            <div className="sc-app__group" key={group}>
              <div className="sc-app__group-title">{group}</div>
              {items.map((d) => (
                <button
                  key={d.id}
                  className={d.id === active.id ? 'sc-app__navitem sc-app__navitem--active' : 'sc-app__navitem'}
                  onClick={() => navigate(d.id)}
                >
                  {d.title}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="sc-app__main">
        <Suspense fallback={<div className="sc-app__loading">Loading…</div>}>
          <Active />
        </Suspense>
      </main>
    </div>
  );
}
