import { Rocket } from 'lucide-react';
import { useAssistantStore } from '../store';
import type { ScenarioStep } from '../types';
import { TOTAL_STEPS } from '../scenario';

interface Props {
  step: ScenarioStep | undefined;
}

export function MissionHeader({ step }: Props) {
  const { mode, toggleMode } = useAssistantStore();

  const stepIndex = step?.stepIndex ?? 1;
  const progressPct = ((stepIndex - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="ass-header">
      <div className="ass-header-top">
        <div className="ass-header-icon">
          <Rocket size={14} color="#fff" />
        </div>
        <h2 className="ass-header-title">Launch Assistant</h2>
      </div>
      <p className="ass-mission">Get your product running</p>

      <div className="ass-progress-row">
        <span className="ass-progress-label">
          {stepIndex}/{TOTAL_STEPS}
        </span>
        <div className="ass-progress-track">
          <div
            className="ass-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <button
          type="button"
          className={`ass-mode-btn${mode === 'autopilot' ? ' active' : ''}`}
          onClick={toggleMode}
          title={mode === 'autopilot' ? 'Переключить в Manual' : 'Переключить в Autopilot'}
        >
          {mode === 'autopilot' ? '⚡ Auto' : '🎛 Manual'}
        </button>
      </div>
    </div>
  );
}
