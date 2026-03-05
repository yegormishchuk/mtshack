import { motion, AnimatePresence } from 'framer-motion';
import { Minus, X, Rocket } from 'lucide-react';
import { useAssistantStore } from '../store';
import { SCENARIO } from '../scenario';
import { MissionHeader } from './MissionHeader';
import { ActionCard } from './ActionCard';
import { MiniFeed } from './MiniFeed';
import { SpotlightOverlay } from './SpotlightOverlay';
import '../assistant.css';

export function AssistantWidget() {
  const { isOpen, isMinimized, currentStepId, open, close, minimize } =
    useAssistantStore();

  const step = SCENARIO[currentStepId];

  return (
    <div className="ass-root">
      <SpotlightOverlay />

      {/* FAB — shown when widget is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="ass-fab"
            onClick={open}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            aria-label="Открыть Launch Assistant"
          >
            <Rocket size={16} />
            Launch
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ass-widget"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Controls */}
            <div className="ass-controls">
              <button
                type="button"
                className="ass-ctrl-btn"
                onClick={minimize}
                title={isMinimized ? 'Развернуть' : 'Свернуть'}
              >
                <Minus size={12} />
              </button>
              <button
                type="button"
                className="ass-ctrl-btn"
                onClick={close}
                title="Закрыть"
              >
                <X size={12} />
              </button>
            </div>

            {/* Mission Header */}
            {step && <MissionHeader step={step} />}

            {/* Body */}
            <AnimatePresence mode="wait">
              {!isMinimized && step && (
                <motion.div
                  key={`body-${currentStepId}`}
                  className="ass-body"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <ActionCard step={step} />
                  <MiniFeed />
                  <div className="ass-spacer" />
                </motion.div>
              )}

              {isMinimized && (
                <motion.div
                  key="minimized"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '10px 16px',
                    fontSize: '10px',
                    color: 'var(--ass-text-dim)',
                    borderTop: '1px solid var(--ass-border)',
                  }}
                >
                  Шаг {step?.stepIndex ?? 1}/{step?.totalSteps ?? 7} — {step?.card.title}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
