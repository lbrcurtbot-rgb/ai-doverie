
# AI-ДОВЕРИЕ — Полный стек (Frontend + Backend)

## Быстрый старт (локально с Docker Compose)
```bash
docker compose up --build
# фронт: http://localhost:8080
# api:   http://localhost:8000/api
```

## Развёртывание на Render
- Создайте **Web Service** для backend из папки `backend` (Python, start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`).
- Создайте **Static Site** или **Web Service (Docker)** для frontend из папки `frontend`. Если Docker — используйте Dockerfile из `frontend/`.
- Самое главное: **НЕ** указывать API_BASE на внешний URL. Оставьте относительный `/api` и настройте nginx (см. `frontend/nginx.conf`) чтобы проксировать `/api` на backend. Это исключит ошибку 508 Loop Detected.

## Что работает
- Загрузка файлов: .xls/.xlsx/.csv/.pdf/.doc/.docx
- Унификация в единую Excel-форму и скачивание
- Категоризация (правила по ключевым словам; можно заменить на LLM через OpenAI в backend)
- Дашборд (категории, динамика по датам)
- Генерация планов действий по категориям (DOCX и PDF для скачивания)

## Переменные
- `EXPORT_DIR` — папка для экспорта (по умолчанию `/data/exports` в контейнере backend).

## Замечания
- Для продвинутой классификации и геокодирования подключите LLM и геокодер (Яндекс/2ГИС) в `backend/app.py`.
- 508 Loop Detected ранее возникала из-за проксирования `/api` на тот же домен/роут, что ведёт на nginx фронтенда. Используйте прокси на **backend:8000** в docker или на отдельный Render-сервис.
