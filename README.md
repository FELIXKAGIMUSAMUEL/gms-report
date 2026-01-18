# GMS Report - Global Mission Statistics

A comprehensive web application for managing and visualizing mission statistics including baptisms, tithes, membership counts, and Sabbath School attendance data from 2020-2026.

## Features

- **Secure Authentication**: NextAuth.js-based authentication system
- **Interactive Dashboard**: Real-time KPIs with trend indicators
- **Data Visualization**: Interactive charts using Recharts
- **Quarterly Reports**: Create and update quarterly mission statistics
- **Historical Data**: View trends from 2020 to 2026
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14.2.35 (App Router) - Latest security patches applied
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Validation**: Zod

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or later
- PostgreSQL 12.x or later
- npm or yarn package manager

## Getting Started with VS Code

**New to this project?** See [VSCODE_SETUP.md](VSCODE_SETUP.md) for detailed instructions on:
- How to clone this repository and checkout the pull request branch
- Setting up the project in VS Code
- Installing recommended VS Code extensions
- Troubleshooting common setup issues

Quick start:
```bash
git clone https://github.com/mayegamustafa/gms-report.git
cd gms-report
git checkout copilot/build-gms-report-application
code .  # Opens in VS Code
```

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/mayegamustafa/gms-report.git
cd gms-report
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/gms_report?schema=public"

# NextAuth - Generate a secure secret
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

To generate a secure `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed the database with sample data
npm run db:seed
```

This will create:
- A default admin user (email: `admin@gms.com`, password: `admin123`)
- Historical data from 2020 to 2026 with realistic statistics

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Default Login Credentials

After seeding the database, you can log in with:

- **Email**: `admin@gms.com`
- **Password**: `admin123`

**⚠️ Important**: Change these credentials in production!

## Testing the Application

For a comprehensive testing guide, see [TESTING.md](TESTING.md) which includes:
- Step-by-step setup verification
- Manual testing checklist for all features
- API endpoint testing
- Responsive design testing
- Common issues and troubleshooting
- Success criteria checklist

Quick test:
1. Run `npm run dev`
2. Open http://localhost:3000
3. Login with `admin@gms.com` / `admin123`
4. Verify dashboard loads with KPIs, charts, and data table

## Project Structure

```
gms-report/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/      # NextAuth configuration
│   │   │   ├── reports/   # Reports API endpoints
│   │   │   └── historical/ # Historical data API
│   │   ├── dashboard/     # Dashboard page
│   │   ├── login/         # Login page
│   │   ├── update-report/ # Update report page
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Home page
│   │   ├── providers.tsx  # Session provider
│   │   └── globals.css    # Global styles
│   ├── components/
│   │   └── dashboard/     # Dashboard components
│   │       ├── KPICard.tsx
│   │       ├── TrendsChart.tsx
│   │       └── QuarterlyTable.tsx
│   └── types/
│       └── next-auth.d.ts # NextAuth type definitions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.example
```

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports?year=2024&quarter=1` - Get specific report
- `POST /api/reports` - Create or update a report
- `GET /api/reports/[id]` - Get report by ID
- `DELETE /api/reports/[id]` - Delete a report

### Historical Data
- `GET /api/historical?groupBy=quarter` - Get quarterly data
- `GET /api/historical?groupBy=year` - Get yearly aggregated data
- `GET /api/historical?startYear=2020&endYear=2026` - Filter by year range

## Database Schema

### User Model
- `id`: Unique identifier
- `email`: User email (unique)
- `password`: Hashed password
- `name`: User name (optional)

### Report Model
- `id`: Unique identifier
- `year`: Report year
- `quarter`: Report quarter (1-4)
- `baptisms`: Number of baptisms
- `professionOfFaith`: Number of professions of faith
- `tithes`: Tithe amount
- `combinedOfferings`: Combined offerings amount
- `membership`: Total membership count
- `sabbathSchoolAttendance`: Sabbath School attendance count

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Open Prisma Studio (Database GUI)
npx prisma studio

# Reset database
npx prisma migrate reset

# Seed database
npm run db:seed
```

## Development

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Features Overview

### Dashboard
- Real-time KPI cards showing current statistics
- Trend indicators comparing current vs. previous quarter
- Interactive line charts for historical trends
- Quarterly data table with comprehensive statistics

### Update Report
- Form to create or update quarterly reports
- Validation for all input fields
- Auto-load existing report data
- Success/error notifications

### Authentication
- Secure credential-based authentication
- Protected routes and API endpoints
- Session management with NextAuth.js

## Security

- Passwords are hashed using bcryptjs
- API routes are protected with session checks
- Environment variables for sensitive data
- SQL injection protection via Prisma ORM
- Input validation using Zod

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Verify PostgreSQL is running:
```bash
sudo service postgresql status
```

2. Check your DATABASE_URL in `.env`
3. Ensure the database exists:
```bash
psql -U postgres
CREATE DATABASE gms_report;
```

### Prisma Client Issues

If Prisma Client is not generated:

```bash
npx prisma generate
```

### Build Errors

Clear Next.js cache:

```bash
rm -rf .next
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Built with Next.js 14
- Database management with Prisma
- Authentication powered by NextAuth.js
- Charts by Recharts
- Styled with Tailwind CSS
