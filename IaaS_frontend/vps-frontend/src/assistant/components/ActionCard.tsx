import { useState } from 'react';
import { ChevronDown, HelpCircle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScenarioStep } from '../types';
import { useAssistantStore } from '../store';
import { InlineKeyboard } from './InlineKeyboard';
import { ProgressStages } from './ProgressStages';
import { LogsPreview } from './LogsPreview';

interface Props {
  step: ScenarioStep;
}

export function ActionCard({ step }: Props) {
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [envKey1, setEnvKey1] = useState('NODE_ENV');
  const [envVal1, setEnvVal1] = useState('production');
  const [envKey2, setEnvKey2] = useState('PORT');
  const [envVal2, setEnvVal2] = useState('3000');

  const { sendEvent, isDeploying, deployStageIndex, selectedValues } =
    useAssistantStore();

  const { card } = step;
  const isDeployStep = step.id === 'deploy';
  const isDone = card.isDone;
  const deployStarted = isDeployStep && (isDeploying || deployStageIndex >= 0);

  const handlePrimary = () => {
    if (card.showEnvForm) {
      sendEvent(card.primaryAction.event, undefined, card.primaryAction.label);
    } else {
      sendEvent(card.primaryAction.event, undefined, card.primaryAction.label);
    }
  };

  return (
    <div className="ass-action-card">
      {/* Card Header */}
      <div className="ass-card-top">
        <div className="ass-card-step-badge">
          <span className="ass-card-step-dot" />
          Шаг {step.stepIndex} / {step.totalSteps}
        </div>
        <h3 className="ass-card-title">{card.title}</h3>
        <p className="ass-card-instr">{card.instruction}</p>
        {card.hint && (
          <div className="ass-card-hint">
            <Lightbulb size={9} className="ass-card-hint-icon" />
            {card.hint}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="ass-card-body">
        {/* Done State */}
        {isDone && (
          <div className="ass-done-banner">
            <div className="ass-done-ip">
              <span className="ass-done-pulse" />
              185.12.44.201
            </div>
          </div>
        )}

        {/* Deploy Progress */}
        {isDeployStep && deployStarted && (
          <>
            <ProgressStages />
            <LogsPreview />
          </>
        )}

        {/* Env Vars Form */}
        {card.showEnvForm && (
          <div className="ass-env-form">
            <div className="ass-env-row">
              <input
                className="ass-env-input"
                placeholder="KEY"
                value={envKey1}
                onChange={(e) => setEnvKey1(e.target.value)}
              />
              <input
                className="ass-env-input"
                placeholder="VALUE"
                value={envVal1}
                onChange={(e) => setEnvVal1(e.target.value)}
              />
            </div>
            <div className="ass-env-row">
              <input
                className="ass-env-input"
                placeholder="KEY"
                value={envKey2}
                onChange={(e) => setEnvKey2(e.target.value)}
              />
              <input
                className="ass-env-input"
                placeholder="VALUE"
                value={envVal2}
                onChange={(e) => setEnvVal2(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Primary CTA — hide when deploy is running */}
        {!(isDeployStep && deployStarted) && (
          <motion.button
            type="button"
            className="ass-primary-btn"
            onClick={handlePrimary}
            whileTap={{ scale: 0.97 }}
          >
            {card.primaryAction.label}
          </motion.button>
        )}

        {/* Secondary buttons */}
        {card.secondaryButtons && card.secondaryButtons.length > 0 && (
          <InlineKeyboard
            buttons={card.secondaryButtons}
            selectedGroupValues={selectedValues}
          />
        )}

        {/* Accordion */}
        {card.accordionText && (
          <div className="ass-accordion">
            <button
              type="button"
              className="ass-accordion-trigger"
              onClick={() => setAccordionOpen((o) => !o)}
            >
              <HelpCircle size={11} />
              Почему это важно?
              <ChevronDown
                size={10}
                className={`ass-accordion-chevron${accordionOpen ? ' open' : ''}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {accordionOpen && (
                <motion.div
                  className="ass-accordion-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  {card.accordionText}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
