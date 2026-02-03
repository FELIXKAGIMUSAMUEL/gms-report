#!/usr/bin/env bash
# Deploy Checklist - Run this before production deployment

set -e

echo "🚀 GM Report System - Pre-Deployment Checklist"
echo "=============================================="
echo ""

# 1. Check Environment
echo "✅ Checking environment..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not installed"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "❌ npm not installed"
    exit 1
fi
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not installed (but server may be running)"
fi
echo "✓ Node.js: $(node --version)"
echo "✓ npm: $(npm --version)"
echo ""

# 2. Check Dependencies
echo "✅ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi
echo "✓ Dependencies installed"
echo ""

# 3. Check Environment Variables
echo "✅ Checking environment variables..."
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found"
    echo "Create .env.local with:"
    echo "  DATABASE_URL=postgresql://..."
    echo "  NEXTAUTH_SECRET=..."
    echo "  NEXTAUTH_URL=http://localhost:3000"
    exit 1
fi
echo "✓ .env.local found"
echo ""

# 4. Check Prisma Schema
echo "✅ Checking Prisma schema..."
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ prisma/schema.prisma not found"
    exit 1
fi
echo "✓ Prisma schema exists"
echo ""

# 5. Generate Prisma Client
echo "✅ Generating Prisma client..."
npx prisma generate
echo "✓ Prisma client generated"
echo ""

# 6. Run Database Migrations
echo "✅ Checking database migrations..."
echo "Run this before deployment:"
echo "  npx prisma migrate deploy"
echo ""

# 7. Build Project
echo "✅ Building project..."
npm run build
if [ $? -eq 0 ]; then
    echo "✓ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

# 8. Check for TypeScript Errors
echo "✅ Checking TypeScript..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✓ No TypeScript errors"
else
    echo "⚠️  TypeScript errors found (non-blocking)"
fi
echo ""

# 9. Check File Structure
echo "✅ Checking file structure..."
FILES=(
    "src/app/dashboard/page.tsx"
    "src/app/update-report/page.tsx"
    "src/app/login/page.tsx"
    "src/lib/auth.ts"
    "src/lib/prisma.ts"
    "src/components/DashboardLayout.tsx"
    "prisma/schema.prisma"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        exit 1
    fi
done
echo "✓ All critical files present"
echo ""

# 10. Security Checklist
echo "✅ Security Checklist:"
echo "  [ ] DATABASE_URL is set correctly"
echo "  [ ] NEXTAUTH_SECRET is generated and unique"
echo "  [ ] NEXTAUTH_URL matches deployment domain"
echo "  [ ] No sensitive data in .env.local"
echo "  [ ] SSL/HTTPS enabled on server"
echo "  [ ] Database backups configured"
echo ""

# 11. Documentation Check
echo "✅ Documentation Check:"
DOCS=(
    "README_COMPLETE.md"
    "SYSTEM_IMPLEMENTATION_SUMMARY.md"
    "QUICK_START_TESTING.md"
    "ARCHITECTURE.md"
    "VISUAL_GUIDE.md"
)

for doc in "${DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        echo "⚠️  Missing: $doc"
    else
        echo "✓ $doc present"
    fi
done
echo ""

# 12. Summary
echo "🎉 Pre-Deployment Checklist Complete!"
echo ""
echo "Next steps:"
echo "  1. npx prisma migrate deploy  (if needed)"
echo "  2. npm run build"
echo "  3. npm start"
echo "  4. Monitor error logs"
echo ""
echo "Deployment endpoints:"
echo "  Frontend: http://your-domain"
echo "  API: http://your-domain/api/*"
echo "  Database: Verify connection in logs"
echo ""
