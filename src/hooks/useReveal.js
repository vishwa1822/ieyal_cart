import { useEffect, useRef } from "react";

/**
 * Adds the `iy-in` class once an element enters the viewport, powering the
 * .iy-reveal fade/slide defined in index.css. Keeps motion declarative in
 * markup (className="iy-reveal") instead of pulling in a motion library.
 */
export function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("iy-in");
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px", ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

export default useReveal;
