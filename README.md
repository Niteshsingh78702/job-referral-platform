# Job Referral & Pre-Screening Platform

A production-ready NestJS backend for a job referral platform where candidates pay only after passing tests and getting confirmed referrals.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run start:dev
```

### Using Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

## 📁 Project Structure

```
src/
├── common/
│   ├── constants/       # Enums, constants
│   ├── decorators/      # Custom decorators (@Roles, @CurrentUser, @Public)
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards (JWT, Roles)
│   └── interceptors/    # Transform, Audit log
├── config/              # Configuration files
├── modules/
│   ├── auth/            # JWT, OTP, Token management
│   ├── candidate/       # Profile, skills, applications
│   ├── job/             # Job CRUD, search, apply
│   ├── test/            # Test engine with Redis timer
│   ├── payment/         # Razorpay integration
│   ├── referral/        # Referral state machine
│   └── admin/           # Full admin control
└── prisma/              # Database service
```

## 🔐 API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| POST | `/send-otp` | Send OTP to email |
| POST | `/verify-otp` | Verify OTP |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout |
| GET | `/me` | Get current user |

### Jobs (`/api/v1/jobs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List active jobs (public) |
| GET | `/:id` | Get job details (public) |
| POST | `/` | Create job (HR/Admin) |
| POST | `/:id/apply` | Apply for job (Candidate) |

### Tests (`/api/v1/tests`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/application/:id/start` | Start test session |
| GET | `/session/:id` | Get test questions |
| POST | `/session/:id/answer` | Submit answer |
| POST | `/session/:id/submit` | Submit test |
| POST | `/session/:id/event` | Log test event (anti-cheat) |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-order` | Create Razorpay order |
| POST | `/verify` | Verify payment signature |
| POST | `/webhook` | Razorpay webhook |
| POST | `/refund/request` | Request refund |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard metrics |
| GET | `/users` | List all users |
| PATCH | `/users/:id/block` | Block user |
| GET | `/hr/pending` | Pending HR approvals |
| POST | `/hr/:id/approve` | Approve HR |
| POST | `/jobs/:id/approve` | Approve job |
| GET | `/refunds/pending` | Pending refunds |
| POST | `/refunds/:id/approve` | Approve refund |

## 💳 Payment Flow

```
1. Candidate passes test
2. HR/Employee confirms referral availability
3. Candidate creates payment order
4. Candidate completes Razorpay payment
5. Webhook confirms payment
6. Contact unlocked
```

## 🛡️ Security Features

- JWT + Refresh tokens
- Role-based access control
- Rate limiting (100 req/min)
- Webhook signature verification
- Audit logging for all mutations
- Server-side test timer (no client trust)

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

## 📜 License

MIT License
