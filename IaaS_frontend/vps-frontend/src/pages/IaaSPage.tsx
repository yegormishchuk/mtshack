import { useEffect } from 'react';
import sparklesSymbol from '../assets/symbols/sparkles.svg';
import { useAssistantStore } from '../assistant/store';
import './IaaSPage.css';

export function IaaSPage() {
  const { open, isOpen, sendEvent, currentStepId } = useAssistantStore();

  // Auto-open Oleg on landing
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => open(), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const handleStart = () => {
    if (!isOpen) open();
    if (currentStepId === 'welcome') {
      sendEvent('LETS_GO', undefined, 'Давай!');
    }
  };

  return (
    <section className="iaas-hero">
      <h1 className="iaas-hero-title">
        Инфраструктура без DevOps: от идеи до запущенного сервиса за минуты
      </h1>
      <p className="iaas-hero-subtitle">
        Облако, которое разворачивает ваш проект вместе с вами
      </p>
      <div className="iaas-hero-actions" data-tour="hero-cta">
        <button type="button" className="iaas-btn iaas-btn-secondary">
          Войти
        </button>
        <button
          type="button"
          className="iaas-btn iaas-btn-primary"
          onClick={handleStart}
        >
          <span className="iaas-btn-primary-label">Начать с Олегом</span>
          <img
            src={sparklesSymbol}
            alt=""
            aria-hidden="true"
            className="iaas-btn-primary-icon"
          />
        </button>
      </div>
    </section>
  );
}
