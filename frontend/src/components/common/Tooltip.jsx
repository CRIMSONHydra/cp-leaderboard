import { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

export default function Tooltip({ children, content }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);

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
      if (top - tooltipRect.height < 10) {
        top = wrapperRect.bottom + 8;
        setPosition({ top, left, showBelow: true });
      } else {
        setPosition({ top, left, showBelow: false });
      }
    }
  }, [visible]);

  return (
    <div 
      ref={wrapperRef}
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div 
          ref={tooltipRef}
          className={`tooltip-content ${position.showBelow ? 'tooltip-below' : ''}`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

