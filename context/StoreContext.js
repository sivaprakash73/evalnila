import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const StoreContext = createContext(null);

const STORAGE_KEY = 'evalnila_store_state';

export function StoreProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw);
        setCartItems(parsed.cartItems || []);
        setWishlistItems(parsed.wishlistItems || []);
        setLastOrderNumber(parsed.lastOrderNumber || '');
      }
    } catch {
      // Ignore malformed local storage and start fresh.
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        cartItems,
        wishlistItems,
        lastOrderNumber
      })
    );
  }, [cartItems, wishlistItems, lastOrderNumber, isReady]);

  function addToCart(product, quantity = 1) {
    setCartItems((current) => {
      const productImageUrls = Array.isArray(product.imageUrls)
        ? product.imageUrls.filter(Boolean)
        : product.imageUrl
          ? [product.imageUrl]
          : [];
      const cartProduct = {
        ...product,
        imageUrl: productImageUrls[0] || product.imageUrl || '',
        imageUrls: productImageUrls
      };
      const productKey = getCartItemKey(product);
      const existing = current.find((item) => matchesItemKey(item, productKey, getCartItemKey));

      if (existing) {
        return current.map((item) =>
          matchesItemKey(item, productKey, getCartItemKey)
            ? { ...item, ...cartProduct, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...current, { ...cartProduct, cartKey: productKey, quantity }];
    });
  }

  function updateCartQuantity(productKey, quantity) {
    if (quantity <= 0) {
      removeFromCart(productKey);
      return;
    }

    setCartItems((current) =>
      current.map((item) =>
        matchesItemKey(item, productKey, getCartItemKey) ? { ...item, quantity } : item
      )
    );
  }

  function updateCartItemOptions(productKey, options = {}) {
    setCartItems((current) => {
      const target = current.find((item) => matchesItemKey(item, productKey, getCartItemKey));

      if (!target) {
        return current;
      }

      const updated = {
        ...target,
        selectedSize: options.selectedSize || null,
        selectedAddons: normalizeSelectedAddons(options.selectedAddons ?? target.selectedAddons),
        itemNotes: normalizeItemNotes(options.itemNotes || target.itemNotes) || null
      };
      const nextKey = getCartItemKey(updated);
      const items = [];
      let merged = false;

      current.forEach((item) => {
        if (matchesItemKey(item, productKey, getCartItemKey)) {
          return;
        }

        if (getCartItemKey(item) === nextKey) {
          items.push({
            ...item,
            ...updated,
            cartKey: nextKey,
            quantity: item.quantity + target.quantity
          });
          merged = true;
          return;
        }

        items.push(item);
      });

      if (!merged) {
        items.push({ ...updated, cartKey: nextKey });
      }

      return items;
    });
  }

  function removeFromCart(productKey) {
    setCartItems((current) => current.filter((item) => !matchesItemKey(item, productKey, getCartItemKey)));
  }

  function addToWishlist(product) {
    setWishlistItems((current) => {
      const wishlistKey = getWishlistItemKey(product);

      if (current.some((item) => matchesItemKey(item, wishlistKey, getWishlistItemKey))) {
        return current;
      }

      return [...current, { ...product, wishlistKey }];
    });
  }

  function updateWishlistItemOptions(productKey, options = {}) {
    setWishlistItems((current) => {
      const target = current.find((item) => matchesItemKey(item, productKey, getWishlistItemKey));

      if (!target) {
        return current;
      }

      const updated = {
        ...target,
        selectedSize: options.selectedSize || null,
        selectedAddons: normalizeSelectedAddons(options.selectedAddons ?? target.selectedAddons),
        itemNotes: normalizeItemNotes(options.itemNotes || target.itemNotes) || null
      };
      const nextKey = getWishlistItemKey(updated);
      const hasDuplicate = current.some(
        (item) =>
          !matchesItemKey(item, productKey, getWishlistItemKey) &&
          getWishlistItemKey(item) === nextKey
      );

      if (hasDuplicate) {
        return current.filter((item) => !matchesItemKey(item, productKey, getWishlistItemKey));
      }

      return current.map((item) =>
        matchesItemKey(item, productKey, getWishlistItemKey)
          ? { ...updated, wishlistKey: nextKey }
          : item
      );
    });
  }

  function removeFromWishlist(productKey) {
    setWishlistItems((current) => current.filter((item) => !matchesItemKey(item, productKey, getWishlistItemKey)));
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0),
    [cartItems]
  );

  const value = {
    cartItems,
    wishlistItems,
    isReady,
    cartCount,
    cartSubtotal,
    addToCart,
    updateCartQuantity,
    updateCartItemOptions,
    removeFromCart,
    addToWishlist,
    updateWishlistItemOptions,
    removeFromWishlist,
    clearCart,
    lastOrderNumber,
    setLastOrderNumber
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error('useStore must be used inside StoreProvider');
  }

  return context;
}

function getCartItemKey(item) {
  return item.cartKey || `${item.id}:${item.selectedSize || ''}:${getSelectedAddonKey(item)}:${normalizeItemNotes(item.itemNotes)}`;
}

function getWishlistItemKey(item) {
  return item.wishlistKey || `${item.id}:${item.selectedSize || ''}:${getSelectedAddonKey(item)}:${normalizeItemNotes(item.itemNotes)}`;
}

function matchesItemKey(item, productKey, getKey) {
  const legacyKey = `${item.id}:${item.selectedSize || ''}`;

  return (
    getKey(item) === productKey ||
    legacyKey === productKey ||
    `${legacyKey}:` === productKey ||
    String(item.id) === String(productKey)
  );
}

function normalizeItemNotes(value) {
  return String(value || '').trim();
}

function normalizeSelectedAddons(addons = []) {
  return Array.isArray(addons)
    ? addons
        .map((addon) => ({
          id: Number(addon.id),
          name: addon.name,
          price: Number(addon.price || 0)
        }))
        .filter((addon) => addon.id && addon.name)
    : [];
}

function getSelectedAddonKey(item) {
  return normalizeSelectedAddons(item.selectedAddons)
    .map((addon) => addon.id)
    .sort((left, right) => left - right)
    .join(',');
}

function getItemUnitPrice(item) {
  return Number(item.price || 0) + normalizeSelectedAddons(item.selectedAddons).reduce((sum, addon) => sum + Number(addon.price || 0), 0);
}
