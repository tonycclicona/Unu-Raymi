'use client';

import { createContext, useContext } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  /**
   * Formatea un precio numérico expresado en USD
   */
  const formatPrice = (amountInUSD) => {
    const numericUSD = parseFloat(amountInUSD) || 0;
    const formattedValue = numericUSD.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$ ${formattedValue} USD`;
  };

  return (
    <CurrencyContext.Provider value={{ currency: 'USD', formatPrice, availableCurrencies: { USD: { symbol: '$', name: 'US Dollar' } } }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    return {
      currency: 'USD',
      formatPrice: (amount) => `$ ${parseFloat(amount || 0).toFixed(2)} USD`
    };
  }
  return context;
}

