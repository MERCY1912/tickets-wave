# Руководство по деплою Tickets Wave в онлайн

Полная пошаговая инструкция по превращению локального приложения в работающий SaaS-сервис.

---

## Обзор архитектуры

После миграции ваше приложение состоит из трёх компонентов, которые нужно развернуть:

1. **База данных Turso** - облачная SQLite-совместимая база данных
2. **Backend API** - Express сервер на Node.js
3. **Frontend** - React приложение (статические файлы)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  Frontend   │ ───> │  Backend    │ ───> │   Turso     │
│  (Vercel)   │      │  (Render)   │      │  Database   │
└─────────────┘      └─────────────┘      └─────────────┘
```

---

## Шаг 1: Настройка Turso Database

### 1.1 Регистрация в Turso

1. Перейдите на https://turso.tech
2. Нажмите **Sign Up** и зарегистрируйтесь (через GitHub проще всего)
3. После регистрации вы попадёте в дашборд

### 1.2 Создание базы данных

1. В дашборде Turso нажмите **"Create Database"**
2. Введите имя базы данных, например: `tickets-wave-db`
3. Выберите регион (ближе к вашим пользователям):
   - `ams` (Амстердам) - для Европы
   - `ewr` (Нью-Джерси) - для США Восток
   - `iad` (Виргиния) - для США
4. Нажмите **"Create"**

### 1.3 Получение учетных данных

После создания базы данных вы увидите информацию о подключении. Сохраните эти данные - они понадобятся:

```bash
# Пример того, что вы увидите:
turso db shell tickets-wave-db

# Connection URL:
libsql://tickets-wave-db-[username].turso.io

# Auth Token:
ey[...] очень длинный токен
```

**Важно:** Сохраните `DATABASE_URL` и `AUTH_TOKEN` в безопасном месте!

### 1.4 Применение миграций к Turso

Установите Turso CLI (если ещё нет):

```bash
# Windows (PowerShell)
irm https://get.turso/install.ps1 | iex

# macOS/Linux
curl -sSfL https://get.turso/install.sh | bash
```

Авторизуйтесь в Turso:

```bash
turso auth login
```

Примените миграции к удалённой базе данных:

```bash
# Из корня проекта
cd backend

# Установите зависимости
npm install

# Примените миграцию к Turso
# Подставьте ваши реальные значения
npx prisma migrate deploy \
  --name production-setup
```

---

## Шаг 2: Деплой Backend (Render.com)

Render.com - бесплатный хостинг для backend с хорошей интеграцией.

### 2.1 Регистрация на Render

1. Перейдите на https://render.com
2. Нажмите **"Sign Up"**
3. Регистрируйтесь через GitHub (проще всего для деплоя)

### 2.2 Подготовка репозитория

Убедитесь, что ваш код находится на GitHub:

```bash
# Если репозитория нет
git init
git add .
git commit -m "Ready for deploy"

# Создайте репозиторий на GitHub
git remote add origin https://github.com/ВАШ_ЮЗЕРНЕЙМ/tickets-wave-beta.git
git push -u origin master
```

### 2.3 Создание Web Service на Render

1. В дашборде Render нажмите **"New +"** → **"Web Service"**
2. Подключите ваш GitHub репозиторий
3. Настройте сервис:

   **Basic Settings:**
   - **Name**: `tickets-wave-backend`
   - **Region**: выберите ближайший к вам
   - **Branch**: `master`

   **Build & Deploy:**
   - **Runtime**: `Node`
   - **Build Command**:
     ```
     cd backend && npm install && npm run build
     ```
   - **Start Command**:
     ```
     cd backend && npm run start
     ```

   **Environment Variables** (нажмите "Advanced" → "Add Environment Variable"):

   | Ключ | Значение |
   |------|----------|
   | `DATABASE_URL` | Ваш Turso URL (например: `libsql://tickets-wave-db-xxx.turso.io`) |
   | `TURSO_DATABASE_URL` | (то же что DATABASE_URL) |
   | `TURSO_AUTH_TOKEN` | Ваш Auth Token из Turso |
   | `JWT_SECRET` | Случайная строка мин 32 символа (например: `openssl rand -base64 32`) |
   | `PORT` | `3001` |
   | `NODE_ENV` | `production` |
   | `FRONTEND_URL` | URL вашего фронтенда (пока не знаете, оставьте `https://yourfrontend.vercel.app`) |

4. Нажмите **"Create Web Service"**

### 2.4 Получение URL бэкенда

После успешного деплоя Render покажет вам URL:

```
https://tickets-wave-backend.onrender.com
```

**Сохраните этот URL!** Он понадобится для фронтенда.

### 2.5 Проверка работы бэкенда

Откройте в браузере:

```
https://tickets-wave-backend.onrender.com/api/settings
```

Должен вернуть JSON с настройками (или 401, если требует авторизацию - это нормально).

---

## Шаг 3: Деплой Frontend (Vercel)

Vercel - лучший хостинг для React/Vite приложений.

### 3.1 Регистрация на Vercel

1. Перейдите на https://vercel.com
2. Нажмите **"Sign Up"**
3. Регистрируйтесь через GitHub

### 3.2 Создание проекта на Vercel

1. В дашборде нажмите **"Add New..."** → **"Project"**
2. Выберите ваш GitHub репозиторий
3. Настройте проект:

   **Configure Project:**

   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

   **Environment Variables:**

   | Ключ | Значение |
   |------|----------|
   | `VITE_API_URL` | URL вашего бэкенда с `/api` (например: `https://tickets-wave-backend.onrender.com/api`) |

4. Нажмите **"Deploy"**

### 3.3 Получение URL фронтенда

После деплоя Vercel покажет URL:

```
https://tickets-wave-beta.vercel.app
```

### 3.4 Обновление CORS в бэкенде

Теперь, когда у вас есть URL фронтенда, нужно обновить CORS в Render:

1. Вернитесь на Render.com
2. Откройте ваш `tickets-wave-backend` сервис
3. Перейдите в **"Environment"**
4. Найдите переменную `FRONTEND_URL`
5. Замените на ваш реальный URL: `https://tickets-wave-beta.vercel.app`
6. Нажмите **"Save Changes"** (сервис перезапустится автоматически)

---

## Шаг 4: Получение DeepSeek API Key

Для работы AI нужна учётная запись DeepSeek.

### 4.1 Регистрация в DeepSeek

1. Перейдите на https://platform.deepseek.com
2. Нажмите **"Sign Up"** и зарегистрируйтесь
3. Подтвердите email

### 4.2 Создание API ключа

1. После входа нажмите на профиль → **"API Keys"**
2. Нажмите **"Create API Key"**
3. Дайте название (например: `tickets-wave-prod`)
4. Скопируйте ключ (он будет показан только один раз!)

### 4.3 Настройка DeepSeek в бэкенде

Добавьте API ключ в Environment Variables на Render:

| Ключ | Значение |
|------|----------|
| `DEEPSEEK_API_KEY` | `sk-ваш_ключ_от_deepseek` |

**Важно:** Это будет ключ по умолчанию для всех новых пользователей. Пользователи также смогут установить свой ключ через настройки приложения.

---

## Шаг 5: Финальная проверка

### 5.1 Проверка регистрации

1. Откройте ваш фронтенд: `https://tickets-wave-beta.vercel.app`
2. Вы должны автоматически перенаправиться на страницу `/login`
3. Попробуйте зарегистрироваться:
   - Email: `test@example.com`
   - Password: `Test123456!`
4. После регистрации вы должны попасть на Dashboard

### 5.2 Проверка создания билетов

1. Создайте тестовый билет
2. Проверьте, что он сохраняется после перезагрузки страницы

### 5.3 Проверка AI

1. Перейдите в **Settings**
2. Нажмите **"Test Connection"**
3. Должно появиться сообщение: "Connected! Found X models"
4. Перейдите в раздел **AI** и попробуйте задать вопрос

---

## Шаг 6: Настройка доменов (опционально)

Если хотите использовать свои домены:

### Frontend (Vercel)

1. Откройте проект на Vercel
2. Перейдите в **Settings** → **Domains**
3. Добавьте ваш домен (например: `app.tickets-wave.com`)
4. Следуйте инструкциям Vercel для настройки DNS

### Backend (Render)

1. Откройте сервис на Render
2. Перейдите в **Settings** → **Custom Domains**
3. Добавьте домен (например: `api.tickets-wave.com`)
4. Настройте DNS согласно инструкциям Render

После настройки доменов обновите `FRONTEND_URL` в бэкенде и `VITE_API_URL` во фронтенде.

---

## Альтернативные хостинги

Если не хотите использовать Render/Vercel:

### Backend альтернативы:

| Хостинг | Бесплатный тариф | Особенности |
|---------|------------------|-------------|
| **Railway** | 5$/мес после $5 кредита | Простой в использовании |
| **Fly.io** | 3$/мес | Глобальная сеть |
| **Heroku** | Нет (5-7$/мес) | Классический вариант |

### Frontend альтернативы:

| Хостинг | Особенности |
|---------|-------------|
| **Netlify** | Аналог Vercel, отличный CI/CD |
| **Cloudflare Pages** | Очень быстрая CDN |

---

## Мониторинг и логи

### Backend логи (Render)

1. Откройте сервис на Render
2. Перейдите в **"Logs"**
3. Вы увидите все логи приложения в реальном времени

### Frontend логи (Vercel)

1. Откройте проект на Vercel
2. Перейдите в **"Deployments"**
3. Нажмите на последний деплой → **"View Function Logs"**

---

## Обновление приложения

### Как обновить backend:

```bash
# Внесите изменения в код
git add .
git commit -m "Description of changes"
git push
```

Render автоматически обнаружит изменения и перезапустит сервис.

### Как обновить frontend:

```bash
# Внесите изменения в код
git add .
git commit -m "Description of changes"
git push
```

Vercel автоматически задеплоит новую версию.

---

## Стоимость

| Сервис | Бесплатный тариф | Примерная стоимость |
|--------|------------------|---------------------|
| **Turso** | 500 GiB/month | ~0$/мес (бесплатно для малого проекта) |
| **Render** | 750 часов/мес | ~0$/мес (частичный use) |
| **Vercel** | Unlimited | ~0$/мес (для хобби проектов) |
| **DeepSeek** | - | От ~1$/млн токенов |

**Итого:** Базовый функционал может быть полностью бесплатным.

---

## Безопасность

### Обязательно:

1. **JWT_SECRET** - используйте длинную случайную строку
2. **DEEPSEEK_API_KEY** - не коммитьте в git
3. **TURSO_AUTH_TOKEN** - храните только в environment variables

### Рекомендуется:

1. Включите HTTPS (автоматически на Vercel/Render)
2. Ограничьте CORS только для вашего домена
3. Настройте rate limiting для API
4. Регулярно обновляйте зависимости (`npm audit fix`)

---

## Troubleshooting

### Бэкенд не запускается

Проверьте логи на Render. Частые проблемы:

- **DATABASE_URL** неправильный
- **JWT_SECRET** не установлен
- Миграции не применены

### Фронтенд не может подключиться к API

Проверьте:

- `VITE_API_URL` установлен правильно
- `FRONTEND_URL` в бэкенде соответствует вашему домену
- CORS настроен правильно

### AI не работает

Проверьте:

- **DEEPSEEK_API_KEY** установлен в бэкенде
- Ключ активен на platform.deepseek.com
- Лимиты не превышены

### 401 Unauthorized

Очистите localStorage и войдите заново:

```javascript
// В консоли браузера
localStorage.clear()
location.reload()
```

---

## Контакты и поддержка

Если возникнут проблемы:

- **Turso**: https://turso.tech/docs
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **DeepSeek**: https://platform.deepseek.com/docs

---

## Чеклист перед запуском

- [ ] Создана база данных Turso
- [ ] Получены DATABASE_URL и AUTH_TOKEN
- [ ] Применены миграции Prisma
- [ ] Бэкенд задеплоен на Render
- [ ] Получен URL бэкенда
- [ ] Создан API ключ DeepSeek
- [ ] Фронтенд задеплоен на Vercel
- [ ] Получен URL фронтенда
- [ ] CORS настроен правильно
- [ ] Проверена регистрация пользователя
- [ ] Проверено создание билетов
- [ ] Проверена работа AI

---

## Следующие шаги

После успешного деплоя вы можете:

1. **Добавить платёжную систему** (Stripe) для подписок
2. **Настроить email уведомления** (SendGrid, Mailgun)
3. **Добавить аналитику** (PostHog, Plausible)
4. **Улучшить дизайн** под ваш бренд
5. **Добавить больше AI функций**

Удачи с вашим SaaS! 🚀
