<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MCN Team Status Monitor

A modern, high-performance team status monitoring dashboard built with React, Vite, TailwindCSS, Express, and SQLite. Features sleek styling, a visual calendar, custom theme configuration, and robust team analytics.

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [1. Clone and Install Dependencies](#1-clone-and-install-dependencies)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Run the Development Server](#3-run-the-development-server)
  - [4. Useful Dev Scripts](#4-useful-dev-scripts)
- [Production Deployment](#production-deployment)
  - [1. Build the Application](#1-build-the-application)
  - [2. Run the Production Server](#2-run-the-production-server)
  - [3. SQLite Production Storage & Persistence](#3-sqlite-production-storage--persistence)
- [Project Architecture](#project-architecture)

---

## Prerequisites

- **Node.js**: v18.x or higher (LTS recommended)
- **NPM**: v9.x or higher

---

## Local Development

### 1. Clone and Install Dependencies
Navigate to your workspace and install the package dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (you can copy the format from `.env.example`):
```bash
cp .env.example .env
```
Inside your `.env` file, configure the following keys if you are using AI integration features:
```env
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
```

### 3. Run the Development Server
Start the development server with Vite hot module replacement (HMR) and automatic backend reload:
```bash
npm run dev
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### 4. Useful Dev Scripts
- **Refresh Database**: Clear the local SQLite database and rebuild everything fresh:
  ```bash
  npm run refresh
  ```
- **Stop Server**: Kill processes running on the development port (3000):
  ```bash
  npm run down
  ```
- **Lint Check**: Verify TypeScript types and code structure:
  ```bash
  npm run lint
  ```

---

## Production Deployment

Deploying the MCN Team Status Monitor involves building the React single-page application (SPA) and bundling the Express + SQLite backend into a production-ready bundle.

### 1. Build the Application
Run the build script:
```bash
npm run build
```
This single command executes:
- `vite build`: Compiles the client React application and outputs static files to `dist/`.
- `esbuild server.ts ...`: Bundles the Express and database setup code into `dist/server.cjs`.

### 2. Run the Production Server
Start the production-bundled server:
```bash
npm start
```
The server will start on port `3000` in production mode, serving both the API endpoints and the compiled frontend static files.

### 3. SQLite Production Storage & Persistence

Since this application utilizes **SQLite** as its primary database, the data is saved in a local file at `data/database.sqlite` (and its WAL journal files `database.sqlite-shm` / `database.sqlite-wal`).

To prevent data loss and ensure reliability, keep the following in mind:

- **Volume Persistence (Containers / Docker / Kubernetes)**:
  If you are containerizing the application or deploying to cloud platforms like AWS Elastic Beanstalk, Google Cloud Run, or Render, you **must** mount the `data/` folder as a persistent volume. If you do not, your SQLite database file will be deleted and recreated every time the container restarts or redeploys.
  
- **Directory Exclusions**:
  The `data/` directory is explicitly excluded in [.gitignore](.gitignore). Local development data will not leak to the production environment, and vice versa.

- **Idempotent Migrations**:
  You do not need to run manual schema migrations. The application uses programmatic initialization: on startup, it automatically executes the required `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ...` commands, safely updating the database structure without altering existing production data.

---

## Project Architecture

```
├── data/                  # Local SQLite database files (git-ignored)
├── dist/                  # Compiled production files (git-ignored)
├── src/                   # React frontend application
│   ├── components/        # UI components (Calendar, Dashboard, Layout, Setup, etc.)
│   ├── main.tsx           # Entrypoint for Vite frontend
│   └── index.css          # Tailwind/CSS utilities
├── server.ts              # Express server & SQLite database controller
├── package.json           # Scripts and dependencies
└── tsconfig.json          # TypeScript configurations
```
