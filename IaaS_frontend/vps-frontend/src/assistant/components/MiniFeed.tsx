import { AnimatePresence, motion } from 'framer-motion';
import { useAssistantStore } from '../store';

export function MiniFeed() {
  const { feed } = useAssistantStore();

  const visible = feed.slice(-6);
  if (!visible.length) return null;

  return (
    <div className="ass-feed">
      <p className="ass-feed-label">История</p>
      <div className="ass-feed-items">
        <AnimatePresence initial={false}>
          {visible.map((item) => (
            <motion.div
              key={item.id}
              className={`ass-feed-row ${item.type}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {item.type === 'user' ? (
                <>
                  <span className="ass-feed-pill">{item.content}</span>
                  <span className="ass-feed-time">{item.timestamp}</span>
                </>
              ) : (
                <>
                  <span className="ass-feed-dot" />
                  <span className="ass-feed-note">{item.content}</span>
                  <span className="ass-feed-time">{item.timestamp}</span>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
