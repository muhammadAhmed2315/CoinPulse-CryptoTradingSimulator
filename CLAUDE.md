# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CoinPulse is a cryptocurrency trading simulator with a Flask backend, React (Vite) frontend, and PostgreSQL database. Users start with $1,000,000 simulated USD and can place market/limit/stop buy/sell orders using real-time prices from the CoinGecko API. Limit and stop orders are automatically executed by background threads when market conditions match.

## Development Commands

### Backend (Flask)
```bash
pip install -r requirements.txt      # Install Python dependencies
python dbCreator.py                   # Create the PostgreSQL database (first-time only)
flask db upgrade                      # Run Alembic migrations
flask run                             # Start dev server on :5000 (no background threads)
python app.py                         # Start with background threads for order execution
```

### Frontend (React/Vite)
```bash
cd frontend
npm install                           # Install Node dependencies
npm run dev                           # Vite dev server on :5173
npm run build                         # TypeScript check + Vite production build
npm run lint                          # ESLint
```

### Coin Image Scraper
```bash
node --env-file=.env scraper.js       # Scrapes coin images into frontend/public/coins.tsv
```

### Formatter
The project uses `black` for Python formatting (listed in requirements.txt).

## Architecture

### Backend Structure (Flask Blueprints)

The app factory is in `app.py` (`create_app()`). Extensions (db, jwt, login_manager) are initialized in `extensions.py` to avoid circular imports. Three blueprints:

- **`login/app.py`** (`user_authentication`) - Registration, login (email/password + Discord/Google OAuth), email verification, password reset. Uses JWT cookies (not headers) for session management via Flask-JWT-Extended.
- **`core/app.py`** (`core`) - All frontend-facing endpoints: placing orders, feed posts, wallet data, coin data proxied from CoinGecko, news (Yahoo scraper), Reddit posts. Most routes are `@jwt_required()`.
- **`api/app.py`** (`api`, prefix `/api`) - RESTful API with JWT Bearer token auth. Mirrors much of core's functionality for programmatic access. Caches CoinGecko coin list every 5 minutes via `@api.before_request`.

### Background Threads (started only via `python app.py`)

- **`update_user_wallet_value_in_background`** - Recalculates all wallet values using CoinGecko market prices. Runs every 30 minutes (configurable in `constants.py` as `WALLET_VALUE_UPDATE_INTERVAL_SECONDS`). Also called on-demand after trades.
- **`update_open_trades_in_background`** - Monitors open limit/stop orders and executes them when market conditions match (or cancels if user lacks funds). Runs every 60 seconds (`OPEN_TRADE_UPDATE_INTERVAL_SECONDS`).

Both threads batch CoinGecko API calls in groups of 250 coins to stay within rate limits.

### Database Models (`models.py`)

PostgreSQL with UUID primary keys throughout. Key relationships:
- **User** -> has one **Wallet** (1:1)
- **Wallet** -> has many **Transaction**s, has one **ValueHistory**
- **Transaction** -> has one **TransactionLikes** (stores array of user UUIDs who liked)
- `Wallet.assets` is a JSONB dict (`{coin_id: quantity}`), mutated in-place via SQLAlchemy's `MutableDict`
- `ValueHistory` stores arrays (balance, assets value, total value, timestamps) that grow over time

### Frontend Architecture

React 19 + TypeScript + Vite + Tailwind CSS v4. Key patterns:

- **Routing**: `react-router-dom` v7 in `App.tsx`. Two route groups: authentication (unauthenticated, wrapped in `AuthenticationBase`) and app pages (wrapped in `ProtectedRoute` + `AuthenticatedBase` which renders `NavBar`).
- **Auth**: `AuthContextProvider` in `context/auth-context.tsx` queries `GET /auth/me` via TanStack React Query. JWT access/refresh tokens stored as httpOnly cookies.
- **API calls**: Mix of `axios` (auth context) and `fetch` (page components). All requests go to `http://localhost:5000` with `credentials: "include"`.
- **UI**: shadcn/ui components in `components/ui/`, animated variants in `components/animate-ui/`. Path alias `@/` maps to `src/`.
- **Data grid**: AG Grid (`ag-grid-react`) used for the trades/top coins tables.
- **State management**: TanStack React Query for server state; no global client state library.

### Scrapers

- **`YahooNewsScraper/`** - Scrapes Yahoo News for coin-related articles using BeautifulSoup.
- **`RedditScraper/`** - Fetches Reddit posts via the Reddit API (requires Reddit API credentials).
- **`scraper.js`** - One-off Node script that scrapes CoinGecko for coin images and merges with API coin list, outputs `frontend/public/coins.tsv`.

## Environment Variables

Required in `.env`: `DATABASE_URL`, `COINGECKO_API_KEY`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `TOKEN_GENERATOR_SECRET_KEY`, `TOKEN_GENERATOR_SALT`, `JWT_SECRET_KEY`, `DISCORD_OAUTH2_CLIENT_ID`, `DISCORD_OAUTH2_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `REDDIT_CLIENT_ID`, `REDDIT_SECRET_KEY`, `REDDIT_USERNAME`, `REDDIT_PASSWORD`, `REDDIT_USER_AGENT`, `POSTGRESQL_USERNAME`, `POSTGRESQL_PASSWORD`.

## Key Conventions

- The `core` blueprint endpoints are consumed by the React frontend; the `api` blueprint is the public REST API. They have overlapping functionality but different auth mechanisms (cookies vs Bearer tokens).
- CoinGecko rate limits are a persistent constraint: the code throttles with `time.sleep()` between batch requests and caches coin lists.
- Frontend dev server runs on port 5173, backend on port 5000. CORS is configured for both `localhost` origins.
- Database migrations use Flask-Migrate (Alembic). Migration files are in `migrations/versions/`.
- New wallets start with $1,000,000 balance. A `ValueHistory` record must be created alongside each new `Wallet`.
