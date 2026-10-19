import React, { useEffect, useMemo, useRef, useState } from 'react';
import './SearchableSelect.css';

/**
 * Dropdown with a search box, for long lists (forms, packages, services, menu items, ...).
 * Light / dark theme aware; keyboard: ↑ ↓ to move, Enter to pick, Esc to close.
 *
 * options: [{ value, label, sub?, disabled? }] or groups [{ label, options: [...] }]
 * value / onChange(value): like a <select>; '' means nothing chosen.
 * emptyLabel: adds a first option with value '' (e.g. "None (Top Level)", "— No form —").
 * placeholder: text while nothing is chosen. loading / disabled / error: states.
 * size: 'sm' for compact forms. spaced (default true): keeps the old 0.5rem bottom margin.
 */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  emptyLabel,
  searchPlaceholder = 'Type to search...',
  className = '',
  error = false,
  disabled = false,
  loading = false,
  size,
  spaced = true,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [active, setActive] = useState(0);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) close();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const close = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  // Flat list of choosable options (groups flattened), with the optional empty choice first.
  const allOptions = useMemo(() => {
    const flat = [];
    if (emptyLabel !== undefined) flat.push({ value: '', label: emptyLabel, empty: true });
    options.forEach((opt) => {
      if (opt.options) opt.options.forEach((child) => flat.push({ ...child, group: opt.label }));
      else flat.push(opt);
    });
    return flat;
  }, [options, emptyLabel]);

  const selectedOption = allOptions.find((opt) => String(opt.value) === String(value ?? '')) || null;

  const term = searchTerm.trim().toLowerCase();
  const filtered = useMemo(() => (
    term
      ? allOptions.filter((opt) => !opt.empty && `${opt.label} ${opt.sub || ''} ${opt.group || ''}`.toLowerCase().includes(term))
      : allOptions
  ), [allOptions, term]);

  useEffect(() => {
    setActive(0);
  }, [term, isOpen]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    listRef.current.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, isOpen]);

  const pick = (opt) => {
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    close();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') { close(); return; }
    if (!isOpen && (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === ' ')) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); pick(filtered[active]); }
  };

  const showGroups = !term && options.some((opt) => opt.options);
  let lastGroup = null;

  return (
    <div className={`ss-wrap position-relative ${spaced ? 'mb-2' : ''} ${className}`} ref={wrapperRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        id={id}
        className={`ss-control form-select text-start ${size === 'sm' ? 'form-select-sm' : ''} ${error ? 'is-invalid' : ''}`}
        onClick={() => !disabled && !loading && setIsOpen((open) => !open)}
        disabled={disabled || loading}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`text-truncate ${selectedOption && !selectedOption.empty ? '' : 'text-body-secondary'}`}>
          {loading ? 'Loading...' : selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="ss-menu">
          <div className="ss-search">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              aria-label="Search options"
            />
            {searchTerm && (
              <button type="button" className="ss-clear" onClick={() => setSearchTerm('')} aria-label="Clear search">
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>

          <div className="ss-list" ref={listRef} role="listbox">
            {filtered.length === 0 && (
              <div className="ss-empty">
                <i className="bi bi-search"></i>
                <div>No matches for “{searchTerm}”</div>
              </div>
            )}
            {filtered.map((opt, index) => {
              const selected = String(opt.value) === String(value ?? '');
              const heading = showGroups && opt.group && opt.group !== lastGroup ? opt.group : null;
              if (showGroups) lastGroup = opt.group;
              return (
                <React.Fragment key={`${opt.value}-${index}`}>
                  {heading && <div className="ss-group">{heading}</div>}
                  <div
                    data-index={index}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={opt.disabled || undefined}
                    className={`ss-option ${selected ? 'is-selected' : ''} ${index === active ? 'is-active' : ''} ${opt.disabled ? 'is-disabled' : ''} ${opt.empty ? 'is-empty' : ''}`}
                    onMouseEnter={() => setActive(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(opt)}
                  >
                    <span className="ss-option-text">
                      <span className="ss-label">{opt.label}</span>
                      {opt.sub && <span className="ss-sub">{opt.sub}</span>}
                    </span>
                    {selected && <i className="bi bi-check2"></i>}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {term && filtered.length > 0 && <div className="ss-count">{filtered.length} of {allOptions.length - (emptyLabel !== undefined ? 1 : 0)}</div>}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
