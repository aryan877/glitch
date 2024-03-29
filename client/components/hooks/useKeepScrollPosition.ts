import { RefObject, useLayoutEffect, useMemo, useRef } from 'react';

const useKeepScrollPosition = (deps: any[] = [], sending: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousScrollPosition = useRef<number>(0);

  useMemo(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      previousScrollPosition.current =
        container.scrollHeight - container.scrollTop;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      if (!sending.current) {
        container.scrollTop =
          container.scrollHeight - previousScrollPosition.current;
      } else {
        container.scrollTop = container.scrollHeight;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  return {
    containerRef,
  };
};

export default useKeepScrollPosition;
