# How to Use This Pull Request in VS Code

This guide will help you get the GMS Report application code from this pull request into your local VS Code environment.

## Option 1: Clone the Repository and Checkout the PR Branch (Recommended)

This is the easiest way if you haven't cloned the repository yet.

### Step 1: Clone the Repository

Open your terminal (or Git Bash on Windows) and run:

```bash
# Navigate to where you want to store the project
cd ~/Documents/Projects  # or wherever you keep your projects

# Clone the repository
git clone https://github.com/mayegamustafa/gms-report.git

# Navigate into the project folder
cd gms-report
```

### Step 2: Checkout the Pull Request Branch

```bash
# Fetch all branches
git fetch origin

# Checkout the PR branch
git checkout copilot/build-gms-report-application

# Verify you're on the correct branch
git branch
# Should show: * copilot/build-gms-report-application
```

### Step 3: Open in VS Code

```bash
# Open the project in VS Code
code .
```

If the `code` command doesn't work, you can:
- Open VS Code manually
- Go to File → Open Folder
- Select the `gms-report` folder

---

## Option 2: If You Already Have the Repository Cloned

If you already cloned the repository earlier:

### Step 1: Navigate to Your Project

```bash
cd path/to/your/gms-report
```

### Step 2: Fetch and Checkout the PR Branch

```bash
# Fetch the latest changes
git fetch origin

# Checkout the PR branch
git checkout copilot/build-gms-report-application

# Pull the latest changes
git pull origin copilot/build-gms-report-application
```

### Step 3: Open in VS Code

```bash
code .
```

---

## Option 3: Download as ZIP (Not Recommended)

If you prefer not to use Git:

1. Go to: https://github.com/mayegamustafa/gms-report
2. Click the branch dropdown (usually says "main")
3. Select `copilot/build-gms-report-application`
4. Click the green "Code" button
5. Click "Download ZIP"
6. Extract the ZIP file
7. Open the extracted folder in VS Code

**Note**: With this method, you won't be able to easily pull updates or contribute changes.

---

## Verify You Have the Correct Code

After opening the project in VS Code, verify you have all the files:

### Check the File Structure

You should see these folders and files:

```
gms-report/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── historical/
│   │   │   └── reports/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── update-report/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   └── dashboard/
│   └── types/
├── .env.example
├── .gitignore
├── next.config.mjs
├── package.json
├── README.md
├── TESTING.md
└── tsconfig.json
```

### Check the Current Branch

In VS Code:
1. Look at the bottom left corner - it should show: `copilot/build-gms-report-application`
2. Or open the integrated terminal (View → Terminal or Ctrl+`) and run:
   ```bash
   git branch
   ```

---

## Set Up the Project in VS Code

Once you have the code in VS Code, follow these steps:

### 1. Install Dependencies

Open the integrated terminal in VS Code (Ctrl+` or View → Terminal):

```bash
npm install
```

This will install all required packages (Next.js, TypeScript, Prisma, etc.).

### 2. Set Up Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Then edit `.env` file in VS Code:

```env
# Update with your PostgreSQL credentials
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/gms_report?schema=public"

# Generate a secret using: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"

NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set Up the Database

Make sure PostgreSQL is running, then:

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# Seed with test data
npm run db:seed
```

### 4. Start the Development Server

```bash
npm run dev
```

Open your browser to: http://localhost:3000

Login with:
- Email: `admin@gms.com`
- Password: `admin123`

---

## Recommended VS Code Extensions

Install these extensions for a better development experience:

1. **ES7+ React/Redux/React-Native snippets** - React code snippets
2. **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
3. **Prisma** - Syntax highlighting for Prisma schema
4. **ESLint** - JavaScript/TypeScript linting
5. **Pretty TypeScript Errors** - Better error messages

To install:
1. Click the Extensions icon in VS Code (Ctrl+Shift+X)
2. Search for each extension
3. Click "Install"

---

## Working with the Code in VS Code

### Running Commands

Use the integrated terminal (Ctrl+`):

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Open Prisma Studio (database GUI)
npx prisma studio
```

### Viewing Files

Use the Explorer panel (Ctrl+Shift+E) to navigate files, or:
- Press Ctrl+P to quickly open files by name
- Press Ctrl+Shift+F to search across all files

### Debugging

The terminal will show error messages. Common locations:
- **Browser Console** (F12): For frontend errors
- **VS Code Terminal**: For backend/build errors
- **Network Tab** (F12): For API request issues

---

## Making Changes

### Edit Code

1. Make changes in VS Code
2. Save files (Ctrl+S)
3. The dev server will automatically reload
4. Check your browser for updates

### Test Your Changes

Follow the `TESTING.md` guide for comprehensive testing.

### Commit Your Changes (Optional)

If you want to save your changes:

```bash
# Check what changed
git status

# Add files
git add .

# Commit with a message
git commit -m "Your change description"

# Push to your fork (if you have one)
git push origin copilot/build-gms-report-application
```

---

## Troubleshooting

### "code" command not found

**Windows**: 
- Open VS Code
- Press Ctrl+Shift+P
- Type "Shell Command: Install 'code' command in PATH"
- Restart terminal

**Mac/Linux**:
- Open VS Code
- Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Linux)
- Type "Shell Command: Install 'code' command in PATH"

### Can't see the branch

```bash
# Fetch all branches
git fetch --all

# List all branches
git branch -a

# Checkout the PR branch
git checkout copilot/build-gms-report-application
```

### Git asks for credentials

Set up SSH keys or use a personal access token:
- GitHub Docs: https://docs.github.com/en/authentication

### Package installation fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

Once you have the project running in VS Code:

1. ✅ Follow the `TESTING.md` guide to test all features
2. ✅ Explore the code structure in the `src/` folder
3. ✅ Make modifications as needed
4. ✅ Use `npm run dev` for live development
5. ✅ Use `npm run build` to test production builds

---

## Getting Help

If you encounter issues:

1. Check the `README.md` for setup instructions
2. Check the `TESTING.md` for testing guidance
3. Look for error messages in:
   - VS Code terminal
   - Browser console (F12)
4. Common issues are documented in `TESTING.md` under "Common Issues and Solutions"

---

## Summary of Commands

```bash
# Initial Setup
git clone https://github.com/mayegamustafa/gms-report.git
cd gms-report
git checkout copilot/build-gms-report-application
code .

# Inside VS Code Terminal
npm install
cp .env.example .env
# Edit .env with your database credentials
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev

# Open browser to http://localhost:3000
# Login: admin@gms.com / admin123
```

That's it! You should now have the GMS Report application running in VS Code.
