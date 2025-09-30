# 18 — Deployment & Environment Setup Guide

## Prerequisites

### Required Services
- **Database**: Existing MantisBT 2.x MySQL server (accessible from deployment environment)
- **Node.js**: v18.17+ or v20.0+
- **Package Manager**: pnpm 8.0+ (recommended) or npm 10.0+

### External Services (Optional but Recommended)
- **OpenRouter**: AI assistant integration (API key required)
- **Postmark**: Email notifications (server token required)
- **Pushover**: Mobile push notifications (API token + user key)
- **Rocket.Chat**: Team chat integration (incoming webhook URL)
- **Microsoft Teams**: Team notifications (incoming webhook URL)
- **Web Push**: Browser notifications (VAPID keys)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone repository
git clone https://github.com/btafoya/nextbt.git
cd nextbt

# Install dependencies
pnpm install
```

### 2. Configure Secrets

```bash
# Copy example config
cp config/secrets.example.ts config/secrets.ts
```

Edit `config/secrets.ts`:

```typescript
export const secrets = {
  // REQUIRED: Database connection
  databaseUrl: "mysql://username:password@host:3306/mantis_db",

  // REQUIRED: OpenRouter for AI features
  openrouterApiKey: "sk-or-v1-your-key-here",
  openrouterBaseUrl: "https://openrouter.ai/api/v1",
  openrouterModel: "openai/gpt-4o-mini",

  // OPTIONAL: Email notifications
  postmarkServerToken: "your-postmark-token",
  fromEmail: "noreply@yourdomain.com",

  // OPTIONAL: Mobile notifications
  pushoverUserKey: "your-user-key",
  pushoverApiToken: "your-app-token",

  // OPTIONAL: Team integrations
  rocketchatWebhookUrl: "https://chat.yourdomain.com/hooks/xxx",
  teamsWebhookUrl: "https://outlook.office.com/webhook/xxx",

  // OPTIONAL: Web push notifications
  vapidPublicKey: "BM...",
  vapidPrivateKey: "x...",
  vapidSubject: "mailto:admin@yourdomain.com"
} as const;
```

### 3. Database Setup

#### Option A: Introspect Existing MantisBT Schema

```bash
# Set DATABASE_URL temporarily for Prisma CLI
export DATABASE_URL="mysql://username:password@host:3306/mantis_db"

# Pull existing schema
pnpm dlx prisma db pull

# Generate Prisma client
pnpm dlx prisma generate
```

#### Option B: Use Provided Schema

The repository includes a pre-mapped Prisma schema in `prisma/schema.prisma`. Just generate the client:

```bash
export DATABASE_URL="mysql://username:password@host:3306/mantis_db"
pnpm dlx prisma generate
```

#### Create SQL Views (Optional but Recommended)

```bash
# If you have SQL views in /db/sql/views/, apply them
mysql -u username -p mantis_db < db/sql/views/v_issue_detail.sql
mysql -u username -p mantis_db < db/sql/views/v_user_projects.sql
```

### 4. Start Development Server

```bash
pnpm dev
```

Application will be available at `http://localhost:3000`

### 5. Test Authentication

1. Navigate to `http://localhost:3000`
2. Click "Login" (will redirect to `/login`)
3. Use existing MantisBT credentials
4. Should redirect to dashboard on success

## Production Deployment Options

### Option 1: Vercel (Recommended for Quick Setup)

#### Prerequisites
- Vercel account (free tier available)
- GitHub repository connected to Vercel

#### Steps

1. **Import Project to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Deploy
   vercel
   ```

2. **Configure Environment Variables**

   In Vercel Dashboard → Project Settings → Environment Variables:

   ```
   DATABASE_URL=mysql://user:pass@host:3306/mantis
   NODE_ENV=production
   ```

3. **Set Build Settings**
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

4. **Deploy**
   ```bash
   vercel --prod
   ```

#### Important Notes for Vercel
- Database must be accessible from Vercel's IP ranges
- Consider using connection pooling (PlanetScale, Supabase, or MySQL Proxy)
- Secrets in `/config/secrets.ts` are baked into the build
- For truly environment-specific secrets, use Vercel environment variables

### Option 2: Docker (Self-Hosted)

#### Create Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy secrets (or use env vars)
COPY config/secrets.ts ./config/

# Generate Prisma client
ENV DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/mantis"
RUN pnpm dlx prisma generate

# Build Next.js
RUN pnpm build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  nextbt:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://user:pass@mysql:3306/mantis
    depends_on:
      - mysql
    restart: unless-stopped

  # Optional: Include MySQL if not using existing server
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: mantis
      MYSQL_USER: mantisuser
      MYSQL_PASSWORD: mantispass
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
```

#### Build and Run

```bash
# Build image
docker build -t nextbt:latest .

# Run with docker-compose
docker-compose up -d

# Or run standalone
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/mantis" \
  --name nextbt \
  nextbt:latest
```

### Option 3: Traditional VPS (Ubuntu/Debian)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2
```

#### 2. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/btafoya/nextbt.git
cd nextbt

# Install dependencies
pnpm install

# Copy and configure secrets
cp config/secrets.example.ts config/secrets.ts
nano config/secrets.ts

# Generate Prisma client
export DATABASE_URL="mysql://user:pass@host:3306/mantis"
pnpm dlx prisma generate

# Build application
pnpm build
```

#### 3. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'nextbt',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 4. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/nextbt
server {
    listen 80;
    server_name nextbt.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/nextbt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d nextbt.yourdomain.com

# Auto-renewal is configured by default
sudo certbot renew --dry-run
```

## Environment-Specific Configuration

### Development
```typescript
// config/app.config.ts
export const appConfig = {
  appName: "NextBT Dev",
  requirePrivateNotesRole: false,
  defaultPageSize: 20,
  enableDebugLogging: true
} as const;
```

### Production
```typescript
// config/app.config.ts
export const appConfig = {
  appName: "NextBT",
  requirePrivateNotesRole: true,
  defaultPageSize: 50,
  enableDebugLogging: false
} as const;
```

## Database Connection Optimization

### Connection Pooling

For production, configure Prisma connection pooling:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")

  // Add connection pool settings
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
  relationMode = "prisma"
}

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}
```

Update database URL to include connection pool parameters:

```typescript
databaseUrl: "mysql://user:pass@host:3306/mantis?connection_limit=10&pool_timeout=20"
```

### Read Replicas (Advanced)

For high-traffic deployments, consider read replicas:

```typescript
// db/client.ts
import { PrismaClient } from "@prisma/client";

const prismaRead = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_READ_URL }
  }
});

const prismaWrite = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }
  }
});

export const prisma = {
  // Use read replica for queries
  ...prismaRead,

  // Use primary for writes
  $transaction: prismaWrite.$transaction.bind(prismaWrite)
};
```

## Monitoring & Health Checks

### Health Check Endpoint

Create `/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected"
    });
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message
    }, { status: 503 });
  }
}
```

### PM2 Monitoring

```bash
# View logs
pm2 logs nextbt

# Monitor metrics
pm2 monit

# View dashboard
pm2 web
```

### Application Monitoring (Optional)

Consider integrating:
- **Sentry**: Error tracking
- **Datadog**: Performance monitoring
- **New Relic**: APM
- **Prometheus + Grafana**: Custom metrics

## Backup Strategy

### Database Backups

```bash
#!/bin/bash
# backup-mantis.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mantis"
DB_NAME="mantis"
DB_USER="mantisuser"
DB_PASS="mantispass"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME \
  | gzip > $BACKUP_DIR/mantis_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "mantis_*.sql.gz" -mtime +7 -delete
```

Add to cron:
```bash
0 2 * * * /usr/local/bin/backup-mantis.sh
```

### Application State Backups

```bash
# Backup user uploads (if stored locally)
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads

# Backup config (secrets excluded)
tar --exclude=config/secrets.ts -czf config_backup_$(date +%Y%m%d).tar.gz config/
```

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Nginx, HAProxy, or cloud LB
2. **Session Storage**: Move to Redis/Memcached for shared sessions
3. **File Storage**: Use S3/CDN for uploads instead of local filesystem
4. **Database**: Read replicas + connection pooling

### Vertical Scaling

- **CPU**: 2+ cores for production
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 20GB+ for application, separate disk for MySQL

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Secrets not committed to git
- [ ] Database user has minimal required permissions
- [ ] Firewall configured (only 80/443 exposed)
- [ ] Regular security updates applied
- [ ] Rate limiting configured (consider Nginx limit_req)
- [ ] CORS properly configured
- [ ] Session cookies use Secure, HttpOnly, SameSite flags
- [ ] SQL injection protection via Prisma parameterized queries
- [ ] XSS protection via React's built-in escaping
- [ ] CSRF protection via SameSite cookies

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs nextbt --lines 100

# Common issues:
# 1. Database connection
pnpm dlx prisma db pull  # Test connection

# 2. Missing Prisma client
pnpm dlx prisma generate

# 3. Port already in use
sudo lsof -i :3000
```

### Database Connection Issues

```typescript
// Test connection
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] })

async function main() {
  const result = await prisma.$queryRaw`SELECT 1 as connected`
  console.log('Connected:', result)
}

main()
```

### Performance Issues

```bash
# Check Next.js build analysis
pnpm build
# Review .next/analyze output

# Check database query performance
# Enable Prisma query logging in db/client.ts
log: ['query', 'info', 'warn', 'error']
```

## Maintenance

### Updates

```bash
# Update dependencies
pnpm update

# Update Prisma
pnpm dlx prisma migrate dev  # Dev only
pnpm dlx prisma generate

# Rebuild application
pnpm build

# Restart
pm2 restart nextbt
```

### Database Migrations

```bash
# Create migration (development)
pnpm dlx prisma migrate dev --name add_new_field

# Apply migration (production)
pnpm dlx prisma migrate deploy
```

**Note**: Since NextBT operates on existing MantisBT schema, avoid destructive migrations. Use SQL views for schema compatibility instead.