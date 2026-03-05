import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAssistantStore } from '../store';

export function LogsPreview() {
  const { logs, isDeploying } = useAssistantStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isDeploying && logs.length === 0) return null;

  return (
    <div className="ass-logs">
      <AnimatePresence initial={false}>
        {logs.map((line, i) => (
          <motion.span
            key={i}
            className="ass-log-line"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            {line}
          </motion.span>
        ))}
      </AnimatePresence>
      {isDeploying && (
        <span className="ass-log-line">
          {'> '}
          <span className="ass-log-cursor" />
        </span>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
