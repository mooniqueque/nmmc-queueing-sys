# nmmcqueue-backend

## Setup

```bash
pnpm install
```

```create .env
DATABASE_URL="mysql://root:[PASSWORD]:3306/nmmcqueueing"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:3001"
BETTER_AUTH_SECRET="52116161asahwahajmKGMSKAGKA521521ADRWFSA51616009"
BETTER_AUTH_URL="http://localhost:3001/api/auth"
```

## Run

```bash
pnpm dev
```

```bash
npm i --save-dev @types/node 
```

```
pnpm i -D tsx
tsx prisma/seed.ts
```

```bash
pnpm dlx prisma db push
```

```bash
pnpm dlx tsx prisma/seed.ts
```

```bash
pnpm dlx prisma generate
```

```bash
pnpm dlx prisma db seed
```

# nmmcqueue-frontend

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm dev
```
