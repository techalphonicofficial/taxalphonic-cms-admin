import React, { useRef } from 'react';

const GridFilterDrawer = ({ onApplyFilters, onResetFilters, children }) => {
  const closeBtnRef = useRef(null);

  const handleApply = () => {
    onApplyFilters();
    if (closeBtnRef.current) closeBtnRef.current.click();
  };

  const handleReset = () => {
    onResetFilters();
    if (closeBtnRef.current) closeBtnRef.current.click();
  };

  return (
    <div className="offcanvas offcanvas-end shadow-lg" tabIndex="-1" id="filterDrawer" aria-labelledby="filterDrawerLabel" style={{ width: '400px' }}>
      <div className="offcanvas-header border-bottom">
        <h5 className="offcanvas-title fw-bold d-flex align-items-center gap-2" id="filterDrawerLabel">
          <i className="bi bi-funnel text-primary"></i> Advanced Filters
        </h5>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" ref={closeBtnRef}></button>
      </div>
      
      <div className="offcanvas-body">
        <form onSubmit={(e) => e.preventDefault()}>
          {children}

          <div className="d-grid mt-4 gap-2">
            <button type="button" className="premium-btn-primary w-100 justify-content-center" onClick={handleApply}>
              Apply Filters
            </button>
            <button type="button" className="btn btn-light border w-100" onClick={handleReset}>
              Reset Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GridFilterDrawer;
