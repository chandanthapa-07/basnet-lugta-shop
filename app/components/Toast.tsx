"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 10000;

type ToastAction = {
  type: "ADD_TOAST";
  toast: Toast;
} | {
  type: "UPDATE_TOAST";
  toast: Partial<Toast> & { id: string };
} | {
  type: "DISMISS_TOAST";
  toastId: string;
} | {
  type: "REMOVE_TOAST";
  toastId: string;
};

interface ToastState {
  toasts: Toast[];
}

type ToastProps = {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const toastTypeStyles: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: "bg-green/10", border: "border-green/20", icon: "text-green-600", text: "text-green-700" },
  error: { bg: "bg-red/10", border: "border-red/20", icon: "text-red-600", text: "text-red-700" },
  warning: { bg: "bg-amber/10", border: "border-amber/20", icon: "text-amber-600", text: "text-amber-700" },
  info: { bg: "bg-blue/10", border: "border-blue/20", icon: "text-blue-600", text: "text-blue-700" },
};

const toastTypeIcons: Record<ToastType, string> = {
  success: "✓",
  error: "⚠",
  warning: "⚡",
  info: "ℹ",
};

function reducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      };
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, duration: 0 } : t
        ),
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
    default:
      return state;
  }
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });
  const [openToasts, setOpenToasts] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearToastTimer = useCallback((toastId: string) => {
    if (timeoutsRef.current[toastId]) {
      clearTimeout(timeoutsRef.current[toastId]);
      delete timeoutsRef.current[toastId];
    }
  }, []);

  const setToastTimer = useCallback((toast: Toast) => {
    clearToastTimer(toast.id);
    timeoutsRef.current[toast.id] = setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", toastId: toast.id });
    }, toast.duration ?? TOAST_REMOVE_DELAY);
  }, [clearToastTimer]);

  useEffect(() => {
    state.toasts.forEach((toast) => {
      if (openToasts.has(toast.id)) return;
      setOpenToasts((prev: Set<string>) => new Set(prev).add(toast.id));
      setToastTimer(toast);
    });
  }, [state.toasts, openToasts, setToastTimer]);

  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const toast = useCallback(
    ({ title, description, type = "info", duration }: ToastProps) => {
      const id = generateId();
      dispatch({
        type: "ADD_TOAST",
        toast: { id, title, description, type, duration },
      });
      return id;
    },
    []
  );

  const dismiss = useCallback((toastId: string) => {
    clearToastTimer(toastId);
    dispatch({ type: "DISMISS_TOAST", toastId });
  }, [clearToastTimer]);

  const remove = useCallback((toastId: string) => {
    clearToastTimer(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, [clearToastTimer]);

  const context = useMemo(
    () => ({
      toasts: state.toasts,
      toast,
      dismiss,
      remove,
    }),
    [state.toasts, toast, dismiss, remove]
  );

  return (
    <ToastContext.Provider value={context}>
      {children}
      <div
        className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
        style={{ top: 80 }}
      >
        {state.toasts
          .filter((t) => openToasts.has(t.id))
          .map((t) => {
            const styles = toastTypeStyles[t.type];
            return (
              <ToastElement
                key={t.id}
                toast={t}
                styles={styles}
                onDismiss={() => dismiss(t.id)}
                onRemove={() => remove(t.id)}
              />
            );
          })}
      </div>
    </ToastContext.Provider>
  );
}

const ToastContext = createContext<{
  toasts: Toast[];
  toast: (props: ToastProps) => string;
  dismiss: (toastId: string) => void;
  remove: (toastId: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

interface ToastElementProps {
  toast: Toast;
  styles: { bg: string; border: string; icon: string; text: string };
  onDismiss: () => void;
  onRemove: () => void;
}

function ToastElement({ toast, styles, onDismiss, onRemove }: ToastElementProps) {
  return (
    <div
      className={`flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border shadow-lg pointer-events-auto animate-in slide-in-from-right duration-300 ${
        styles.bg
      } ${styles.border}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          styles.icon
        }`}
      >
        {toastTypeIcons[toast.type]}
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold ${styles.text}`}>{toast.title}</h4>
        {toast.description && (
          <p className="mt-1 text-sm opacity-80">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-50 hover:opacity-100 transition-colors"
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}