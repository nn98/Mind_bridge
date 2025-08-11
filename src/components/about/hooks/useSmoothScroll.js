import { useEffect } from 'react';
export default function useSmoothScroll({ scrollTarget, setScrollTarget, refMap }) {
    useEffect(() => {
        if (!scrollTarget) return;
        const targetRef = refMap[scrollTarget];
        if (targetRef?.current) {
            targetRef.current.scrollIntoView({ behavior: 'smooth' });
            setScrollTarget?.(null);
        }
    }, [scrollTarget]);
}