// src/hooks/useContentEditable.js
import { useEffect, useRef } from 'react';

export default function useContentEditable(value, onChange) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (el.innerHTML !== value) {
            el.innerHTML = value;
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(el);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }, [value]);

    const bind = {
        ref,
        contentEditable: true,
        suppressContentEditableWarning: true,
        onInput: (e) => onChange(e.currentTarget.innerHTML),
    };

    return { ref, bind };
}
