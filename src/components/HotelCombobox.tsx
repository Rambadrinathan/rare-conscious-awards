"use client";

import { useMemo, useState } from "react";
import type { HotelSeed } from "@/lib/types";

type Props = {
  hotels: HotelSeed[];
  value: string;
  notListed: boolean;
  onChange: (name: string, notListed: boolean) => void;
  error?: string;
};

export function HotelCombobox({
  hotels,
  value,
  notListed,
  onChange,
  error,
}: Props) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hotels.slice(0, 12);
    return hotels
      .filter((h) => h.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [hotels, query]);

  return (
    <div className="relative">
      <label className="rare-label" htmlFor="hotel">
        Hotel name
      </label>
      <input
        id="hotel"
        className="rare-input"
        placeholder="Type your hotel name"
        value={query}
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange(e.target.value, notListed);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // delay so click on option registers
          setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && filtered.length > 0 && !notListed && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-rare-border bg-rare-white shadow-lg">
          {filtered.map((h) => {
            const countryLabel =
              typeof h.country === "string" ? h.country : null;
            return (
            <li key={h.name}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-4 py-3 text-left hover:bg-rare-cream"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery(h.name);
                  onChange(h.name, false);
                  setOpen(false);
                }}
              >
                <span className="font-semibold text-rare-charcoal">{h.name}</span>
                {(h.state || countryLabel) && (
                  <span className="text-xs text-rare-muted">
                    {[h.state, countryLabel].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            </li>
            );
          })}
        </ul>
      )}
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-rare-ink">
        <input
          type="checkbox"
          className="mt-1 accent-[var(--rare-green)]"
          checked={notListed}
          onChange={(e) => {
            onChange(query, e.target.checked);
          }}
        />
        <span>
          My hotel isn&apos;t listed yet — I&apos;ll type the full name
        </span>
      </label>
      {error && <p className="rare-error">{error}</p>}
    </div>
  );
}
