import { useState, useRef, useEffect } from 'react';
import './Spaces.css';

export default function InviteCodeDisplay({ code }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="invite-code-display">
      <code className="invite-code">{code}</code>
      <button onClick={handleCopy} className="btn-copy" type="button">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
