import { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

// Module-level counter for generating stable, unique tooltip IDs
let tooltipIdCounter = 0;

export default function Tooltip({ children, content }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);
  // Generate a stable ID for the tooltip that persists across renders
  const tooltipIdRef = useRef(null);
  if (tooltipIdRef.current === null) {
    tooltipIdRef.current = `tooltip-${tooltipIdCounter++}`;
  }

  useEffect(() => {
    if (visible && wrapperRef.current && tooltipRef.current) {
      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      // Calculate position to center above the icon
      let left = wrapperRect.left + (wrapperRect.width / 2);
      let top = wrapperRect.top - 8; // 8px gap above the icon
      
      // Adjust if tooltip would overflow left edge
      const tooltipHalfWidth = tooltipRect.width / 2;
      if (left - tooltipHalfWidth < 10) {
        left = tooltipHalfWidth + 10;
      }
      
      // Adjust if tooltip would overflow right edge
      if (left + tooltipHalfWidth > window.innerWidth - 10) {
        left = window.innerWidth - tooltipHalfWidth - 10;
      }
      
      // If tooltip would overflow top, show it below instead
      let showBelow = false;
      if (top - tooltipRect.height < 10) {
        top = wrapperRect.bottom + 8;
        showBelow = true;

        // Check if tooltip overflows bottom edge when shown below
        if (top + tooltipRect.height > window.innerHeight - 10) {
          top = window.innerHeight - tooltipRect.height - 10;
        }
      }

      setPosition({ top, left, showBelow });
    }
  }, [visible]);

  const handleShow = () => setVisible(true);
  const handleHide = () => setVisible(false);

  return (
    <div 
      ref={wrapperRef}
      className="tooltip-wrapper"
      tabIndex={0}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      aria-describedby={visible ? tooltipIdRef.current : undefined}
    >
      {children}
      <div 
        ref={tooltipRef}
        id={tooltipIdRef.current}
        role="tooltip"
        aria-hidden={!visible}
        className={`tooltip-content ${position.showBelow ? 'tooltip-below' : ''}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          display: visible ? 'block' : 'none'
        }}
      >
        {content}
      </div>
    </div>
  );
}

