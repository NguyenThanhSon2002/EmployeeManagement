import { useEffect, useRef } from 'react';

interface UseModalFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  autoFocus?: boolean;
}

/**
 * Custom hook to trap keyboard focus within a modal or drawer (WCAG 2.1 AA)
 * Handles Escape key to close and Tab/Shift+Tab cycling.
 */
export function useModalFocusTrap<T extends HTMLElement = HTMLDivElement>({
  isOpen,
  onClose,
  autoFocus = true,
}: UseModalFocusTrapOptions) {
  const containerRef = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const hasAutofocusedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasAutofocusedRef.current = false;
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const getFocusableElements = () => {
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    // Auto-focus only once when the modal initially opens
    if (autoFocus && !hasAutofocusedRef.current) {
      hasAutofocusedRef.current = true;
      const elements = getFocusableElements();
      if (elements.length > 0) {
        // Prefer first form control (input, select) over the top-right close 'X' button
        const firstInput = elements.find(
          (el) => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
        );
        const target = firstInput || elements[0];
        // Short timeout allows layout/animation to settle
        requestAnimationFrame(() => {
          target.focus();
        });
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (e.key === 'Tab') {
        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, autoFocus]);

  return containerRef;
}
