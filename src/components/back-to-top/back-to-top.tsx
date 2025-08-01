import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { useEventListener } from '@/hooks/use-event-listener/use-event-listener';

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEventListener('scroll', () => {
    const shouldShow = window.scrollY > 250;
    setIsVisible(shouldShow);
  });

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
