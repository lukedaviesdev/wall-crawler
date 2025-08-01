import { useEffect, useRef } from 'react';

/**
 * Hook that manages event listeners with proper cleanup and type safety
 * Useful for adding event listeners to window, document, or any HTML element
 */
export function useEventListener<
  T extends Window | Document | HTMLElement,
  K extends keyof WindowEventMap,
>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: T,
  options?: boolean | AddEventListenerOptions,
): void {
  // Create a ref that stores handler
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Define the listening target
    // Use window as the default target only when element is not provided
    const targetElement = element === undefined ? window : element;

    // Don't add listener if element is null or doesn't support addEventListener
    if (!targetElement?.addEventListener) {
      return;
    }

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: WindowEventMap[K]) =>
      savedHandler.current(event);

    targetElement.addEventListener(
      eventName,
      eventListener as EventListener,
      options,
    );

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(
        eventName,
        eventListener as EventListener,
        options,
      );
    };
  }, [eventName, element, options]);
}
