import { useState } from 'react';
import { ChevronDown, HelpCircle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScenarioStep } from '../types';
import { useAssistantStore } from '../store';
import { InlineKeyboard } from './InlineKeyboard';
import { ProgressStages } from './ProgressStages';
import { LogsPreview } from './LogsPreview';
import { CONSOLE_SETUP_CMDS, RUN_CMDS, TOUR_STOPS } from '../scenario';

interface Props {
  step: ScenarioStep;
}

export function ActionCard({ step }: Props) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  const {
    sendEvent,
    isDeploying,
    deployStageIndex,
    selectedValues,
    consoleStepIndex,
    runStepIndex,
    tourStepIndex,
    appState,
  } = useAssistantStore();

  const { card } = step;
  const isProvisionStep = card.isProvision;
  const isDone = card.isDone;
  const isConsoleSetup = card.isConsoleSetup;
  const isRunProject = card.isRunProject;
  const isTour = card.isTour;
  const deployStarted = isProvisionStep && (isDeploying || deployStageIndex >= 0);

  // Console setup: show current command
  const consoleCmds = CONSOLE_SETUP_CMDS;
  const currentConsoleCmd = consoleCmds[consoleStepIndex];
  const consoleAllDone = consoleStepIndex >= consoleCmds.length;

  // Run project: show current command based on project type
  const projectType = appState.projectType ?? 'generic';
  const runCmds = RUN_CMDS[projectType] ?? RUN_CMDS.generic;
  const currentRunCmd = runCmds[runStepIndex];
  const runAllDone = runStepIndex >= runCmds.length;

  // Tour stop
  const tourStop = TOUR_STOPS[tourStepIndex];

  const handlePrimary = () => {
    sendEvent(card.primaryAction.event, undefined, card.primaryAction.label);
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
        <p className="ass-card-instr">
          {isConsoleSetup && currentConsoleCmd
            ? `Команда ${consoleStepIndex + 1}/${consoleCmds.length}: ${currentConsoleCmd.label}`
            : isRunProject && currentRunCmd
            ? `Команда ${runStepIndex + 1}/${runCmds.length}: ${currentRunCmd.label}`
            : card.instruction}
        </p>
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

        {/* Provision Progress */}
        {isProvisionStep && deployStarted && (
          <>
            <ProgressStages />
            <LogsPreview />
          </>
        )}

        {/* Console Setup — show next command */}
        {isConsoleSetup && !consoleAllDone && currentConsoleCmd && (
          <div className="ass-console-cmd">
            <div className="ass-console-step-info">
              <span className="ass-console-step-dot" />
              {consoleStepIndex + 1} из {consoleCmds.length}
            </div>
            <span className="ass-console-cmd-prompt">$</span>
            {currentConsoleCmd.cmd}
          </div>
        )}

        {/* Run Project — show next command */}
        {isRunProject && !runAllDone && currentRunCmd && (
          <div className="ass-console-cmd">
            <div className="ass-console-step-info">
              <span className="ass-console-step-dot" />
              {runStepIndex + 1} из {runCmds.length} • {projectType.toUpperCase()}
            </div>
            <span className="ass-console-cmd-prompt">$</span>
            {currentRunCmd.cmd}
          </div>
        )}

        {/* Files Review — show flagged files */}
        {card.isFilesReview && step.id === 'files-review' && (
          <FilesReviewSection />
        )}

        {/* Tour Stop */}
        {isTour && tourStop && (
          <div className="ass-tour-stop">
            <div className="ass-tour-stop-label">
              <span className="ass-tour-stop-dot" />
              {tourStop.label}
            </div>
            <p className="ass-tour-stop-desc">{tourStop.desc}</p>
            <p className="ass-tour-counter">
              {tourStepIndex + 1} / {TOUR_STOPS.length}
            </p>
          </div>
        )}

        {/* Primary CTA — hide when deploy is running or all done */}
        {!(isProvisionStep && deployStarted) && !(isConsoleSetup && consoleAllDone) && !(isRunProject && runAllDone) && (
          <motion.button
            type="button"
            className="ass-primary-btn"
            onClick={handlePrimary}
            whileTap={{ scale: 0.97 }}
          >
            {isConsoleSetup && currentConsoleCmd
              ? `⚡ Вставить и выполнить`
              : isRunProject && currentRunCmd
              ? `⚡ Вставить и выполнить`
              : card.primaryAction.label}
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

function FilesReviewSection() {
  const { appState } = useAssistantStore();
  const flagged = appState.uploadedFiles.filter((f) => f.flagged && !f.removed);

  if (!flagged.length) return null;

  return (
    <div className="ass-files-list">
      {flagged.slice(0, 5).map((f) => (
        <div key={f.name} className="ass-file-item flagged">
          <span className="ass-file-flag">⚠️</span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.name}
          </span>
          <span style={{ fontSize: '8px', opacity: 0.7 }}>{f.flagReason}</span>
        </div>
      ))}
      {flagged.length > 5 && (
        <div style={{ fontSize: '9px', color: 'var(--ass-text-muted)', textAlign: 'center' }}>
          ещё {flagged.length - 5} файлов...
        </div>
      )}
    </div>
  );
}
