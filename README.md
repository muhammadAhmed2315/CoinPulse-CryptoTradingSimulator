# Flask Crypto Trading Simulator Website

## Deployed Site

The website is deployed on [CoinPulse](https://coin-pulse-ffda7bc3f791.herokuapp.com/dashboard)

## Project Description

A Flask-based web application that allows users to simulate cryptocurrency trading in a realistic environment. Users can place different types of trades, view historical trade data, monitor their portfolio over time, and interact with other users by liking their trades.

## Features

- **User Authentication:** Register via email or OAuth (Discord/Google), email verification, and password reset options.
- **Password Reset:** Users can securely reset passwords through token-generated email links
- **Trading Simulator:** Place market buy/sell, limit buy/sell, and stop buy/sell orders based on real-time data from the CoinGecko API. Limit and stop orders are automatically executed in the background using multithreading when market prices match them.
- **Trade History:** View detailed history of trades, including executed and open trades.
- **Portfolio Tracking:** Monitor the value of your USD balance, cryptocurrency assets, and total portfolio over time with interactive graphs.
- **Social Interaction:** Users can see, comment, and like other users' trades.
- **Charts and Market Data:** Users can access detailed charts for any cryptocurrency, including historical data such as OHLC (Open, High, Low, Close), price, volume, and market cap.
- **Real-Time News:** Users can access real-time news about any given coin, thanks to web scraping Yahoo News.
- **Reddit Integration:** Users can access recent Reddit posts about a specific coin using the Reddit API.

## Setup Instructions

1. **Clone the Repository:**
   ```
   git clone <repository-url>
   ```
2. **Create a Virtual Environment:**
   ```
   python -m venv venv
   ```
3. **Activate the Virtual Environment:**
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - Mac/Linux:
     ```
     source venv/bin/activate
     ```
4. **Install Requirements:**
   ```
   pip install -r requirements.txt
   ```
5. **Set Environment Variables:** Create a `.env` file and provide values for the required variables such as `COINGECKO_API_KEY`, `DATABASE_URL`, `REDDIT_CLIENT_ID`, etc.
6. **Initialize the Database:**
   ```
   flask db upgrade
   ```
7. **Run the Application Locally:**
   ```
   flask run
   ```
8. **Access the Website:** Go to `http://127.0.0.1:5000` in your browser.

## URL Configuration (Deployment)

By default the app is wired for local development, but the URLs that couple the
frontend and backend are configurable via environment variables. All are
optional and fall back to their localhost defaults when unset.

**Frontend** (set in `frontend/.env`; see `frontend/.env.example`):

- `VITE_API_BASE_URL` — base URL of the Flask backend. Defaults to
  `http://localhost:5000`.

**Backend** (set in the root `.env`):

- `DISCORD_OAUTH2_REDIRECT_URI` — Discord OAuth callback URL. Defaults to
  `http://localhost:5000/callback_discord`.
- `GOOGLE_REDIRECT_URI` — Google OAuth callback URL. Defaults to
  `http://localhost:5000/callback_google`.
- `CORS_ORIGINS` — comma-separated list of allowed frontend origins. Defaults to
  `http://localhost:5173,http://127.0.0.1:5173`.

## Technologies Used

- **Backend:** Flask, Flask-SQLAlchemy, Flask-RESTful, Flask-Session, Flask-Login
- **Database:** PostgreSQL (via Heroku Postgres add-on)
- **Front-end:** HTML, CSS, JavaScript
- **APIs:** CoinGecko API for live cryptocurrency data, Reddit API for Reddit posts about a specific coin
- **Authentication:** OAuth (Discord, Google), JWT for API access

<details>
<summary>Screenshots</summary>

- **Homepage**
  ![Homepage Screenshot](docs/screenshots-v1/dashboard.png)
- **Trading Dashboard**
  ![Trading Dashboard Screenshot](docs/screenshots-v1/new-trade.png)
- **Portfolio Analytics**
  ![Portfolio Analytics Screenshot](docs/screenshots-v1/portfolio-analytics.png)
- **Transactions Page**
  ![Transactions Page Screenshot](docs/screenshots-v1/my-trades.png)
- **Coin Info Page**
  ![Coin Info Screenshot](docs/screenshots-v1/coin-info-one.png)
  ![Coin Info Screenshot](docs/screenshots-v1/coin-info-two.png)
- **Top Coins Page**
  ![Top Coins Screenshot](docs/screenshots-v1/top-coins.png)
- **Login Page**
  ![Login Page Screenshot](docs/screenshots-v1/login.png)
- **Sign Up Page**
  ![Sign Up Page Screenshot](docs/screenshots-v1/register.png)

</details>
