import {useState, useEffect, useRef} from 'react';
import {useLocation} from '@remix-run/react';
function PriceFilterInput({addFilter, removeFilter, isChecked, value}) {
  const minPrice = useRef(null);
  const maxPrice = useRef(null);
  const [currentMin, setCurrentMin] = useState(0);
  const [currentMax, setCurrentMax] = useState(1000);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const {price} = JSON.parse(value);

  // Calculate actual min/max prices from products
  useEffect(() => {
    setCurrentMin(price.min);
    setCurrentMax(price.max);
  }, [value]);
  const {pathname} = useLocation();
  useEffect(() => {
    maxPrice.current = price.max;
  }, [pathname]);

  // Check if current price filter is applied
  const getPriceFilterValue = () => {
    return JSON.stringify({
      price: {
        min: currentMin,
        max: currentMax,
      },
    });
  };

  const isActive = isChecked(getPriceFilterValue());

  // Apply price filter
  const applyPriceFilter = (e) => {
    if (
      (currentMin !== minPrice.current || currentMax !== maxPrice.current) &&
      !isActive
    ) {
      addFilter(getPriceFilterValue());
    } else {
      removeFilter(getPriceFilterValue());
    }
  };

  // Handle slider interaction
  const handleSliderChange = (e, type) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1,
    );
    const value = Math.round(
      minPrice.current + (maxPrice.current - minPrice.current) * percentage,
    );

    if (type === 'min') {
      setCurrentMin(Math.min(value, currentMax - 1));
    } else {
      setCurrentMax(Math.max(value, currentMin + 1));
    }
  };

  const handleMouseDown = (e, type) => {
    setIsDragging(type);
    handleSliderChange(e, type);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      handleSliderChange(e, isDragging);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const minPercentage =
    ((currentMin - minPrice.current) / (maxPrice.current - minPrice.current)) *
    100;
  const maxPercentage =
    ((currentMax - minPrice.current) / (maxPrice.current - minPrice.current)) *
    100;

  return (
    <div
      className="price-filter-container"
      style={{boxSizing: 'border-box', width: '100%'}}
    >
      <div className="price-filter-header" style={{marginBottom: '1rem'}}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#666',
          }}
        >
          <span>${currentMin}</span>
          <span>${currentMax}</span>
        </div>
      </div>

      <div
        className="price-slider-container"
        style={{position: 'relative', marginBottom: '1rem'}}
      >
        {/* Slider track */}
        <div
          ref={sliderRef}
          className="price-slider-track"
          style={{
            height: '4px',
            backgroundColor: '#e0e0e0',
            borderRadius: '2px',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          {/* Active range */}
          <div
            className="price-slider-range"
            style={{
              position: 'absolute',
              height: '100%',
              backgroundColor: '#000',
              borderRadius: '2px',
              left: `${minPercentage}%`,
              width: `${maxPercentage - minPercentage}%`,
            }}
          />

          {/* Min handle */}
          <div
            className="price-slider-handle"
            style={{
              position: 'absolute',
              width: '16px',
              height: '16px',
              backgroundColor: '#000',
              borderRadius: '50%',
              top: '-6px',
              left: `${minPercentage}%`,
              transform: 'translateX(-50%)',
              cursor: 'pointer',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            onMouseDown={(e) => {
              handleMouseDown(e, 'min');
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Max handle */}
          <div
            className="price-slider-handle"
            style={{
              position: 'absolute',
              width: '16px',
              height: '16px',
              backgroundColor: '#000',
              borderRadius: '50%',
              top: '-6px',
              left: `${maxPercentage}%`,
              transform: 'translateX(-50%)',
              cursor: 'pointer',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            onMouseDown={(e) => {
              handleMouseDown(e, 'max');
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      {/* Input fields */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div style={{flex: 1}}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              marginBottom: '0.25rem',
            }}
          >
            Min
          </label>
          <input
            type="number"
            value={currentMin}
            onChange={(e) => {
              setCurrentMin(
                Math.max(
                  minPrice.current,
                  Math.min(parseInt(e.target.value) || 0, currentMax - 1),
                ),
              );
            }}
            min={minPrice.current}
            max={currentMax - 1}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{flex: 1}}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              marginBottom: '0.25rem',
            }}
          >
            Max
          </label>
          <input
            type="number"
            value={currentMax}
            onChange={(e) => {
              setCurrentMax(
                Math.min(
                  maxPrice.current,
                  Math.max(parseInt(e.target.value) || 0, currentMin + 1),
                ),
              );
            }}
            min={currentMin + 1}
            max={maxPrice.current}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={applyPriceFilter}
        className="price-filter-apply"
        style={{
          width: '100%',
          padding: '0.5rem',
          backgroundColor: isActive ? '#000' : '#f0f0f0',
          color: isActive ? '#fff' : '#000',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        {isActive ? 'Clear Filter' : 'Apply Filter'}
      </button>
    </div>
  );
}

// Updated filter functions to handle price filters
function addPriceFilter(input, setSearchParams) {
  const filterData = JSON.parse(input);

  if (filterData.price) {
    // Handle price filter differently
    const priceFilter = {
      price: {
        min: filterData.price.min,
        max: filterData.price.max,
      },
    };

    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        // Remove existing price filters
        const existingFilters = newParams.getAll('filter');
        newParams.delete('filter');

        // Add back non-price filters
        existingFilters.forEach((filter) => {
          try {
            const parsed = JSON.parse(filter);
            if (!parsed.price) {
              newParams.append('filter', filter);
            }
          } catch {
            // If it's not JSON, it's a regular filter
            newParams.append('filter', filter);
          }
        });

        // Add new price filter
        newParams.append('filter', JSON.stringify(priceFilter));
        return newParams;
      },
      {preventScrollReset: true},
    );
  }
}

function removePriceFilter(input, setSearchParams) {
  const filterData = JSON.parse(input);

  if (filterData.price) {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        const existingFilters = newParams.getAll('filter');
        newParams.delete('filter');

        // Add back only non-price filters
        existingFilters.forEach((filter) => {
          try {
            const parsed = JSON.parse(filter);
            if (!parsed.price) {
              newParams.append('filter', filter);
            }
          } catch {
            // If it's not JSON, it's a regular filter
            newParams.append('filter', filter);
          }
        });

        return newParams;
      },
      {preventScrollReset: true},
    );
  }
}

export {PriceFilterInput, addPriceFilter, removePriceFilter};
