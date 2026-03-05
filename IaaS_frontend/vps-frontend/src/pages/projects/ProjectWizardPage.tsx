import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectsStore } from '../../store/projectsStore';
import type { ProjectTemplate } from '../../domain/iaasTypes';
import './ProjectsPages.css';
import { AIAssistantWidget } from '../../components/AIAssistantWidget';
import type { CreateProjectApiOpts } from '../../store/projectsStore';

type WizardStep = 1 | 2 | 3 | 4;

interface SizeOption {
  id: 's' | 'm' | 'l';
  label: string;
  description: string;
  monthlyCostHint: string;
}

const SIZE_OPTIONS: SizeOption[] = [
  { id: 's', label: 'S', description: 'Небольшой проект или MVP', monthlyCostHint: '≈ 20–30 BYN/мес' },
  { id: 'm', label: 'M', description: 'Продакшен для команды', monthlyCostHint: '≈ 40–80 BYN/мес' },
  { id: 'l', label: 'L', description: 'Высокая нагрузка', monthlyCostHint: 'от 100 BYN/мес' }
];

const REGIONS = ['Германия', 'Польша', 'Нидерланды', 'США', 'Сингапур'];

const TEMPLATES: { id: ProjectTemplate; title: string; text: string }[] = [
  {
    id: 'Static Site',
    title: 'Статический сайт',
    text: 'Лендинг или блог без сложного бэкенда.'
  },
  {
    id: 'Backend API',
    title: 'Backend API',
    text: 'REST/GraphQL API, например FastAPI или Django.'
  },
  {
    id: 'SaaS',
    title: 'SaaS-приложение',
    text: 'Веб-приложение с фронтендом, бэкендом и базой данных.'
  },
  { id: 'VPN', title: 'VPN', text: 'Безопасный доступ в приватную сеть команды.' },
  {
    id: 'AI Inference',
    title: 'AI inference',
    text: 'Сервис для инференса ML-моделей.'
  },
  { id: 'Custom', title: 'Своя схема', text: 'Полный контроль над топологией.' }
];

export function ProjectWizardPage() {
  const navigate = useNavigate();
  const createProjectOnApi = useProjectsStore((state) => state.createProjectOnApi);
  const loading = useProjectsStore((state) => state.loading);
  const addToast = useProjectsStore((state) => state.addToast);

  const [step, setStep] = useState<WizardStep>(1);
  const [template, setTemplate] = useState<ProjectTemplate | null>('SaaS');
  const [region, setRegion] = useState<string>('Германия');
  const [size, setSize] = useState<'s' | 'm' | 'l'>('m');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const canGoNext =
    (step === 1 && template) || (step === 2 && region) || (step === 3 && size);

  const goNext = () => {
    if (!canGoNext) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as WizardStep) : prev));
  };

  const goPrev = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : prev));
  };

  const handleCreate = async () => {
    if (!template || !region) return;

    const baseName =
      template === 'Static Site'
        ? 'my-site'
        : template === 'Backend API'
        ? 'my-api'
        : template === 'VPN'
        ? 'my-vpn'
        : template === 'AI Inference'
        ? 'my-ai'
        : template === 'SaaS'
        ? 'my-saas'
        : 'my-project';

    const description =
      template === 'VPN'
        ? 'VPN-сервер для безопасного доступа.'
        : template === 'Backend API'
        ? 'Backend API, например FastAPI.'
        : template === 'Static Site'
        ? 'Статический сайт или лендинг.'
        : template === 'AI Inference'
        ? 'Инференс-модель, доступная через HTTP.'
        : template === 'SaaS'
        ? 'SaaS-приложение с фронтендом и базой.'
        : 'Инфраструктура под ваш проект.';

    const opts: CreateProjectApiOpts = {
      name: baseName,
      description,
      template,
      region,
      size,
    };

    try {
      const projectId = await createProjectOnApi(opts);
      navigate(`/projects/${projectId}`);
    } catch (err) {
      addToast(`Ошибка создания: ${err instanceof Error ? err.message : 'неизвестная ошибка'}`);
    }
  };

  return (
    <section className="servers-root" aria-label="Новый проект">
      <div className="projects-root">
        <div className="projects-sidebar">
          <div className="projects-sidebar-panel">
            <h1 className="projects-title">Новый проект</h1>
            <p className="page-text">
              Ответьте на несколько вопросов — мы соберём инфраструктуру за вас.
            </p>
          </div>
        </div>

        <section className="projects-content">
          <div className="projects-header-row">
            <p className="page-text">
              Шаг {step} из 4
            </p>
          </div>

          {step === 1 && (
            <div className="projects-list-grid">
              {TEMPLATES.map((tpl) => {
                const isActive = template === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    className="project-card"
                    onClick={() => setTemplate(tpl.id)}
                    style={{
                      border: isActive ? '1px solid #FF0023' : '1px solid transparent'
                    }}
                  >
                    <div className="project-card-header">
                      <div>
                        <h2 className="project-card-title">{tpl.title}</h2>
                        <p className="project-card-subtitle">{tpl.text}</p>
                      </div>
                    </div>
                    <p className="projects-empty-text">
                      Мы предложим готовую топологию и набор VM под этот сценарий.
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="projects-list-grid">
              {REGIONS.map((reg) => {
                const isActive = region === reg;
                return (
                  <button
                    key={reg}
                    type="button"
                    className="project-card"
                    onClick={() => setRegion(reg)}
                    style={{
                      border: isActive ? '1px solid #FF0023' : '1px solid transparent'
                    }}
                  >
                    <div className="project-card-header">
                      <div>
                        <h2 className="project-card-title">{reg}</h2>
                        <p className="project-card-subtitle">
                          Ближе к вашей аудитории — меньше задержки.
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="projects-list-grid">
              {SIZE_OPTIONS.map((opt) => {
                const isActive = size === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className="project-card"
                    onClick={() => setSize(opt.id)}
                    style={{
                      border: isActive ? '1px solid #FF0023' : '1px solid transparent'
                    }}
                  >
                    <div className="project-card-header">
                      <div>
                        <h2 className="project-card-title">{opt.label}</h2>
                        <p className="project-card-subtitle">{opt.description}</p>
                      </div>
                    </div>
                    <p className="projects-empty-text">{opt.monthlyCostHint}</p>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="projects-empty">
              <h2 className="projects-empty-title">Схема проекта</h2>
              <p className="projects-empty-text">
                Мы создадим типовую топологию в виде графа: Internet →{' '}
                {template === 'VPN'
                  ? 'VPN-сервер'
                  : template === 'Static Site'
                  ? 'Web-сервер'
                  : 'Frontend → Backend → DB'}{' '}
                в регионе {region}. Позже вы сможете детализировать конфигурацию.
              </p>
            </div>
          )}

          <div className="projects-header-row">
            <div>
              <button
                type="button"
                className="project-card-open-btn"
                onClick={goPrev}
                disabled={step === 1}
                style={step === 1 ? { opacity: 0.6, cursor: 'default' } : undefined}
              >
                Назад
              </button>
            </div>
            {step < 4 ? (
              <button
                type="button"
                className="projects-create-btn"
                onClick={goNext}
                disabled={!canGoNext}
                style={!canGoNext ? { opacity: 0.6, cursor: 'default' } : undefined}
              >
                Далее
              </button>
            ) : (
              <button
                type="button"
                className="projects-create-btn"
                onClick={() => { void handleCreate(); }}
                disabled={loading}
                style={loading ? { opacity: 0.7, cursor: 'wait' } : undefined}
              >
                {loading ? 'Создаётся…' : 'Создать проект'}
              </button>
            )}
          </div>
        </section>
      </div>
      <AIAssistantWidget
        mode="wizard"
        environment={{
          selectTemplate: (tpl) => setTemplate(tpl),
          setRegion: (reg) => setRegion(reg),
          setSize: (s) => setSize(s),
          createProject: () => handleCreate()
        }}
      />
    </section>
  );
}

