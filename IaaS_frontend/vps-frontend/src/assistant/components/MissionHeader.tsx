import { Bot } from 'lucide-react';
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
          <Bot size={16} color="#fff" />
        </div>
        <div>
          <h2 className="ass-header-title">
            <span>Олег</span> • Помощник
          </h2>
        </div>
      </div>
      <p className="ass-mission">Доведу до запущенного продукта</p>

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
          title={mode === 'autopilot' ? 'Переключить в Ручной' : 'Переключить в Автопилот'}
        >
          {mode === 'autopilot' ? '⚡ Авто' : '🎛 Ручной'}
        </button>
      </div>
    </div>
  );
}
