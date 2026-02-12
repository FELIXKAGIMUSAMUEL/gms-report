#!/bin/bash

# GMS Report System - Pre-Deployment Checklist
# Copyright (c) 2026 Mustafa - Sir Apollo Kaggwa Schools

echo "================================================"
echo "  GMS Report System - Deployment Checklist"
echo "  © 2026 Mustafa - Sir Apollo Kaggwa Schools"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found!"
    exit 1
fi

# Check npm version
echo "2. Checking npm version..."
NPM_VERSION=$(npm -v)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} npm version: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found!"
    exit 1
fi

# Check if .env file exists
echo "3. Checking environment configuration..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check for required environment variables
    if grep -q "DATABASE_URL" .env && \
       grep -q "NEXTAUTH_SECRET" .env && \
       grep -q "NEXTAUTH_URL" .env; then
        echo -e "${GREEN}✓${NC} Required environment variables present"
    else
        echo -e "${RED}✗${NC} Missing required environment variables"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} .env file not found!"
    echo -e "${YELLOW}!${NC} Create .env file from .env.example"
    exit 1
fi

# Check database connection
echo "4. Checking database connection..."
npx prisma db pull --force > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}✗${NC} Database connection failed!"
    echo -e "${YELLOW}!${NC} Check DATABASE_URL in .env file"
    exit 1
fi

# Install dependencies
echo "5. Installing dependencies..."
npm install --silent
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${RED}✗${NC} Failed to install dependencies"
    exit 1
fi

# Generate Prisma Client
echo "6. Generating Prisma Client..."
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Prisma Client generated"
else
    echo -e "${RED}✗${NC} Failed to generate Prisma Client"
    exit 1
fi

# Run TypeScript type checking
echo "7. Running TypeScript type check..."
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No TypeScript errors"
else
    echo -e "${YELLOW}!${NC} TypeScript errors found (check with: npm run build)"
fi

# Run linter
echo "8. Running ESLint..."
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No linting errors"
else
    echo -e "${YELLOW}!${NC} Linting errors found (check with: npm run lint)"
fi

# Test build
echo "9. Testing production build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed!"
    echo -e "${YELLOW}!${NC} Run 'npm run build' to see errors"
    exit 1
fi

# Create database backup
echo "10. Creating database backup..."
BACKUP_FILE="database_backup_$(date +%Y%m%d_%H%M%S).sql"

# Extract database name from DATABASE_URL
DB_NAME=$(grep "DATABASE_URL" .env | sed -e 's/.*\/\([^?]*\).*/\1/')
DB_USER=$(grep "DATABASE_URL" .env | sed -e 's/.*:\/\/\([^:]*\):.*/\1/')

if [ ! -z "$DB_NAME" ] && [ ! -z "$DB_USER" ]; then
    pg_dump -U "$DB_USER" -d "$DB_NAME" -F p -f "$BACKUP_FILE" 2>/dev/null
    if [ $? -eq 0 ]; then
        BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo -e "${GREEN}✓${NC} Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        echo -e "${YELLOW}!${NC} Database backup failed (manual backup recommended)"
    fi
else
    echo -e "${YELLOW}!${NC} Could not extract database info (manual backup recommended)"
fi

# Check Git status
echo "11. Checking Git status..."
if [ -d .git ]; then
    if git diff-index --quiet HEAD --; then
        echo -e "${GREEN}✓${NC} Working directory clean"
    else
        echo -e "${YELLOW}!${NC} Uncommitted changes detected"
        git status --short
    fi
else
    echo -e "${YELLOW}!${NC} Not a git repository"
fi

echo ""
echo "================================================"
echo -e "${GREEN}✓ Pre-deployment checks completed!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Review the deployment guide: DEPLOYMENT.md"
echo "2. Update production environment variables"
echo "3. Deploy using your preferred method (Vercel/Docker/VPS)"
echo "4. Run database migrations on production"
echo "5. Test all features in production environment"
echo ""
echo "For rollback, use backup file: $BACKUP_FILE"
echo ""
