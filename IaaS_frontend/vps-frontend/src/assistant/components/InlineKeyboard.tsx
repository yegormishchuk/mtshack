import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SecondaryButton } from '../types';
import { useAssistantStore } from '../store';

interface Props {
  buttons: SecondaryButton[];
  selectedGroupValues?: Record<string, string>;
}

export function InlineKeyboard({ buttons, selectedGroupValues = {} }: Props) {
  const { sendEvent } = useAssistantStore();

  if (!buttons.length) return null;

  return (
    <div className="ass-keyboard">
      {buttons.map((btn, i) => {
        const isSelected =
          btn.group && btn.value
            ? selectedGroupValues[btn.group] === btn.value
            : false;

        return (
          <motion.button
            key={btn.id}
            type="button"
            className={`ass-kb-btn${isSelected ? ' selected' : ''}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() =>
              sendEvent(btn.event, btn.value, btn.label)
            }
          >
            <span>{btn.label}</span>
            {isSelected && (
              <span className="ass-kb-btn-check">
                <Check size={8} color="#fff" strokeWidth={3} />
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
