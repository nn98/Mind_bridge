// FloatingSidebar.jsx
import { useEffect, useState } from "react";

const FloatingSidebar = ({ scrollTargetSelector, threshold = 120 }) => {
  const [visible, setVisible] = useState(false);

  // 실제 스크롤 대상 가져오기
  const getTarget = () => {
    if (scrollTargetSelector) {
      const el = document.querySelector(scrollTargetSelector);
      if (el) return el;
    }
    return window;
  };

  const getScrollTop = (t) => {
    if (t === window) {
      // 브라우저별 호환
      return (
        window.scrollY ??
        document.documentElement.scrollTop ??
        document.body.scrollTop ??
        0
      );
    }
    return t.scrollTop ?? 0;
  };

  useEffect(() => {
    const target = getTarget();
    if (!target) return;

    const onScroll = () => {
      const top = getScrollTop(target);
      setVisible(top > threshold);
    };

    // 초기 상태 계산 + 리스너 등록
    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", onScroll);
    };
    // selector가 바뀌면 다시 바인딩
  }, [scrollTargetSelector, threshold]);

  const handleScrollToTop = () => {
    const target = getTarget();
    const opts = { top: 0, behavior: "smooth" };

    if (target === window) {
      window.scrollTo(opts);
      // 사파리/레거시 대비
      document.documentElement?.scrollTo?.(opts);
      document.body?.scrollTo?.(opts);
    } else {
      target.scrollTo(opts);
    }
  };

  if (!visible) return null;

  return (
    <div className="floating-sidebar">
      <button
        className="floating-button2"
        onClick={handleScrollToTop}
        aria-label="맨 위로"
        type="button"
      >
        <img src="/img/up.png" alt="맨 위" style={{ width: 60, height: 60 }} />
      </button>
    </div>
  );
};

export default FloatingSidebar;
