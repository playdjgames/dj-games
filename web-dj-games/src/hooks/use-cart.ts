import { useCallback, useEffect, useState } from "react";

import type { CartLine, StoreProduct } from "@/data/store";

const STORAGE_KEY = "dj-games-cart";

/** A line is identified by product + the exact variant combination chosen. */
const lineKey = (productId: string, selections: string[]): string =>
  `${productId}::${selections.join("|")}`;

const readStored = (): CartLine[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (line): line is CartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as CartLine).productId === "string" &&
        typeof (line as CartLine).quantity === "number",
    );
  } catch (error: unknown) {
    console.warn("cart restore failed", error);
    return [];
  }
};

export interface Cart {
  lines: CartLine[];
  add: (product: StoreProduct, selections: string[], quantity: number) => void;
  setQuantity: (productId: string, selections: string[], quantity: number) => void;
  remove: (productId: string, selections: string[]) => void;
  clear: () => void;
}

/**
 * Store cart, persisted so a refresh (or a bounce to the shop host and back)
 * never loses what someone picked. Checkout itself happens on the shop host.
 */
export const useCart = (): Cart => {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(readStored());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch (error: unknown) {
      console.warn("cart save failed", error);
    }
  }, [lines]);

  const add = useCallback((product: StoreProduct, selections: string[], quantity: number): void => {
    setLines((current) => {
      const key = lineKey(product.id, selections);
      const existing = current.find((line) => lineKey(line.productId, line.selections) === key);

      if (existing) {
        return current.map((line) =>
          lineKey(line.productId, line.selections) === key
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          image: product.images[0],
          price: product.price,
          quantity,
          selections,
          url: product.url,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, selections: string[], quantity: number): void => {
    const key = lineKey(productId, selections);
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => lineKey(line.productId, line.selections) !== key)
        : current.map((line) =>
            lineKey(line.productId, line.selections) === key ? { ...line, quantity } : line,
          ),
    );
  }, []);

  const remove = useCallback((productId: string, selections: string[]): void => {
    const key = lineKey(productId, selections);
    setLines((current) => current.filter((line) => lineKey(line.productId, line.selections) !== key));
  }, []);

  const clear = useCallback((): void => setLines([]), []);

  return { lines, add, setQuantity, remove, clear };
};
