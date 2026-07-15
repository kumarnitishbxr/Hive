import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverProps {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseIntersectionObserverProps = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const currentElement = elementRef.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && triggerOnce) {
          observer.unobserve(currentElement);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(currentElement);

    return () => {
      if (currentElement && !triggerOnce) {
        observer.unobserve(currentElement);
      }
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [elementRef, isIntersecting] as const;
};

export default useIntersectionObserver;
