# Обработка ошибок подключения к базе данных

## Обзор

В проект добавлена полная обработка ошибок подключения к PostgreSQL базе данных с визуальным UI предупреждением.

## Что было реализовано

### 1. Серверная обработка (Backend)

**Файл:** `lib/db-error-handler.ts`

Утилита для обработки ошибок Prisma:
- `isDatabaseConnectionError()` - определяет ошибки подключения к БД
- `handleDatabaseError()` - возвращает структурированный ответ

Поддерживаемые коды ошибок Prisma:
- `P1001` - Can't reach database server
- `P1002` - Database server timed out
- `P1008` - Operations timed out
- `P1017` - Server has closed the connection

### 2. UI компонент предупреждения

**Файл:** `components/DatabaseErrorAlert.tsx`

Красный alert-баннер с:
- Сообщением "База данных не запущена!"
- Информацией о БД адресе (`localhost:5432`)
- Инструкциями по запуску:
  ```bash
  docker-compose up -d postgres
  # или
  make db-start
  ```
- Кнопкой закрытия

### 3. Обновленные API routes

Все API endpoints обновлены с использованием `handleDatabaseError()`:

**Packages:**
- `/api/packages` (GET, POST)
- `/api/packages/[id]` (GET, PUT, DELETE)

**Users:**
- `/api/users` (GET)
- `/api/users/[id]/settings` (GET, PUT)

**Admin:**
- `/api/admin-users` (GET, POST)
- `/api/admin-users/[id]` (PUT, DELETE)

**Analytics:**
- `/api/analytics` (GET)
- `/api/transactions` (GET)
- `/api/generations` (GET)

### 4. Обновленные страницы

Все страницы обновлены для отображения предупреждения:

- `app/page.tsx` - Packages
- `app/users/page.tsx` - Users
- `app/admin-users/page.tsx` - Admin Users
- `app/transactions/page.tsx` - Transactions
- `app/generations/page.tsx` - Generations
- `app/analytics/page.tsx` - Analytics

## Как это работает

### Схема работы:

1. **БД недоступна** → Prisma выбрасывает ошибку
2. **API route** → `handleDatabaseError()` обрабатывает ошибку
3. **Response** → `{error: "База данных не запущена!", isDatabaseDown: true, status: 503}`
4. **Frontend** → Проверяет `res.status === 503 && data.isDatabaseDown`
5. **UI** → Показывает `DatabaseErrorAlert` компонент

### Пример кода (Frontend):

```typescript
const fetchData = async () => {
  try {
    const res = await fetch('/api/packages');
    const data = await res.json();

    if (res.status === 503 && data.isDatabaseDown) {
      setDatabaseError(true);
      setPackages([]);
    } else {
      setDatabaseError(false);
      setPackages(data);
    }
  } catch (error) {
    console.error('Error:', error);
    setDatabaseError(true);
  }
};
```

### Пример кода (Backend):

```typescript
import { handleDatabaseError } from '@/lib/db-error-handler';

export async function GET() {
  try {
    const data = await prisma.model.findMany();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    const errorResponse = handleDatabaseError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.status });
  }
}
```

## Тестирование

Для проверки работы:

1. Остановите PostgreSQL:
   ```bash
   docker-compose stop postgres
   ```

2. Откройте любую страницу в bananabot-admin

3. Вы увидите красный alert с сообщением "База данных не запущена!"

4. Запустите PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

5. Обновите страницу - все должно работать

## Защищенные операции

Все CRUD операции защищены:
- ✅ GET (чтение данных)
- ✅ POST (создание)
- ✅ PUT (обновление)
- ✅ DELETE (удаление)

При любой операции с недоступной БД пользователь увидит предупреждение.
