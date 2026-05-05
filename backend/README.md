# CRM HUB Backend

Education CRM Backend API built with Express.js and Prisma

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm start
```

## Environment Variables

Create a `.env` file based on `.env.example` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing
- `REDIS_URL` - Redis connection string
- `WEBHOOK_API_KEY` - API key for webhooks

## Running

- **Development**: `npm run dev` (with nodemon)
- **Production**: `npm start`

## API Routes

- **Auth**: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`
- **Leads**: `/api/leads` (CRUD, assign, bulk-import)
- **Tasks**: `/api/tasks` (my-tasks, create, complete)
- **Scoring**: `/api/score-rules` (CRUD)
- **Dashboard**: `/api/dashboard/stats`, `/api/dashboard/hot-leads`
- **Webhooks**: `/api/webhooks/activity` (public, requires API key)

## Default Credentials

- Email: `admin@demo.edu`
- Password: `Demo@1234`
