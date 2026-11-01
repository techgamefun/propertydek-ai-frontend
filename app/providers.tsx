"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ToastPayload } from "./lib/toast";

type Theme = "light" | "dark";
type Toast = ToastPayload & { id: number };

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("propertydek:theme-change", onChange);
  return () => window.removeEventListener("propertydek:theme-change", onChange);
}

function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextToastId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: ToastPayload) => {
    const id = ++nextToastId.current;
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    timers.current.set(
      id,
      setTimeout(() => {
        dismissToast(id);
      }, toast.type === "error" ? 7000 : 5000),
    );
  }, [dismissToast]);

  useEffect(() => {
    const activeTimers = timers.current;
    const handleToast = (event: Event) => {
      addToast((event as CustomEvent<ToastPayload>).detail);
    };
    window.addEventListener("propertydek:toast", handleToast);
    return () => {
      window.removeEventListener("propertydek:toast", handleToast);
      activeTimers.forEach(clearTimeout);
      activeTimers.clear();
    };
  }, [addToast]);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("propertydek:theme-change"));
    try {
      window.localStorage.setItem("propertydek-theme", next);
    } catch {
      // The selected theme remains active for this page even if storage is unavailable.
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        {children}
        <div
          aria-live="polite"
          aria-relevant="additions"
          className="toast-viewport"
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((toast) => (
            <div
              className={`toast toast-${toast.type}`}
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
            >
              <span aria-hidden="true" className="toast-icon">
                {toast.type === "success"
                  ? "✓"
                  : toast.type === "error"
                    ? "!"
                    : toast.type === "warning"
                      ? "⚠"
                      : "i"}
              </span>
              <p>{toast.message}</p>
              <button
                aria-label="Dismiss notification"
                className="toast-dismiss"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within Providers.");
  }
  return context;
}
