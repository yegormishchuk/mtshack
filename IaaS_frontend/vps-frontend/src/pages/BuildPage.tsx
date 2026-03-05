import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistantStore } from '../assistant/store';
import minimumServerImg from '../assets/servers/minimum.png';
import standardServerImg from '../assets/servers/standard.png';
import balanceServerImg from '../assets/servers/balance.png';
import optimumServerImg from '../assets/servers/optimum.png';
import accelerationServerImg from '../assets/servers/acceleration.png';
import scaleServerImg from '../assets/servers/scale.png';
import limitServerImg from '../assets/servers/limit.png';
import hyperServerImg from '../assets/servers/hyper.png';
import absoluteServerImg from '../assets/servers/absolute.png';
import ubuntuLogo from '../assets/os/ubuntu.png';
import centosLogo from '../assets/os/centos.png';
import windowsLogo from '../assets/os/windows.png';
import debianLogo from '../assets/os/debian.png';
import sparklesSymbol from '../assets/symbols/sparkles.svg';
import './BuildPage.css';

interface Plan {
  id: string;
  title: string;
  price: string;
  cpu: string;
  ram: string;
  storage: string;
  ip: string;
  traffic: string;
  image: string;
}

interface ServerType {
  id: string;
  title: string;
  image: string;
}

interface OsOption {
  id: string;
  name: string;
  family: string;
}

interface BillingCycle {
  id: string;
  label: string;
  multiplier: number;
}

interface Region {
  id: string;
  name: string;
  flag: string;
}

const SERVER_TYPES: ServerType[] = [
  { id: 'minimum', title: 'Минимум', image: minimumServerImg },
  { id: 'standard', title: 'Стандарт', image: standardServerImg },
  { id: 'balance', title: 'Баланс', image: balanceServerImg },
  { id: 'optimum', title: 'Оптимум', image: optimumServerImg },
  { id: 'acceleration', title: 'Ускорение', image: accelerationServerImg },
  { id: 'scale', title: 'Масштаб', image: scaleServerImg },
  { id: 'limit', title: 'Предел', image: limitServerImg },
  { id: 'hyper', title: 'Гипер', image: hyperServerImg },
  { id: 'absolute', title: 'Абсолют', image: absoluteServerImg }
];

const OS_OPTIONS: OsOption[] = [
  { id: 'ubuntu', name: 'Ubuntu', family: 'Linux' },
  { id: 'centos', name: 'CentOS', family: 'Linux' },
  { id: 'windows', name: 'Windows', family: 'Windows' },
  { id: 'debian', name: 'Debian', family: 'Linux' }
];

const BILLING_CYCLES: BillingCycle[] = [
  { id: 'monthly', label: 'Ежемесячно', multiplier: 1 },
  { id: 'quarterly', label: 'Каждые 3 месяца', multiplier: 3 },
  { id: 'yearly', label: 'Ежегодно', multiplier: 12 },
  { id: 'semiannual', label: 'Каждые 6 месяцев', multiplier: 6 },
  { id: 'biennial', label: 'Раз в 2 года', multiplier: 24 },
  { id: 'triennial', label: 'Раз в 3 года', multiplier: 36 }
];

const REGIONS: Region[] = [
  { id: 'by-minsk', name: 'Беларусь, Минск', flag: '🇧🇾' },
  { id: 'de-frankfurt', name: 'Германия, Франкфурт', flag: '🇩🇪' },
  { id: 'us-newyork', name: 'США, Нью-Йорк', flag: '🇺🇸' },
  { id: 'nl-amsterdam', name: 'Нидерланды, Амстердам', flag: '🇳🇱' },
  { id: 'pl-warsaw', name: 'Польша, Варшава', flag: '🇵🇱' },
  { id: 'fr-paris', name: 'Франция, Париж', flag: '🇫🇷' },
  { id: 'gb-london', name: 'Великобритания, Лондон', flag: '🇬🇧' },
  { id: 'sg-singapore', name: 'Сингапур, Сингапур', flag: '🇸🇬' },
  { id: 'jp-tokyo', name: 'Япония, Токио', flag: '🇯🇵' }
];

const PLANS: Plan[] = [
  {
    id: 'minimum',
    title: 'Минимум',
    price: '14 BYN / месяц',
    cpu: '1',
    ram: '2 ГБ',
    storage: '25 ГБ SSD',
    ip: '1',
    traffic: '2 ТБ',
    image: minimumServerImg
  },
  {
    id: 'standard',
    title: 'Стандарт',
    price: '20 BYN / месяц',
    cpu: '2',
    ram: '4 ГБ',
    storage: '50 ГБ SSD',
    ip: '1',
    traffic: '7 ТБ',
    image: standardServerImg
  },
  {
    id: 'balance',
    title: 'Баланс',
    price: '44 BYN / месяц',
    cpu: '3',
    ram: '6 ГБ',
    storage: '75 ГБ SSD',
    ip: '1',
    traffic: '13 ТБ',
    image: balanceServerImg
  },
  {
    id: 'optimum',
    title: 'Оптимум',
    price: '64 BYN / месяц',
    cpu: '4',
    ram: '8 ГБ',
    storage: '100 ГБ SSD',
    ip: '1',
    traffic: '20 ТБ',
    image: optimumServerImg
  },
  {
    id: 'acceleration',
    title: 'Ускорение',
    price: '74 BYN / месяц',
    cpu: '4',
    ram: '8 ГБ',
    storage: '120 ГБ SSD',
    ip: '1',
    traffic: '25 ТБ',
    image: accelerationServerImg
  },
  {
    id: 'scale',
    title: 'Масштаб',
    price: '88 BYN / месяц',
    cpu: '6',
    ram: '12 ГБ',
    storage: '150 ГБ SSD',
    ip: '1',
    traffic: '30 ТБ',
    image: scaleServerImg
  },
  {
    id: 'limit',
    title: 'Предел',
    price: '110 BYN / месяц',
    cpu: '8',
    ram: '16 ГБ',
    storage: '200 ГБ SSD',
    ip: '1',
    traffic: '40 ТБ',
    image: limitServerImg
  },
  {
    id: 'hyper',
    title: 'Гипер',
    price: '140 BYN / месяц',
    cpu: '10',
    ram: '24 ГБ',
    storage: '300 ГБ SSD',
    ip: '1',
    traffic: '60 ТБ',
    image: hyperServerImg
  },
  {
    id: 'absolute',
    title: 'Абсолют',
    price: '180 BYN / месяц',
    cpu: '12',
    ram: '32 ГБ',
    storage: '400 ГБ SSD',
    ip: '1',
    traffic: '100 ТБ',
    image: absoluteServerImg
  }
];

const ChevronLeftIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <polyline
      points="14.5 6 9 11.5 14.5 17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChevronRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <polyline
      points="9.5 6 15 11.5 9.5 17"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function BuildPage() {
  const navigate = useNavigate();
  const plansGridRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);
  const [selectedBillingCycleId, setSelectedBillingCycleId] =
    useState<string>('monthly');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('by-minsk');

  // Oleg assistant integration
  const { appState, currentStepId, setSpotlight } = useAssistantStore();
  const { olegPlan, olegOs, olegRegion, olegBilling } = appState;

  // Apply Oleg's selections to local state when they are set
  useEffect(() => {
    if (olegPlan) setSelectedPlanId(olegPlan);
  }, [olegPlan]);
  useEffect(() => {
    if (olegOs) setSelectedOsId(olegOs);
  }, [olegOs]);
  useEffect(() => {
    if (olegRegion) setSelectedRegionId(olegRegion);
  }, [olegRegion]);
  useEffect(() => {
    if (olegBilling) setSelectedBillingCycleId(olegBilling === 'yearly' ? 'yearly' : 'monthly');
  }, [olegBilling]);

  // Scroll to Oleg-selected plan card
  useEffect(() => {
    if (olegPlan && plansGridRef.current) {
      const el = plansGridRef.current.querySelector(`[data-plan-id="${olegPlan}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [olegPlan]);

  const isOlegActive = currentStepId === 'build-config';

  // Spotlight cycling: plan → OS → region → billing → continue → all-at-once
  const spotlightCycledRef = useRef(false);
  useEffect(() => {
    if (!isOlegActive) {
      spotlightCycledRef.current = false;
      return;
    }
    if (spotlightCycledRef.current) return;
    spotlightCycledRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setSpotlight('oleg-plan-card'), 300));
    timers.push(setTimeout(() => setSpotlight('oleg-os-card'), 1600));
    timers.push(setTimeout(() => setSpotlight('oleg-region-selected'), 2900));
    timers.push(setTimeout(() => setSpotlight('oleg-billing-selected'), 4200));
    timers.push(setTimeout(() => setSpotlight('build-continue'), 5500));
    // Show all simultaneously — keep CSS rings, remove dark overlay
    timers.push(setTimeout(() => setSpotlight(null), 6800));
    return () => timers.forEach(clearTimeout);
  }, [isOlegActive, setSpotlight]);

  const selectedPlan = PLANS.find((plan) => plan.id === selectedPlanId) ?? null;
  const selectedOs = OS_OPTIONS.find((os) => os.id === selectedOsId) ?? null;
  const selectedBillingCycle =
    BILLING_CYCLES.find((cycle) => cycle.id === selectedBillingCycleId) ??
    BILLING_CYCLES[0];
  const selectedRegion =
    REGIONS.find((region) => region.id === selectedRegionId) ?? REGIONS[0];

  const getFinalPrice = () => {
    if (!selectedPlan) return null;

    const basePrice = parseFloat(selectedPlan.price);
    if (Number.isNaN(basePrice)) return null;

    const total = basePrice * selectedBillingCycle.multiplier;
    const formatted = total.toFixed(2).replace(/\.00$/, '');

    return `${formatted} BYN`;
  };

  const updateScrollState = () => {
    const container = plansGridRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScrollLeft - 2);
  };

  const scrollPlans = (direction: 'left' | 'right') => {
    const container = plansGridRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.6;
    const delta = direction === 'left' ? -scrollAmount : scrollAmount;

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const target = Math.min(
      Math.max(container.scrollLeft + delta, 0),
      maxScrollLeft
    );

    container.scrollTo({
      left: target,
      behavior: 'smooth'
    });

    window.setTimeout(updateScrollState, 300);
  };

  useEffect(() => {
    updateScrollState();

    const container = plansGridRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollState();
    container.addEventListener('scroll', handleScroll);

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="build-root" aria-labelledby="build-hero-title">
      <header className="build-hero">
        <div className="build-hero-text">
          <h1 id="build-hero-title" className="build-hero-title">
            VPS – Virtual Private Server
          </h1>
          <p className="build-hero-subtitle">
            ваш личный удалённый компьютер в дата-центре.
          </p>
        </div>

        <div className="build-hero-servers" aria-label="Типы серверов">
          {SERVER_TYPES.map((server) => (
            <figure key={server.id} className="build-hero-server">
              <div className="build-hero-server-image-wrap">
                <img
                  src={server.image}
                  alt={server.title}
                  className="build-hero-server-image"
                />
              </div>
              <figcaption className="build-hero-server-caption">
                {server.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </header>

      <section className="build-explore" aria-labelledby="build-explore-title" data-tour="server-config">
        <div className="build-explore-inner">
          <div className="build-explore-heading">
            <div className="build-explore-title-wrap">
              <h2 id="build-explore-title" className="build-explore-title">
                Исследуй все сервера.
              </h2>
            </div>
          </div>

          <div className="build-explore-layout">
            <div className="build-plans-wrapper">
              <div className="build-plans-grid" ref={plansGridRef}>
                {PLANS.map((plan) => {
                  const isOlegPick = isOlegActive && olegPlan === plan.id;
                  return (
                  <article
                    key={plan.id}
                    className={`build-plan-card${isOlegPick ? ' oleg-selected-card' : ''}`}
                    data-plan-id={plan.id}
                    data-tour={isOlegPick ? 'oleg-plan-card' : undefined}
                  >
                    {isOlegPick && (
                      <div style={{ padding: '6px 12px 0' }}>
                        <span className="oleg-selected-badge">✦ Выбрано Олегом</span>
                      </div>
                    )}
                    <div className="build-plan-image-wrap">
                      <img
                        src={plan.image}
                        alt={plan.title}
                        className="build-plan-image"
                      />
                    </div>

                    <div className="build-plan-card-body">
                      <div className="build-plan-card-header">
                        <h3 className="build-plan-title">{plan.title}</h3>
                        <p className="build-plan-price">{plan.price}</p>
                      </div>

                      <dl className="build-plan-specs">
                        <div className="build-plan-spec-row">
                          <dt>Ядра CPU:</dt>
                          <dd>{plan.cpu}</dd>
                        </div>
                        <div className="build-plan-spec-row">
                          <dt>Оперативная память:</dt>
                          <dd>{plan.ram}</dd>
                        </div>
                        <div className="build-plan-spec-row">
                          <dt>Постоянная память:</dt>
                          <dd>{plan.storage}</dd>
                        </div>
                        <div className="build-plan-spec-row">
                          <dt>IP-адрес:</dt>
                          <dd>{plan.ip}</dd>
                        </div>
                        <div className="build-plan-spec-row">
                          <dt>Трафик:</dt>
                          <dd>{plan.traffic}</dd>
                        </div>
                      </dl>

                      <div className="build-plan-actions">
                        <button
                          type="button"
                          className="build-plan-btn build-plan-btn-ghost"
                        >
                          <span>Спросить у ИИ</span>
                          <img
                            src={sparklesSymbol}
                            alt=""
                            aria-hidden="true"
                            className="build-plan-btn-icon"
                          />
                        </button>
                        <button
                          type="button"
                          className="build-plan-btn build-plan-btn-primary"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setSelectedOsId(null);
                          }}
                        >
                          {selectedPlanId === plan.id ? '✓ Выбрано' : 'Выбрать'}
                        </button>
                      </div>
                    </div>
                  </article>
                  );
                })}
              </div>

              <div className="build-plans-controls" aria-hidden="true">
                <button
                  type="button"
                  className="build-plans-control-btn build-plans-control-btn-prev"
                  disabled={!canScrollLeft}
                  onClick={() => scrollPlans('left')}
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  className="build-plans-control-btn build-plans-control-btn-next"
                  disabled={!canScrollRight}
                  onClick={() => scrollPlans('right')}
                >
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="build-os-guide" aria-labelledby="build-os-guide-title">
        <div className="build-os-guide-inner">
          <div className="build-os-guide-header">
            <h2 id="build-os-guide-title" className="build-os-guide-title">
              Выбери ОС.
            </h2>
          </div>

          <div className="build-os-guide-grid" aria-label="Выбор операционной системы">
            {(() => {
              const isLocked = !selectedPlan;

              const handleSelect = (id: string) => {
                if (isLocked) return;
                setSelectedOsId(id);
              };

              const cards = [
                {
                  id: 'ubuntu',
                  title: 'Ubuntu',
                  family: 'Linux',
                  logo: ubuntuLogo
                },
                {
                  id: 'centos',
                  title: 'CentOS',
                  family: 'Linux',
                  logo: centosLogo
                },
                {
                  id: 'windows',
                  title: 'Windows',
                  family: 'Windows',
                  logo: windowsLogo
                },
                {
                  id: 'debian',
                  title: 'Debian',
                  family: 'Linux',
                  logo: debianLogo
                }
              ] as const;

              return cards.map((card) => {
                const isActive = selectedOsId === card.id;
                const isOlegOsPick = isOlegActive && olegOs === card.id;
                const classNames = [
                  'build-os-guide-card',
                  isActive ? 'build-os-guide-card-active' : '',
                  isLocked ? 'build-os-guide-card-disabled' : '',
                  isOlegOsPick ? 'oleg-selected-card' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <article
                    key={card.id}
                    className={classNames}
                    role="button"
                    tabIndex={isLocked ? -1 : 0}
                    aria-pressed={isActive}
                    aria-disabled={isLocked}
                    data-tour={isOlegOsPick ? 'oleg-os-card' : undefined}
                    onClick={() => handleSelect(card.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleSelect(card.id);
                      }
                    }}
                  >
                    {isOlegOsPick && (
                      <div style={{ padding: '6px 12px 0' }}>
                        <span className="oleg-selected-badge">✦ Выбрано Олегом</span>
                      </div>
                    )}
                    <div className="build-os-card-hero">
                      <div className="build-os-card-logo-wrap">
                        <img
                          src={card.logo}
                          alt={card.title}
                          className="build-os-card-logo-img"
                        />
                      </div>
                    </div>
                    <div className="build-os-card-body">
                      <h3 className="build-os-guide-card-title">{card.title}</h3>
                      <p className="build-os-card-family">{card.family}</p>
                      <div className="build-os-card-actions">
                        <button
                          type="button"
                          className="build-plan-btn build-plan-btn-ghost"
                          disabled={isLocked}
                        >
                          <span>Спросить у ИИ</span>
                          <img
                            src={sparklesSymbol}
                            alt=""
                            aria-hidden="true"
                            className="build-plan-btn-icon"
                          />
                        </button>
                        <button
                          type="button"
                          className="build-plan-btn build-plan-btn-primary"
                          disabled={isLocked}
                          onClick={() => handleSelect(card.id)}
                        >
                          {isActive ? '✓ Выбрано' : 'Выбрать'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              });
            })()}
          </div>

          {!selectedPlan && (
            <p className="build-selection-hint">
              Сначала выбери конфигурацию сервера выше, затем операционную систему.
            </p>
          )}
        </div>
      </section>

      <section
        className="build-region-section"
        aria-labelledby="build-region-title"
        data-tour="region-select"
      >
        <div className="build-region-inner">
          <div className="build-section-header-row">
            <h2 id="build-region-title" className="build-region-title">
              Выбор региона
            </h2>
            {isOlegActive && olegRegion && (
              <span className="oleg-selected-badge">✦ Выбрано Олегом</span>
            )}
          </div>

          <div className="build-region-options">
            {REGIONS.map((region) => {
              const isActive = selectedRegionId === region.id;
              const isOlegPick = isOlegActive && olegRegion === region.id;
              return (
                <button
                  key={region.id}
                  type="button"
                  className={[
                    'build-os-btn',
                    isActive ? 'build-os-btn-active' : '',
                    isOlegPick ? 'oleg-selected-btn' : '',
                  ].filter(Boolean).join(' ')}
                  data-tour={isOlegPick ? 'oleg-region-selected' : undefined}
                  disabled={!selectedPlan || !selectedOs}
                  onClick={() => setSelectedRegionId(region.id)}
                >
                  <span className="build-region-btn-content">
                    <span className="build-region-flag">{region.flag}</span>
                    <span className="build-os-btn-name">{region.name}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="build-billing-section"
        aria-labelledby="build-billing-title"
      >
        <div className="build-billing-inner">
          <div className="build-section-header-row">
            <h2 id="build-billing-title" className="build-billing-title">
              Выбор цикла оплаты
            </h2>
            {isOlegActive && olegBilling && (
              <span className="oleg-selected-badge">✦ Выбрано Олегом</span>
            )}
          </div>

          <div className="build-billing-options">
            {BILLING_CYCLES.map((cycle) => {
              const isActive = selectedBillingCycleId === cycle.id;
              const isOlegPick = isOlegActive && (
                olegBilling === cycle.id ||
                (olegBilling === 'yearly' && cycle.id === 'yearly') ||
                (olegBilling === 'monthly' && cycle.id === 'monthly')
              );
              return (
                <button
                  key={cycle.id}
                  type="button"
                  className={[
                    'build-os-btn',
                    isActive ? 'build-os-btn-active' : '',
                    isOlegPick ? 'oleg-selected-btn' : '',
                  ].filter(Boolean).join(' ')}
                  data-tour={isOlegPick ? 'oleg-billing-selected' : undefined}
                  disabled={!selectedPlan || !selectedOs || !selectedRegionId}
                  onClick={() => setSelectedBillingCycleId(cycle.id)}
                >
                  <span className="build-os-btn-name">{cycle.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="build-selection-panel"
        aria-label="Итоговая конфигурация сервера"
      >
        <div className={`build-selection-step build-selection-step-summary${isOlegActive && selectedPlan ? ' oleg-summary-active' : ''}`}>
          {selectedPlan ? (
            <>
              {isOlegActive ? (
                <>
                  <div className="oleg-summary-header">
                    <span className="oleg-selected-badge">✦ Олег</span>
                    <h3 className="build-selection-step-title oleg-summary-title">
                      Я всё подобрал ✅
                    </h3>
                  </div>
                  <p className="oleg-summary-lineup">
                    Тариф: <strong>{selectedPlan.title}</strong>
                    {' • '}ОС: <strong>{selectedOs?.name ?? 'Ubuntu'}</strong>
                    {' • '}Регион: {selectedRegion.flag} <strong>{selectedRegion.name.split(',')[0]}</strong>
                    {' • '}Оплата: <strong>{selectedBillingCycle.label}</strong>
                  </p>
                </>
              ) : (
                <>
                  <p className="build-selection-step-label">Итог</p>
                  <h3 className="build-selection-step-title">
                    Конфигурация вашего сервера
                  </h3>
                </>
              )}

              <div className="build-selection-plan-card">
                <p className="build-selection-plan-title">
                  {selectedPlan.title}
                </p>
                <p className="build-selection-plan-price">
                  {selectedPlan.price}
                </p>
                <ul className="build-selection-plan-specs">
                  <li>
                    <span>CPU</span>
                    <span>{selectedPlan.cpu}</span>
                  </li>
                  <li>
                    <span>RAM</span>
                    <span>{selectedPlan.ram}</span>
                  </li>
                  <li>
                    <span>SSD</span>
                    <span>{selectedPlan.storage}</span>
                  </li>
                  <li>
                    <span>Трафик</span>
                    <span>{selectedPlan.traffic}</span>
                  </li>
                </ul>
              </div>

              <div className="build-summary-total">
                <p className="build-summary-total-label">
                  {isOlegActive ? 'Олег выбрал' : 'Вы выбрали'}
                </p>
                {selectedOs && (
                  <p className="build-summary-total-hint">
                    ОС: <strong>{selectedOs.name}</strong> ({selectedOs.family})
                  </p>
                )}
                <p className="build-summary-total-hint">
                  Регион: {selectedRegion.flag} {selectedRegion.name}
                </p>
                <p className="build-summary-total-hint">
                  Цикл оплаты: <strong>{selectedBillingCycle.label}</strong>
                </p>
                <p className="build-summary-total-amount">
                  Итоговая стоимость: {getFinalPrice() ?? selectedPlan.price}
                </p>
              </div>

              <div className="build-summary-actions" data-tour="build-continue">
                <button
                  type="button"
                  className="build-plan-btn build-plan-btn-primary build-summary-pay-btn"
                  disabled={!selectedPlan || !selectedOs}
                  onClick={() => navigate('/billing')}
                >
                  {isOlegActive ? '🚀 Создать сервер' : 'Перейти к оплате'}
                </button>
                {isOlegActive && (
                  <button
                    type="button"
                    className="build-plan-btn build-plan-btn-ghost build-summary-change-btn"
                  >
                    Изменить выбор
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="build-selection-step-label">Итог</p>
              <h3 className="build-selection-step-title">
                Сначала выбери конфигурацию сервера выше
              </h3>
            </>
          )}
        </div>
      </section>
    </section>
  );
}

