import { useState, useId, useRef, useEffect, useCallback } from 'react';
import './Tooltip.css';

export default function Tooltip({ children, content }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipId = useId();

  const computePosition = useCallback(() => {
    if (!wrapperRef.current || !tooltipRef.current) return;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let left = wrapperRect.left + (wrapperRect.width / 2);
    let top = wrapperRect.top - 8;

    const tooltipHalfWidth = tooltipRect.width / 2;
    if (left - tooltipHalfWidth < 10) {
      left = tooltipHalfWidth + 10;
    }
    if (left + tooltipHalfWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipHalfWidth - 10;
    }

    let showBelow = false;
    if (top - tooltipRect.height < 10) {
      top = wrapperRect.bottom + 8;
      showBelow = true;
      if (top + tooltipRect.height > window.innerHeight - 10) {
        top = window.innerHeight - tooltipRect.height - 10;
      }
    }

    setPosition({ top, left, showBelow });
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Use rAF to avoid synchronous setState in effect body
    const rafId = requestAnimationFrame(computePosition);
    const handleResize = () => requestAnimationFrame(computePosition);
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [visible, computePosition]);

  const handleShow = useCallback(() => setVisible(true), []);
  const handleHide = useCallback(() => setVisible(false), []);

  return (
    <div
      ref={wrapperRef}
      className="tooltip-wrapper"
      tabIndex={0}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      aria-describedby={visible ? tooltipId : undefined}
    >
      {children}
      <div
        ref={tooltipRef}
        id={tooltipId}
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
