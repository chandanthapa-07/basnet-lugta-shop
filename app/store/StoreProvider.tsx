"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock: number;
}

export interface StoredProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  badge?: string | null;
  description?: string | null;
  image: string;
  visible: boolean;
  featured: boolean;
}

type StoreState = {
  cart: CartItem[];
  wishlist: string[];
  searchQuery: string;
  activeCategory: string;
  isAuthModalOpen: boolean;
  isBagDrawerOpen: boolean;
  pendingAction: (() => void) | null;
};

type StoreAction =
  | { type: "CART_ADD"; payload: { product: StoredProduct; quantity?: number } }
  | { type: "CART_REMOVE"; payload: { id: string } }
  | { type: "CART_SET_QTY"; payload: { id: string; quantity: number } }
  | { type: "CART_CLEAR" }
  | { type: "WISHLIST_TOGGLE"; payload: { id: string } }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "OPEN_AUTH"; payload?: (() => void) | null }
  | { type: "CLOSE_AUTH" }
  | { type: "OPEN_BAG_DRAWER" }
  | { type: "CLOSE_BAG_DRAWER" };

const initialState: StoreState = {
  cart: [],
  wishlist: [],
  searchQuery: "",
  activeCategory: "All clothing",
  isAuthModalOpen: false,
  isBagDrawerOpen: false,
  pendingAction: null,
};

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case "CART_ADD": {
      const { product, quantity = 1 } = action.payload;
      const existing = state.cart.find((i) => i.id === product.id);
      let next: CartItem[];
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        next = state.cart.map((i) =>
          i.id === product.id ? { ...i, quantity: newQty } : i
        );
      } else {
        next = [...state.cart, { id: product.id, name: product.name, price: product.price, quantity: Math.min(quantity, product.stock), image: product.image, stock: product.stock }];
      }
      return { ...state, cart: next };
    }
    case "CART_REMOVE":
      return { ...state, cart: state.cart.filter((i) => i.id !== action.payload.id) };
    case "CART_SET_QTY": {
      const { id, quantity } = action.payload;
      const item = state.cart.find((i) => i.id === id);
      if (!item) return state;
      const clamped = Math.max(0, Math.min(quantity, item.stock));
      if (clamped === 0) return { ...state, cart: state.cart.filter((i) => i.id !== id) };
      return { ...state, cart: state.cart.map((i) => (i.id === id ? { ...i, quantity: clamped } : i)) };
    }
    case "CART_CLEAR":
      return { ...state, cart: [] };
    case "WISHLIST_TOGGLE": {
      const exists = state.wishlist.includes(action.payload.id);
      return {
        ...state,
        wishlist: exists ? state.wishlist.filter((id) => id !== action.payload.id) : [...state.wishlist, action.payload.id],
      };
    }
    case "SET_SEARCH":
      return { ...state, searchQuery: action.payload };
    case "SET_CATEGORY":
      return { ...state, activeCategory: action.payload };
    case "OPEN_AUTH":
      return { ...state, isAuthModalOpen: true, pendingAction: action.payload ?? null };
    case "CLOSE_AUTH":
      return { ...state, isAuthModalOpen: false, pendingAction: null };
    case "OPEN_BAG_DRAWER":
      return { ...state, isBagDrawerOpen: true };
    case "CLOSE_BAG_DRAWER":
      return { ...state, isBagDrawerOpen: false };
    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
} | null>(null);

const STORAGE_KEY = "basnet-lugta-shop-store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as any;
      if (Array.isArray(parsed.cart)) {
        (parsed.cart as CartItem[]).forEach((item) => {
          dispatch({
            type: "CART_ADD",
            payload: {
              product: {
                id: item.id,
                name: item.name,
                price: item.price,
                stock: item.stock || 99,
                image: item.image,
                category: "",
                visible: true,
                featured: false,
              },
              quantity: item.quantity,
            },
          });
        });
      }
      if (Array.isArray(parsed.wishlist)) {
        (parsed.wishlist as string[]).forEach((id) => {
          dispatch({ type: "WISHLIST_TOGGLE", payload: { id } });
        });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ cart: state.cart, wishlist: state.wishlist }));
    } catch {
      /* ignore */
    }
  }, [state.cart, state.wishlist]);

  const value = useMemo(() => ({ state, dispatch }), [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function formatNPR(amount: number): string {
  return `रु ${amount.toLocaleString("en-NP")}`;
}
