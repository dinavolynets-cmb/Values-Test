# Curly Values Test

Тест на цінності за Spiral Dynamics з оплатою через Monobank.

## Структура

```
curly-values/
├── api/
│   ├── anthropic.js     ← проксі до Claude API
│   ├── payment.js       ← створює інвойс у Monobank
│   └── verify.js        ← перевіряє статус оплати + логує в Google Sheets
├── public/
│   └── index.html       ← весь фронтенд
├── package.json
├── vercel.json
└── README.md
```

## Environment Variables (Vercel → Settings → Environment Variables)

| Назва                | Призначення                              |
| -------------------- | ---------------------------------------- |
| `ANTHROPIC_API_KEY`  | ключ для генерації розшифровки           |
| `MONOBANK_TOKEN`     | токен Monobank еквайрингу                |
| `SHEETS_WEBHOOK_URL` | URL Google Apps Script для логування     |

## Ціна

229 грн. Задається в `api/payment.js` (`amount: 22900` копійок).

## Як це працює

1. Людина проходить тест → бачить профіль (стовпчики) і вводить email
2. Натискає "Отримати розшифровку 229 грн" → `api/payment.js` створює інвойс у Monobank
3. Перенаправляється на сторінку оплати Monobank
4. Після оплати повертається на сайт з `?paid=1&order=...`
5. `api/verify.js` перевіряє статус через Monobank API
6. Якщо оплата успішна — генерується розшифровка через Claude
7. Усе логується в Google Sheets

## Контакти

@curlymanagementbureau
