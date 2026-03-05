# IaaS Portal — пользовательский интерфейс

React + TypeScript + CSS. Дизайн и UI-элементы взяты из проекта `mini-app` (Apple 26, стеклянные карточки, pill-кнопки).

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:5174

## Разделы

- **Dashboard** — баланс/статус оплаты, активные ресурсы (VM, storage, public IP), быстрые действия (Создать VM, Деплой нейросети).
- **Compute → Virtual Machines** — таблица VM (name, state, IP, flavor, image, created, cost/day), действия: start/stop/restart/delete, Console (заглушка), SSH info.
- **Create VM** — мастер из 3 шагов: пресет (Ubuntu, Docker host, GPU placeholder, LLM-inference), мощность (Small/Medium/Large с ценой), доступ (SSH key / сгенерировать / подсказка).
- **Storage** — диски и снапшоты (мок-данные).
- **Network** — публичный IP, firewall (чекбоксы 22/80/443).
- **Billing** — тариф, расходы за день/месяц, лимит расходов, сценарии неплатежа (VM остановлена, данные хранятся).
- **Monitoring** — мок-графики CPU/RAM/Net, блок «Prometheus подключен».

## Сборка

```bash
npm run build
npm run preview
```
