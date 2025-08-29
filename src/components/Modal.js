// src/components/common/Modal.jsx
import { useEffect } from 'react';
import '../css/header.css';

export default function Modal({ title, onClose, content = "" }) {
  // ESC로 닫기
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.currentTarget === e.target) onClose?.();
  };

  const isString = typeof content === 'string';
  const hasText = isString && content.trim().length > 0;

  const renderBody = () => {
    if (!isString) return content;
    if (!hasText) return <div className="modal-empty">문서 내용을 불러오는 중입니다…</div>;

    return content.split('\n').map((line, i) => {
      const t = line.trim();
      console.log(t);
      
      if (t.startsWith('###')) {
        return (
          <h3 key={i} style={{ marginTop: '2em', marginBottom: '1em' }}>
            {t.replace('###', '').replace('**', '')}
          </h3>
        );
      }
      if (t.startsWith('|')) {
        return (
          <p key={i} style={{ margin: '0.2em 0', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {line}
          </p>
        );
      }
      if (/^[1-9]\./.test(t)) {
        return <p key={i} style={{ textIndent: '-1em', paddingLeft: '1.5em' }}>{line}</p>;
      }
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className="modal-backdrop-1" onClick={handleBackdropClick}>
      {/* 내부 클릭이 배경으로 전파되지 않게 */}
      <div className="modal-content-1" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn-1" onClick={onClose} aria-label="닫기">&times;</button>
        {title && <h2 className="modal-title-1">{title}</h2>}
        <div className="terms-text-content">{renderBody()}</div>
      </div>
    </div>
  );
}
