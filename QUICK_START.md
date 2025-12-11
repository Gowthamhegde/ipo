# IPO GMP Analyzer - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- **Node.js** 18+ and **npm**
- **Python** 3.11+ and **pip**
- **Git** (optional, for version control)

## Option 1: Quick Local Setup (Recommended)

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Setup Environment
```bash
# Copy environment files
cp .env.local.example .env.local
cp backend/.env.example backend/.env

# Edit backend/.env with your preferences (optional for demo)
```

### 3. Start the System
```bash
# Terminal 1: Start Backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend (new terminal)
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Option 2: Docker Setup (Production-like)

### 1. Using Docker Compose
```bash
# Start all services
docker-compose -f deployment/docker-compose.yml up -d

# View logs
docker-compose -f deployment/docker-compose.yml logs -f

# Stop services
docker-compose -f deployment/docker-compose.yml down
```

### 2. Access Services
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: localhost:5432 (postgres/password)
- **Redis**: localhost:6379

## 🎯 What You'll See

### Landing Page
- Hero section with system overview
- Feature highlights
- Call-to-action to access dashboard

### IPO Dashboard
- **Live IPO Data**: Real-time IPO information with GMP
- **Smart Filtering**: Filter by status, industry, profitability
- **ML Predictions**: AI-powered listing gain forecasts
- **Interactive Cards**: Detailed IPO information with expansion

### Key Features Demo
1. **Profitable IPOs**: Green-highlighted cards for profitable opportunities
2. **GMP Confidence**: Color-coded confidence scores
3. **Trend Indicators**: Visual GMP trend arrows
4. **Prediction Factors**: ML model explanation

## 📊 Sample Data

The system comes with realistic mock data including:
- **6 Sample IPOs** across different industries
- **Various GMP levels** (profitable and non-profitable)
- **ML predictions** with confidence scores
- **Different IPO statuses** (upcoming, open, closed)

## 🔧 Configuration Options

### Backend Configuration (backend/.env)
```bash
# Database (SQLite for demo, PostgreSQL for production)
DATABASE_URL=sqlite:///./ipo_analyzer.db

# Security
SECRET_KEY=your-secret-key-here

# Email Notifications (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS Notifications (optional)
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_PHONE=+1234567890
```

### Frontend Configuration (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=IPO GMP Analyzer
```

## 🧪 Testing the System

### 1. API Testing
```bash
# Health check
curl http://localhost:8000/health

# Get IPOs
curl http://localhost:8000/ipos

# Get specific IPO
curl http://localhost:8000/ipos/1
```

### 2. Frontend Testing
- Navigate to http://localhost:3000
- Click "Start Analyzing IPOs"
- Test filtering options
- Expand IPO cards for details
- Check ML predictions

### 3. Background Jobs (Optional)
```bash
# In backend directory
python -c "from tasks.scheduler import start_scheduler; start_scheduler()"
```

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports
npx kill-port 3000 8000

# Or use different ports
npm run dev -- -p 3001
uvicorn main:app --port 8001
```

#### Python Dependencies
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Database Issues
```bash
# Reset SQLite database
rm backend/ipo_analyzer.db

# Restart backend to recreate tables
```

#### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📈 Next Steps

### 1. Production Deployment
- Follow [DEPLOYMENT.md](DEPLOYMENT.md) for AWS/Render setup
- Configure real data sources
- Set up monitoring and alerts

### 2. Customization
- Modify profitability criteria in `backend/services/gmp_validator.py`
- Add new data sources in `backend/services/data_fetcher.py`
- Customize UI components in `src/components/`

### 3. Real Data Integration
- Replace mock data with actual API calls
- Configure external data source credentials
- Set up data validation rules

### 4. Notifications Setup
- Configure SMTP for email notifications
- Set up Twilio for SMS alerts
- Implement push notifications

## 🔍 System Architecture

```
Frontend (Next.js) → Backend (FastAPI) → Database (SQLite/PostgreSQL)
                           ↓
                    External APIs (NSE, BSE, etc.)
                           ↓
                    ML Engine → Notifications
```

## 📚 Additional Resources

- **API Documentation**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **System Architecture**: [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)

## 💡 Tips for Success

1. **Start Simple**: Use the mock data to understand the system
2. **Gradual Integration**: Add real data sources one by one
3. **Monitor Performance**: Use the health endpoints
4. **Test Thoroughly**: Validate GMP accuracy before going live
5. **Scale Gradually**: Start with basic notifications, add complexity

## 🆘 Support

If you encounter issues:
1. Check the logs in both frontend and backend terminals
2. Verify all dependencies are installed
3. Ensure ports 3000 and 8000 are available
4. Review the troubleshooting section above

## 🎉 Success Indicators

You'll know the system is working when:
- ✅ Frontend loads at http://localhost:3000
- ✅ Backend API responds at http://localhost:8000/health
- ✅ IPO dashboard shows sample data
- ✅ Filtering and expansion work correctly
- ✅ ML predictions display with confidence scores

**Congratulations! Your IPO GMP Analyzer is now running! 🚀**