import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, Circle } from 'lucide-react';
import { useAssistantStore } from '../store';

const STAGES = [
  { label: 'Подбираю железо...' },
  { label: 'Создаю VM' },
  { label: 'Настройка сети и Docker' },
  { label: 'Сервер готов ✓' },
];

type StageState = 'pending' | 'active' | 'done-s';

export function ProgressStages() {
  const { deployStageIndex, isDeploying } = useAssistantStore();

  const getState = (idx: number): StageState => {
    if (deployStageIndex < 0) return 'pending';
    if (idx < deployStageIndex) return 'done-s';
    if (idx === deployStageIndex) return isDeploying ? 'active' : 'done-s';
    return 'pending';
  };

  return (
    <div className="ass-stages">
      {STAGES.map((stage, idx) => {
        const state = getState(idx);
        return (
          <motion.div
            key={idx}
            className={`ass-stage ${state}`}
            initial={false}
            animate={state === 'active' ? { backgroundColor: 'rgba(255,0,35,0.04)' } : {}}
          >
            <div className={`ass-stage-icon ${state}`}>
              <AnimatePresence mode="wait">
                {state === 'done-s' && (
                  <motion.span
                    key="done"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <CheckCircle size={12} />
                  </motion.span>
                )}
                {state === 'active' && (
                  <motion.span
                    key="active"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, rotate: 360 }}
                    transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
                    style={{ display: 'flex' }}
                  >
                    <Loader size={12} />
                  </motion.span>
                )}
                {state === 'pending' && (
                  <motion.span
                    key="pending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <Circle size={10} />
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <span className={`ass-stage-label ${state}`}>{stage.label}</span>
            {state === 'active' && (
              <span className="ass-stage-time">running…</span>
            )}
            {state === 'done-s' && (
              <span className="ass-stage-time">✓</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
