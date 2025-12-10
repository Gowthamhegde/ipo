# IPO GMP Analyzer & Notifier

A comprehensive system for analyzing Indian stock market IPOs with Grey Market Premium (GMP) tracking, validation, and intelligent notifications.

## Features

- **Multi-Source Data Fetching**: NSE, BSE, Chittorgarh, IPOWatch
- **GMP Validation**: Cross-source validation with confidence scoring
- **Smart Notifications**: Only for profitable IPOs (GMP ≥ 10% or ≥ ₹20)
- **User Customization**: Profit filters, industry preferences, risk levels
- **ML Predictions**: Historical data-based listing gain predictions
- **Real-time Updates**: Automated data refresh every 2 hours
- **Admin Dashboard**: Complete system monitoring and control

## Architecture

```
Frontend (Next.js) ↔ Backend (FastAPI) ↔ Database (SQLite/Firebase)
                           ↓
                    Data Sources (NSE, BSE, etc.)
                           ↓
                    ML Engine (Optional)
                           ↓
                    Notification Service
```

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install` and `pip install -r requirements.txt`
3. Set up environment variables
4. Run backend: `uvicorn main:app --reload`
5. Run frontend: `npm run dev`

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Celery
- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Database**: SQLite (dev), PostgreSQL (prod)
- **ML**: scikit-learn, pandas
- **Deployment**: AWS/Render ready