"use client";

import { useState, useEffect } from "react";

type CurrencyInfo = {
  code: string;
  symbol: string;
  name: string;
  rate: number;
};

type Props = {
  priceKES: number;         // price in KES (base currency)
  className?: string;
  showSelector?: boolean;   // show currency dropdown
};

/**
 * Displays a price in the user's detected local currency.
 * Falls back to KES if detection fails.
 */
export default function CurrencyDisplay({ priceKES, className = "", showSelector = true }: Props) {
  const [currency, setCurrency] = useState<string>("KES");
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
  const [converted, setConverted] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Detect currency from browser language
    const lang = navigator.language || "en";
    let detected = "ETB";  // Default to Ethiopian Birr
    if (lang.includes("et") || lang.includes("ET")) detected = "ETB";
    else if (lang.includes("sw") || lang.includes("KE")) detected = "KES";
    else if (lang.includes("TZ")) detected = "TZS";
    else if (lang.includes("UG")) detected = "UGX";
    else if (lang.includes("NG")) detected = "NGN";
    else if (lang.includes("en-GB") || lang.includes("GB")) detected = "GBP";
    else if (lang.includes("de") || lang.includes("fr")) detected = "EUR";
    else if (lang.includes("en-US") || lang.includes("US")) detected = "USD";

    // Fetch conversion
    fetch(`/api/currency?amount=${priceKES}&currency=${detected}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.converted) {
          setConverted(data.converted.formatted);
          setCurrency(detected);
        }
        if (data.currencies) {
          setCurrencies(data.currencies);
        }
        setLoading(false);
      })
      .catch(() => {
        setConverted(`KSh ${priceKES.toLocaleString()}`);
        setLoading(false);
      });
  }, [priceKES]);

  const changeCurrency = (code: string) => {
    fetch(`/api/currency?amount=${priceKES}&currency=${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.converted) {
          setConverted(data.converted.formatted);
          setCurrency(code);
        }
      })
      .catch(() => {});
    setShowDropdown(false);
  };

  if (loading) {
    return <span className={className}>KSh {priceKES.toLocaleString()}</span>;
  }

  if (priceKES === 0) {
    return <span className={className}>Free</span>;
  }

  return (
    <span className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-semibold">{converted}</span>
      {showSelector && currencies.length > 0 && (
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs text-slate-400 hover:text-indigo-600 dark:text-slate-500"
          title="Change currency"
        >
          ({currency})
        </button>
      )}
      {showDropdown && (
        <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => changeCurrency(c.code)}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
                c.code === currency ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <span>{c.symbol} {c.code}</span>
              <span className="text-xs text-slate-400">{c.name}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
