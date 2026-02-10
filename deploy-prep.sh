#!/bin/bash

# 🚀 GMS Report Portal - Quick Deployment Script
# This script helps prepare the application for deployment

echo "================================================"
echo "  GMS Report Portal - Deployment Preparation"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if running in project directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

print_success "Found package.json"

# Step 1: Check Node.js version
echo ""
echo "Step 1: Checking Node.js version..."
NODE_VERSION=$(node -v)
print_success "Node.js version: $NODE_VERSION"

if [[ ! "$NODE_VERSION" =~ ^v1[8-9] ]] && [[ ! "$NODE_VERSION" =~ ^v2[0-9] ]]; then
    print_warning "Node.js version should be 18.x or higher"
fi

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 3: Check environment file
echo ""
echo "Step 3: Checking environment configuration..."
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env with your production values before continuing"
    echo "Press Enter when ready to continue..."
    read
else
    print_success "Found .env file"
fi

# Step 4: Generate Prisma Client
echo ""
echo "Step 4: Generating Prisma Client..."
npx prisma generate
if [ $? -eq 0 ]; then
    print_success "Prisma Client generated"
else
    print_error "Failed to generate Prisma Client"
    exit 1
fi

# Step 5: Check database connection
echo ""
echo "Step 5: Testing database connection..."
npx prisma db pull --force 2>/dev/null
if [ $? -eq 0 ]; then
    print_success "Database connection successful"
else
    print_warning "Database connection failed. Ensure DATABASE_URL is correct in .env"
fi

# Step 6: Run database migrations
echo ""
echo "Step 6: Running database migrations..."
echo "Do you want to push schema to database? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    npx prisma db push
    if [ $? -eq 0 ]; then
        print_success "Database schema updated"
    else
        print_error "Failed to update database schema"
        exit 1
    fi
else
    print_warning "Skipping database migrations"
fi

# Step 7: Build the application
echo ""
echo "Step 7: Building Next.js application..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Build failed. Check errors above"
    exit 1
fi

# Step 8: Summary
echo ""
echo "================================================"
echo "  Deployment Preparation Complete!"
echo "================================================"
echo ""
print_success "All checks passed!"
echo ""
echo "Next steps:"
echo "  1. Review your .env file for production values"
echo "  2. Test the build locally: npm start"
echo "  3. Deploy using your preferred method (see DEPLOYMENT_GUIDE.md)"
echo ""
echo "Deployment options:"
echo "  - Vercel (Recommended): Push to GitHub and import in Vercel"
echo "  - VPS: Copy files and run with PM2 (pm2 start npm --name gms-report -- start)"
echo "  - Docker: Use docker-compose up -d"
echo ""
print_success "Ready for deployment! 🚀"
echo ""
