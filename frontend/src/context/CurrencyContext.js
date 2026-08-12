'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

// Tasas de cambio de referencia respecto al USD (Base: 1 USD)
const DEFAULT_RATES = {
  USD: { symbol: '$', rate: 1.0, name: 'US Dollar', flag: '🇺🇸' },
  EUR: { symbol: '€', rate: 0.92, name: 'Euro', flag: '🇪🇺' },
  PEN: { symbol: 'S/', rate: 3.75, name: 'Sol Peruano', flag: '🇵🇪' },
  GBP: { symbol: '£', rate: 0.79, name: 'British Pound', flag: '🇬🇧' },
  CAD: { symbol: 'CA$', rate: 1.36, name: 'Canadian Dollar', flag: '🇨🇦' },
  AUD: { symbol: 'A$', rate: 1.52, name: 'Australian Dollar', flag: '🇦🇺' },
  CLP: { symbol: 'CLP$', rate: 940.0, name: 'Peso Chileno', flag: '🇨🇱' },
  COP: { symbol: 'COP$', rate: 3950.0, name: 'Peso Colombiano', flag: '🇨🇴' },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('USD');
  const [rates, setRates] = useState(DEFAULT_RATES);

  const setCurrency = (code) => {
    if (rates[code]) {
      setCurrencyState(code);
      localStorage.setItem('user_currency', code);
    }
  };

  useEffect(() => {
    // 1. Verificar preferencia guardada en localStorage
    const savedCurrency = localStorage.getItem('user_currency');
    if (savedCurrency && DEFAULT_RATES[savedCurrency]) {
      setCurrencyState(savedCurrency);
      return;
    }

    // 2. Detección por ubicación (IP / Geolocalización)
    const detectLocationCurrency = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const detectedCurr = data.currency;
          if (detectedCurr && DEFAULT_RATES[detectedCurr]) {
            setCurrencyState(detectedCurr);
            return;
          }
        }
      } catch (e) {
        console.warn('Currency detection by location fallback to USD:', e);
      }
      // Predeterminado USD
      setCurrencyState('USD');
    };

    detectLocationCurrency();
  }, []);

  /**
   * Convierte y formatea un precio base expresado en USD a la divisa seleccionada
   */
  const formatPrice = (amountInUSD) => {
    const numericUSD = parseFloat(amountInUSD) || 0;
    const currentRateObj = rates[currency] || DEFAULT_RATES.USD;
    const converted = numericUSD * currentRateObj.rate;

    // Para divisas con valores altos (CLP, COP) no mostrar decimales
    const decimals = ['CLP', 'COP'].includes(currency) ? 0 : 2;

    const formattedValue = converted.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return `${currentRateObj.symbol} ${formattedValue} ${currency}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, availableCurrencies: rates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency debe usarse dentro de un CurrencyProvider');
  }
  return context;
}
