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

## Деплой в интернет — бесплатно (Neon + Render + Vercel)

Всё бесплатно, без своего сервера и без банковской карты. Вход во все сервисы — через GitHub.

> Минус бесплатного бэкенда на Render: после ~15 минут простоя он «засыпает»,
> и первый запрос потом грузится ~30 секунд. Дальше быстро.

### Шаг 0. Залить код на GitHub

Создай репозиторий на github.com и запушь проект:

```bash
git init
git add .
git commit -m "system app"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/НАЗВАНИЕ.git
git push -u origin main
```

### Шаг 1. База данных — Neon

1. Зайди на **neon.tech** → Sign up with GitHub.
2. Create project (имя любое, регион — ближайший).
3. На экране **Connection string** скопируй строку вида
   `postgresql://...@...neon.tech/...?sslmode=require`. Сохрани её — это `DATABASE_URL`.

### Шаг 2. Бэкенд — Render

1. Зайди на **render.com** → Sign up with GitHub.
2. **New → Blueprint** → выбери свой GitHub-репозиторий.
   Render прочитает `render.yaml` и создаст сервис `system-api` сам.
3. В разделе **Environment** добавь переменную `DATABASE_URL` =
   строка из Neon (шаг 1). `JWT_SECRET` Render сгенерит сам.
4. Нажми **Apply / Deploy**. Дождись статуса **Live**.
5. Скопируй адрес сервиса вида `https://system-api-xxxx.onrender.com` — это адрес API.

Проверка: открой `https://system-api-xxxx.onrender.com/feed` — должно вернуть
`{"statusCode":401,...}` (это норма: значит сервер жив, просто нужен токен).

### Шаг 3. Фронтенд — Vercel

1. Зайди на **vercel.com** → Sign up with GitHub.
2. **Add New → Project** → выбери тот же репозиторий. Framework определится как **Vite**.
3. В **Environment Variables** добавь:
   `VITE_API_URL` = адрес API из шага 2 (например `https://system-api-xxxx.onrender.com`).
4. **Deploy**. Через минуту получишь адрес вида `https://твой-проект.vercel.app` — это и есть сайт.

Готово — открывай ссылку Vercel, регистрируйся и пользуйся. Любой `git push` в `main`
будет автоматически пересобирать и фронт (Vercel), и бэкенд (Render).

### Если что-то не работает

- **Ошибки сети / не логинит** → проверь, что `VITE_API_URL` на Vercel = реальный адрес Render
  (без `/` в конце), и пересобери проект на Vercel (Redeploy).
- **Бэкенд падает при старте** → почти всегда неверный `DATABASE_URL`. Проверь строку из Neon.
- **Первый заход долгий** → бэкенд просыпался после простоя, это норма для free-плана.

## Стек данных в игре

- **Квесты** — ежедневные/еженедельные, дают XP в категории.
- **5 характеристик** — Спорт, Деньги, Социум, Отношения, Интеллект (уровни от XP).
- **Достижения** → награда снаряжением; **инвентарь** с экипировкой влияет на статы.
- **Ранг Охотника** E → SSS, общий Power.
- **Прогресс** — метрики тела и упражнения с графиками.
- **Карта идей** — узлы + стрелки, зум (колесо/щипок), панорама.
- **Журнал** — дневник дня (оценка, сон-будильник, добавки, заметки).
