import { useEffect, useState } from 'react';

export const APP_NAVIGATION_EVENT = 'docwallet:navigate';

const normalizePath = (path: string) => {
  if (!path) return '/';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

export const navigate = (path: string, replace = false) => {
  const next = normalizePath(path);
  if (next.startsWith('http://') || next.startsWith('https://')) {
    window.location.assign(next);
    return;
  }

  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === next) return;

  if (replace) window.history.replaceState({}, '', next);
  else window.history.pushState({}, '', next);

  window.dispatchEvent(new CustomEvent(APP_NAVIGATION_EVENT, { detail: next }));
  window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
};

export const useAppPath = () => {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    window.addEventListener(APP_NAVIGATION_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(APP_NAVIGATION_EVENT, sync);
    };
  }, []);

  return path;
};

interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const AppLink: React.FC<AppLinkProps> = ({ href, onClick, target, children, ...props }) => (
  <a
    href={href}
    target={target}
    {...props}
    onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      if (!href.startsWith('/')) return;
      event.preventDefault();
      navigate(href);
    }}
  >
    {children}
  </a>
);
