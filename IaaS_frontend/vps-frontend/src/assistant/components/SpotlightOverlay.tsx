import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssistantStore } from '../store';
import { SCENARIO } from '../scenario';

interface HighlightRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const PAD = 8;

export function SpotlightOverlay() {
  const { spotlightTarget, currentStepId } = useAssistantStore();
  const [rect, setRect] = useState<HighlightRect | null>(null);

  const step = SCENARIO[currentStepId];
  const tooltip = step?.spotlightTooltip ?? 'Выполните действие здесь';

  useEffect(() => {
    if (!spotlightTarget) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(`[data-tour="${spotlightTarget}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        left: r.left - PAD,
        top: r.top - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      });
    };

    measure();
    const id = setInterval(measure, 120);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);

    return () => {
      clearInterval(id);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [spotlightTarget]);

  const visible = Boolean(spotlightTarget && rect);

  const tooltipTop = rect ? rect.top - 44 : 0;
  const isBelow = tooltipTop < 10;

  return (
    <AnimatePresence>
      {visible && rect && (
        <>
          <motion.div
            className="ass-root ass-spotlight-cutout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            }}
          />
          <motion.div
            className={`ass-root ass-spotlight-tooltip${isBelow ? ' below' : ''}`}
            initial={{ opacity: 0, y: isBelow ? -4 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            style={{
              left: rect.left,
              top: isBelow
                ? rect.top + rect.height + 10
                : rect.top - 40,
            }}
          >
            {tooltip}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
