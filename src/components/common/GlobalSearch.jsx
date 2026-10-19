import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { secondaryMenuData, railMenuData } from '../../config/menuConfig';

const generateSearchData = () => {
  const data = [];
  let id = 1;

  // Add primary rail menus
  railMenuData.forEach(item => {
    data.push({
      id: String(id++),
      title: item.label,
      type: 'Primary Menu',
      path: item.path,
      icon: item.icon
    });
  });

  // Add secondary menus
  Object.values(secondaryMenuData).forEach(groups => {
    groups.forEach(group => {
      group.items.forEach(item => {
        // Skip duplicate paths (some primary and secondary might have same path like /settings)
        if (!data.find(existing => existing.path === item.path)) {
          data.push({
            id: String(id++),
            title: item.label,
            type: group.group,
            path: item.path,
            icon: item.icon
          });
        }
      });
    });
  });

  return data;
};

const searchData = generateSearchData();

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredResults = query.trim() === '' ? [] : searchData.filter(item => 
    item.title.toLowerCase().includes(query.toLowerCase()) || 
    item.type.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8); // Max 8 results

  useEffect(() => {
    setActiveIndex(filteredResults.length > 0 ? 0 : -1);
  }, [query]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredResults[activeIndex]) {
        navigate(filteredResults[activeIndex].path);
        setIsOpen(false);
        setQuery('');
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="d-none d-md-block position-relative" ref={wrapperRef}>
      <div 
        className="d-flex align-items-center bg-body-tertiary rounded-pill px-3 py-2 border transition" 
        style={{ width: isOpen ? '320px' : '280px', borderColor: isOpen ? 'var(--bs-primary) !important' : 'transparent', boxShadow: isOpen ? '0 0 0 0.25rem rgba(99, 91, 255, 0.25)' : 'none' }}
        onClick={() => { setIsOpen(true); inputRef.current?.focus(); }}
      >
        <i className="bi bi-search text-muted me-2" style={{ fontSize: '0.9rem', color: isOpen ? 'var(--bs-primary) !important' : '' }}></i>
        <input 
          ref={inputRef}
          type="text" 
          className="form-control bg-transparent border-0 shadow-none p-0" 
          placeholder="Search pages, settings..." 
          style={{ fontSize: '0.9rem', outline: 'none' }} 
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <i 
            className="bi bi-x-circle-fill text-muted ms-2 cursor-pointer" 
            style={{ fontSize: '0.85rem' }}
            onClick={(e) => { e.stopPropagation(); setQuery(''); inputRef.current?.focus(); }}
          ></i>
        )}
      </div>

      {isOpen && query.trim() !== '' && (
        <div className="position-absolute w-100 mt-2 rounded-4 shadow border overflow-hidden" style={{ top: '100%', left: 0, zIndex: 1050, backgroundColor: 'var(--cms-card-bg)' }}>
          {filteredResults.length > 0 ? (
            <div className="list-group list-group-flush rounded-4 overflow-hidden">
              <div className="px-3 py-2 border-bottom text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', backgroundColor: 'var(--cms-table-header-bg)' }}>
                Search Results
              </div>
              {filteredResults.map((result, idx) => (
                <button
                  key={result.id}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-2 px-3 border-0 ${activeIndex === idx ? 'bg-primary-subtle' : ''}`}
                  onClick={() => {
                    navigate(result.path);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div className="d-flex align-items-center justify-content-center rounded bg-body-secondary text-muted" style={{ width: '32px', height: '32px' }}>
                    <i className={`bi ${result.icon}`}></i>
                  </div>
                  <div className="flex-grow-1 text-start overflow-hidden">
                    <div className="fw-medium text-truncate" style={{ fontSize: '0.85rem', color: activeIndex === idx ? 'var(--bs-primary)' : 'var(--cms-body-color)' }}>
                      {result.title}
                    </div>
                  </div>
                  <span className="badge bg-body-secondary text-muted rounded-pill" style={{ fontSize: '0.65rem' }}>
                    {result.type}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-search fs-3 opacity-50 mb-2 d-block"></i>
              <span style={{ fontSize: '0.85rem' }}>No results found for "{query}"</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
