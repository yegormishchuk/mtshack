import sparklesSymbol from '../assets/symbols/sparkles.svg';
import './IaaSPage.css';

export function IaaSPage() {
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
        <button type="button" className="iaas-btn iaas-btn-primary">
          <span className="iaas-btn-primary-label">Начать с ИИ</span>
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

