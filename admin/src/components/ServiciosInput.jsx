'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function ServiciosInput({ label, items, onChange, placeholder = 'Añadir ítem...' }) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const value = inputValue.trim();
    if (value && !items.includes(value)) {
      onChange([...items, value]);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[#4a5759]">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-[#121224] border border-[#b0c4b1] rounded-xl px-4 py-2.5 text-[#4a5759] placeholder-gray-500 focus:outline-none focus:border-[#4a5759] focus:ring-1 focus:ring-[#4a5759] transition-all text-sm"
        />
        <button
          type="button"
          onClick={addTag}
          className="bg-[#4a5759]/10 text-[#4a5759] hover:bg-[#4a5759] hover:text-[#4a5759] border border-[#4a5759]/20 p-2.5 rounded-xl transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 pt-1.5">
        {items.length === 0 ? (
          <span className="text-xs text-[#6c7a7c]/80 italic">No hay ítems registrados.</span>
        ) : (
          items.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 bg-[#4a5759]/10 text-[#4a5759] border border-[#4a5759]/30 px-3 py-1.5 rounded-full text-xs font-medium"
            >
              {item}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="text-[#4a5759] hover:text-[#4a5759] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
