import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import LanguageToggle from './LanguageToggle';
import * as ops from './operations';
import {
  authContentByLocale,
  getBrandContent,
  isAuthRoute,
  routeOrder,
  type AuthLocale,
  type AuthVariant,
  type Route,
  type WorkspaceRoute,
} from './content';

const validRoutes = new Set<Route>(routeOrder);
const routeIndex = Object.fromEntries(routeOrder.map((route, index) => [route, index])) as Record<Route, number>;
const transitionDurationMs = 220;
const authLocaleStorageKey = 'northline-auth-locale';
const sessionUserStorageKey = 'northline-session-user-id';
const initialWorkspaceStore = ops.createInitialWorkspaceStore();
const initialOperationalSelections = ops.createInitialSelections(initialWorkspaceStore);

function readRouteFromHash(): Route {
  if (typeof window === 'undefined') {
    return 'login';
  }

  const rawValue = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  return validRoutes.has(rawValue as Route) ? (rawValue as Route) : 'login';
}

function writeRouteToHash(route: Route) {
  if (typeof window !== 'undefined') {
    window.location.hash = `#/${route}`;
  }
}

function readStoredAuthLocale(): AuthLocale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return window.localStorage.getItem(authLocaleStorageKey) === 'zh' ? 'zh' : 'en';
}

function readStoredSessionUserId() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(sessionUserStorageKey) ?? '';
}

function resolveRouteForSession(route: Route, currentUser: ops.UserSession | null): Route {
  if (!currentUser) {
    return isAuthRoute(route) ? route : 'login';
  }

  if (isAuthRoute(route)) {
    return ops.getDefaultWorkspaceRoute(currentUser);
  }

  return ops.canAccessWorkspaceRoute(currentUser, route) ? route : ops.getDefaultWorkspaceRoute(currentUser);
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);

    return () => {
      mediaQuery.removeEventListener('change', updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

function App() {
  const initialRoute = readRouteFromHash();
  const [displayRoute, setDisplayRoute] = useState<Route>(initialRoute);
  const [authLocale, setAuthLocale] = useState<AuthLocale>(() => readStoredAuthLocale());
  const [workspaceStore, setWorkspaceStore] = useState<ops.WorkspaceStore>(() => initialWorkspaceStore);
  const [operationalSelections, setOperationalSelections] = useState<ops.OperationalSelections>(() => initialOperationalSelections);
  const [sessionUserId, setSessionUserId] = useState(() => readStoredSessionUserId());
  const [transitionState, setTransitionState] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [transitionDirection, setTransitionDirection] = useState<'forward' | 'backward'>('forward');
  const prefersReducedMotion = usePrefersReducedMotion();
  const displayRouteRef = useRef<Route>(initialRoute);
  const transitionTimers = useRef<number[]>([]);
  const currentUserRecord = workspaceStore.users.find((user) => user.id === sessionUserId) ?? null;
  const currentUser = currentUserRecord ? ops.buildUserSession(currentUserRecord) : null;

  useEffect(() => {
    const clearTimers = () => {
      transitionTimers.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      transitionTimers.current = [];
    };

    return () => {
      clearTimers();
    };
  }, []);

  const transitionToRoute = useCallback(
    (nextRoute: Route) => {
      transitionTimers.current.forEach((timerId) => {
        window.clearTimeout(timerId);
      });
      transitionTimers.current = [];

      const currentRoute = displayRouteRef.current;

      if (nextRoute === currentRoute) {
        setTransitionState('idle');
        return;
      }

      setTransitionDirection(routeIndex[nextRoute] >= routeIndex[currentRoute] ? 'forward' : 'backward');

      if (prefersReducedMotion) {
        displayRouteRef.current = nextRoute;
        startTransition(() => {
          setDisplayRoute(nextRoute);
          setTransitionState('idle');
        });
        return;
      }

      startTransition(() => {
        setTransitionState('exiting');
      });

      const exitTimer = window.setTimeout(() => {
        displayRouteRef.current = nextRoute;
        startTransition(() => {
          setDisplayRoute(nextRoute);
          setTransitionState('entering');
        });

        const enterTimer = window.setTimeout(() => {
          startTransition(() => {
            setTransitionState('idle');
          });
        }, 24);

        transitionTimers.current.push(enterTimer);
      }, transitionDurationMs);

      transitionTimers.current.push(exitTimer);
    },
    [prefersReducedMotion],
  );

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = readRouteFromHash();
      const resolvedRoute = resolveRouteForSession(nextRoute, currentUser);

      if (resolvedRoute !== nextRoute) {
        writeRouteToHash(resolvedRoute);
        return;
      }

      transitionToRoute(resolvedRoute);
    };

    if (!window.location.hash) {
      writeRouteToHash(resolveRouteForSession('login', currentUser));
    }

    syncRoute();
    window.addEventListener('hashchange', syncRoute);

    return () => {
      window.removeEventListener('hashchange', syncRoute);
    };
  }, [currentUser, transitionToRoute]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(authLocaleStorageKey, authLocale);
    }
  }, [authLocale]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (sessionUserId) {
      window.localStorage.setItem(sessionUserStorageKey, sessionUserId);
      return;
    }

    window.localStorage.removeItem(sessionUserStorageKey);
  }, [sessionUserId]);

  const navigate = (nextRoute: Route) => {
    const resolvedRoute = resolveRouteForSession(nextRoute, currentUser);

    if (resolvedRoute === displayRouteRef.current && window.location.hash === `#/${resolvedRoute}`) {
      return;
    }

    if (window.location.hash === `#/${resolvedRoute}`) {
      transitionToRoute(resolvedRoute);
      return;
    }

    writeRouteToHash(resolvedRoute);
  };

  function handleAuthenticate(userId: string) {
    setSessionUserId(userId);
  }

  function handleSignOut() {
    setSessionUserId('');
    writeRouteToHash('login');
  }

  const authVariant: AuthVariant = isAuthRoute(displayRoute) ? displayRoute : 'login';

  return (
    <div className={`app-shell app-shell--${displayRoute}`}>
      <div className={`screen-frame screen-frame--${transitionState} screen-frame--${transitionDirection}`}>
        {!currentUser || isAuthRoute(displayRoute) ? (
          <AuthPage
            variant={authVariant}
            locale={authLocale}
            onLocaleChange={setAuthLocale}
            onNavigate={navigate}
            store={workspaceStore}
            setStore={setWorkspaceStore}
            onAuthenticate={handleAuthenticate}
          />
        ) : (
          <Dashboard
            route={displayRoute as WorkspaceRoute}
            locale={authLocale}
            onLocaleChange={setAuthLocale}
            onNavigate={navigate}
            onSignOut={handleSignOut}
            store={workspaceStore}
            setStore={setWorkspaceStore}
            selections={operationalSelections}
            setSelections={setOperationalSelections}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
}

type AuthPageProps = {
  variant: AuthVariant;
  locale: AuthLocale;
  onLocaleChange: (locale: AuthLocale) => void;
  onNavigate: (route: Route) => void;
  store: ops.WorkspaceStore;
  setStore: Dispatch<SetStateAction<ops.WorkspaceStore>>;
  onAuthenticate: (userId: string) => void;
};

function AuthPage({ variant, locale, onLocaleChange, onNavigate, store, setStore, onAuthenticate }: AuthPageProps) {
  const content = authContentByLocale[locale][variant];
  const brand = getBrandContent(locale);
  const isLogin = variant === 'login';
  const panelTitle = locale === 'zh' ? content.panelTitle : content.panelTitle.toUpperCase();
  const primaryAction = locale === 'zh' ? (isLogin ? '登录' : '注册') : isLogin ? 'LOGIN' : 'REGISTER';
  const forgotPasswordLabel = locale === 'zh' ? '忘记密码？' : 'Forgot Password?';
  const footerLabel = `${content.footerLabel} `;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();

    if (!email) {
      return;
    }

    const existingUser = ops.findUserByEmail(store, email);

    if (existingUser) {
      setStore((current) => ops.recordUserLogin(current, existingUser.id));
      onAuthenticate(existingUser.id);
      return;
    }

    const result = ops.registerWorkspaceUser(store, {
      email,
      name,
    });

    setStore(result.store);
    onAuthenticate(result.user.id);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-6 md:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1280px] items-center justify-center">
        <div className="grid w-full max-w-[1120px] overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_26px_80px_rgba(15,23,42,0.12)] md:grid-cols-[0.39fr_0.61fr]">
          <div className="relative hidden min-h-[680px] overflow-hidden bg-[linear-gradient(160deg,#4f8dfc_0%,#2563eb_48%,#1d4ed8_100%)] md:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.26),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.16),transparent_38%)]" />
            <div className="absolute -left-12 top-6 h-32 w-[142%] -rotate-45 rounded-[34px] bg-white/16" />
            <div className="absolute -left-10 top-[10.5rem] h-24 w-[140%] -rotate-45 rounded-[34px] bg-white/10" />
            <div className="absolute -left-16 bottom-[5.5rem] h-28 w-[150%] -rotate-45 rounded-[34px] bg-slate-950/10" />
            <div className="absolute right-0 top-0 h-44 w-44 rounded-bl-[42px] bg-white/94" />
            <div className="absolute left-8 top-[18%] h-52 w-[84%] -rotate-45 rounded-[42px] border border-white/15 bg-white/10 backdrop-blur-[2px]" />
            <div className="absolute left-12 top-[48%] h-[6.5rem] w-[60%] -rotate-45 rounded-[34px] border border-white/16 bg-white/14" />
            <div className="absolute right-[-16%] bottom-[7%] h-72 w-72 rotate-45 rounded-[46px] bg-black/8" />
            <div className="absolute bottom-[-5%] left-[-10%] h-60 w-60 rounded-[40px] bg-white/12" />
            <div className="absolute inset-y-0 right-0 w-px bg-white/20" />
          </div>

          <div className="flex flex-col bg-white px-7 py-7 md:px-12 md:py-9">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-base font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.25)]">
                  {brand.mark}
                </div>
                <div>
                  <p className="m-0 text-[1.9rem] font-semibold tracking-[-0.04em] text-slate-900">{brand.name}</p>
                </div>
              </div>

              <LanguageToggle locale={locale} onChange={onLocaleChange} compact className="auth-language-toggle" />
            </div>

            <nav
              className="mt-7 inline-grid w-full max-w-[264px] grid-cols-2 rounded-[22px] border border-slate-200 bg-slate-50 p-1"
              aria-label={locale === 'zh' ? '认证视图' : 'Authentication views'}
            >
              <button
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${variant === 'login' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                type="button"
                aria-current={variant === 'login' ? 'page' : undefined}
                onClick={() => onNavigate('login')}
              >
                {locale === 'zh' ? '登录' : 'Login'}
              </button>
              <button
                className={`rounded-[18px] px-4 py-3 text-sm font-semibold transition ${variant === 'register' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                type="button"
                aria-current={variant === 'register' ? 'page' : undefined}
                onClick={() => onNavigate('register')}
              >
                {locale === 'zh' ? '注册' : 'Register'}
              </button>
            </nav>

            <div className="mt-10 grid justify-items-center gap-4 text-center">
              <div className="grid h-[84px] w-[84px] place-items-center rounded-full bg-[linear-gradient(180deg,#60a5fa,#2563eb)] text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)]" aria-hidden="true">
                <UserGlyph />
              </div>
              <h1 className="m-0 text-[2.05rem] font-bold tracking-[0.18em] text-slate-900">{panelTitle}</h1>
            </div>

            <form className="mt-12 flex flex-1 flex-col" onSubmit={handleSubmit}>
              <div className="space-y-7">
                {content.fields.map((field) => (
                  <label className="group block" key={field.label}>
                    <span className="sr-only">{field.label}</span>
                    <div className="flex items-center gap-3 border-b border-slate-300 pb-3 text-slate-400 transition group-focus-within:border-blue-600 group-focus-within:text-blue-600">
                      {field.type === 'password' ? <LockGlyph /> : <MailGlyph />}
                      <input
                        name={field.autoComplete === 'name' ? 'name' : field.type === 'password' ? 'password' : 'email'}
                        className="w-full border-0 bg-transparent px-0 py-0 text-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        required
                        type={field.type}
                      />
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-7 flex items-center justify-between gap-4">
                {isLogin ? (
                  <button className="text-sm font-medium text-slate-500 transition hover:text-blue-700" type="button">
                    {forgotPasswordLabel}
                  </button>
                ) : (
                  <span />
                )}

                <button
                  className="inline-flex min-w-[168px] items-center justify-center rounded-full bg-blue-600 px-7 py-3 text-sm font-semibold tracking-[0.24em] text-white shadow-[0_14px_30px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 hover:shadow-[0_18px_34px_rgba(37,99,235,0.28)]"
                  type="submit"
                >
                  {primaryAction}
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-1 text-sm text-slate-500">
                <span>{footerLabel}</span>
                <button className="font-semibold text-blue-700 transition hover:text-blue-800" type="button" onClick={() => onNavigate(content.footerRoute)}>
                  {content.footerAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function UserGlyph() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 7a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5h16v9H4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 10V8a4.5 4.5 0 1 1 9 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default App;
