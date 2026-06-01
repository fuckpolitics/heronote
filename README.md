# SYSTEM · Путь Охотника

Геймифицированный трекер привычек и целей в стиле аниме (Solo Leveling / Blue Lock):
квесты, характеристики, снаряжение, инвентарь, метрики тела и карта идей.

- **Фронтенд**: React 19 + Vite + TypeScript + Tailwind v4
- **Бэкенд**: NestJS + Prisma (`server/`)
- **БД**: PostgreSQL (бесплатно на Neon)
- **Авторизация**: email + пароль (bcrypt) → JWT, данные хранятся на сервере по аккаунтам

## Структура

```
.            ← фронтенд (Vite)
server/      ← бэкенд (NestJS + Prisma)
```

## Запуск локально

Нужны два процесса: API и фронт.

### 1. Бэкенд

Нужна строка подключения к Postgres — проще всего бесплатно создать на [Neon](https://neon.tech)
(см. раздел «Деплой»). Её же можно использовать локально.

```bash
cd server
cp .env.example .env          # вставь свой DATABASE_URL из Neon
npm install                    # postinstall сам сгенерит Prisma Client
npm run db:push                # создаёт таблицы в БД
npm run dev                    # http://localhost:3000  (или: npm run build && npm start)
```

### 2. Фронтенд

```bash
npm install
npm run dev                    # http://localhost:5173
# для доступа с телефона по локальной сети:
npm run host                   # покажет адрес вида http://192.168.x.x:5173
```

`VITE_API_URL` можно не задавать: фронт сам обращается к API по текущему хосту на порту `3000`
(работает и на localhost, и по локальной сети). Чтобы переопределить — создай `.env`
(см. `.env.example`).

> Важно для доступа с телефона: и фронт, и бэкенд должны слушать на `0.0.0.0`
> (бэкенд уже так настроен, фронт — через `npm run host`). На телефоне открывай
> `http://<ip-компа>:5173`, а API сам подставит `http://<ip-компа>:3000`.

## API

| Метод | Путь             | Описание                                  |
|-------|------------------|-------------------------------------------|
| POST  | `/auth/register` | `{email, password, name}` → `{token, user}` |
| POST  | `/auth/login`    | `{email, password}` → `{token, user}`     |
| GET   | `/auth/me`       | текущий пользователь (Bearer)             |
| PATCH | `/auth/me`       | `{name?, avatar?}` → обновить профиль (Bearer) |
| GET   | `/state`         | `{data: AppState | null}` (Bearer)        |
| PUT   | `/state`         | `{state: AppState}` → сохранить (Bearer)  |
| GET   | `/feed?limit=`   | общая лента событий всех пользователей (Bearer) |
| POST  | `/feed`          | `{type, title, detail?, icon?, color?}` (Bearer) |

Всё состояние приложения хранится как один JSON-документ на пользователя
(таблица `State`). Фронтенд работает через абстракцию `Repository`
(`src/lib/repo.ts` / `src/lib/api.ts`) — поэтому смена localStorage ↔ API
не затрагивает UI.

## Деплой в интернет — бесплатно, БЕЗ банковской карты (Neon + Vercel)

Всё бесплатно и без карты. Делаем **две отдельные привязки на Vercel** из одного репозитория:
бэкенд (папка `server/`, работает как serverless-функция) и фронтенд (корень репозитория).
База — Neon. Вход во все сервисы — через GitHub.

### Шаг 1. База данных — Neon

1. **neon.tech** → Sign up with GitHub → Create project.
2. Скопируй **Connection string** — строку вида
   `postgresql://...@...neon.tech/neondb?sslmode=require`. Это `DATABASE_URL`
   (используй **прямой** host, без `-pooler`).

### Шаг 2. Бэкенд (API) — Vercel, проект №1

1. **vercel.com** → Add New → **Project** → выбери репозиторий `heronote`.
2. **Root Directory** → нажми Edit и выбери папку **`server`**. Framework: **Other**.
3. **Environment Variables** добавь:
   - `DATABASE_URL` = строка из Neon (шаг 1)
   - `JWT_SECRET` = любая длинная случайная строка
   - `CORS_ORIGIN` = `*`
4. **Deploy**. Получишь адрес вида `https://heronote-api.vercel.app`.

Проверка: открой `https://heronote-api.vercel.app/feed` — ответ `{"statusCode":401,...}`
означает, что API работает (просто нужен токен).

### Шаг 3. Фронтенд — Vercel, проект №2

1. Снова Add New → **Project** → тот же репозиторий `heronote`.
2. **Root Directory** оставь корнем репозитория. Framework определится как **Vite**.
3. **Environment Variables** → `VITE_API_URL` = адрес API из шага 2
   (например `https://heronote-api.vercel.app`, **без** `/` в конце).
4. **Deploy** → получишь адрес сайта `https://heronote.vercel.app`.

Готово. Любой `git push` в `main` автоматически пересобирает оба проекта.

### Если что-то не работает

- **Не логинит / ошибки сети** → проверь `VITE_API_URL` (точный адрес API, без `/` в конце),
  затем Redeploy фронтенда.
- **API отвечает 500** → почти всегда неверный `DATABASE_URL`. Проверь строку из Neon
  (должна заканчиваться на `?sslmode=require`).
- **Таблиц нет в базе** → они создаются на этапе сборки бэкенда (`prisma db push`).
  Передеплой проект №1 (Redeploy) после того, как задан правильный `DATABASE_URL`.

## Стек данных в игре

- **Квесты** — ежедневные/еженедельные, дают XP в категории.
- **5 характеристик** — Спорт, Деньги, Социум, Отношения, Интеллект (уровни от XP).
- **Достижения** → награда снаряжением; **инвентарь** с экипировкой влияет на статы.
- **Ранг Охотника** E → SSS, общий Power.
- **Прогресс** — метрики тела и упражнения с графиками.
- **Карта идей** — узлы + стрелки, зум (колесо/щипок), панорама.
- **Журнал** — дневник дня (оценка, сон-будильник, добавки, заметки).
