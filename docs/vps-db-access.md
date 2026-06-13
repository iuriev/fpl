# VPS & Database Access

## Server

- **IP:** `134.209.229.85`
- **User:** `root`
- **SSH key:** `~/.ssh/id_rsa`

## SSH подключение

```bash
ssh root@134.209.229.85
```

Или через алиас (настроен в `~/.ssh/config`):

```bash
ssh fpl-prod
```

## Проект на сервере

Всё лежит в `/opt/fpl`. Сервисы запущены через Docker Compose:

```bash
cd /opt/fpl
docker compose ps        # статус сервисов
docker compose logs -f proxy   # логи Node.js бэкенда
```

Три сервиса:
- `caddy` — веб-сервер (80/443)
- `proxy` — Node.js бэкенд (порт 3000)
- `db` — PostgreSQL (порт 5432, доступен только внутри VPS как 127.0.0.1:5432)

## Подключение к БД через TablePlus

### Разовый туннель (в отдельном терминале)

```bash
ssh -L 5432:localhost:5432 root@134.209.229.85 -N
```

Оставить висеть, затем подключаться в TablePlus.

### Настройки TablePlus

| Поле | Значение |
|------|----------|
| Host/Socket | `localhost` |
| Port | `5432` |
| User | `fpl-admin` |
| Password | см. `/opt/fpl/.env` → `POSTGRES_PASSWORD` |
| Database | `fpl` |
| Over SSH | выключено (туннель поднят вручную) |

### Найти пароль БД

```bash
ssh root@134.209.229.85 "grep POSTGRES_PASSWORD /opt/fpl/.env"
```

## Полезные команды на сервере

```bash
# Обновить subscription_tier пользователя
docker compose exec -T db psql -U fpl-admin -d fpl -c \
  "UPDATE \"user\" SET subscription_tier = 'premium' WHERE email = 'your@email.com'"

# Перезапустить сервисы после изменений
docker compose up -d --force-recreate proxy caddy

# Перезапустить только БД (например после правки docker-compose.yml)
docker compose up -d --force-recreate db
```

## Деплой

Деплой происходит автоматически через GitHub Actions при push в `master`.
Ручной запуск — кнопка **Run workflow** в GitHub → Actions → Deploy.
