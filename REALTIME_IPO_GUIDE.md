# Real-time IPO Data Fetcher Guide

## Overview

The Real-time IPO Data Fetcher is an automated system that continuously monitors and updates IPO data from multiple sources. It provides:

- **Automatic daily updates** of IPO data
- **Real-time monitoring** during market hours
- **Multiple data sources** (Chittorgarh, NSE, BSE, IPOWatch, etc.)
- **Smart scheduling** with configurable intervals
- **Web-based control panel** for monitoring and management

## Features

### 🔄 Automatic Data Fetching
- Fetches IPO data every 6 hours automatically
- Daily comprehensive updates at 9:00 AM
- Market hours updates (Mon-Fri 9:15 AM - 3:30 PM)
- Weekly cleanup of old data

### 📊 Multiple Data Sources
- **Chittorgarh**: GMP data and IPO listings
- **NSE**: Official exchange data
- **BSE**: Bombay Stock Exchange data
- **IPOWatch**: Community-driven IPO information
- **Mock Data**: Fallback for testing and development

### 🎯 Smart Processing
- Duplicate removal across sources
- Data validation and enhancement
- Risk level calculation
- Investment recommendations
- ML-based predictions

### 🖥️ Web Control Panel
- Start/stop the service
- Monitor real-time status
- View task history
- Manual data refresh
- System metrics and health checks

## Quick Start

### Method 1: Using PowerShell (Windows)
```powershell
# Start in foreground
.\scripts\start-realtime-ipo.ps1

# Start in background
.\scripts\start-realtime-ipo.ps1 -Background

# Get help
.\scripts\start-realtime-ipo.ps1 -Help
```

### Method 2: Using Python directly
```bash
# Navigate to project root
cd your-ipo-project

# Install dependencies
cd backend
pip install -r requirements.txt

# Start the service
python ../scripts/start-realtime-ipo.py
```

### Method 3: Using the Web Interface
1. Start your main application (`npm run dev`)
2. Navigate to `/admin` in your browser
3. Go to the "Real-time IPO" tab
4. Click "Start Service"

## Configuration

### Environment Variables
Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/ipo_db

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# API Keys (optional)
CHITTORGARH_API_KEY=your_key_here
NSE_API_KEY=your_key_here

# Scheduling
FETCH_INTERVAL_HOURS=6
MARKET_HOURS_INTERVAL_MINUTES=30

# Logging
LOG_LEVEL=INFO
```

### Customizing Data Sources
Edit `backend/services/real_time_ipo_service.py`:

```python
self.sources = {
    'chittorgarh': 'https://www.chittorgarh.com/ipo/ipo_list_2024.asp',
    'your_custom_source': 'https://your-api.com/ipos',
    # Add more sources here
}
```

## API Endpoints

### Service Control
- `POST /api/realtime-ipo/start` - Start the service
- `POST /api/realtime-ipo/stop` - Stop the service
- `GET /api/realtime-ipo/status` - Get service status

### Data Access
- `GET /api/realtime-ipo/latest-data` - Get latest IPO data
- `POST /api/realtime-ipo/fetch-now` - Trigger manual fetch

### Task Management
- `GET /api/realtime-ipo/tasks` - Get task history
- `POST /api/realtime-ipo/force-task/{task_type}` - Force run specific task

### Monitoring
- `GET /api/realtime-ipo/health` - Health check
- `GET /api/realtime-ipo/metrics` - Detailed metrics

## Scheduling

### Default Schedule
- **Daily Fetch**: 9:00 AM every day
- **Periodic Fetch**: Every 6 hours
- **Market Hours**: Every 30 minutes (Mon-Fri 9:15 AM - 3:30 PM)
- **Weekly Cleanup**: Sunday 2:00 AM

### Custom Scheduling
Modify `backend/tasks/ipo_scheduler.py`:

```python
# Custom schedule example
schedule.every().day.at("08:00").do(self._schedule_daily_fetch)
schedule.every(4).hours.do(self._schedule_periodic_fetch)
```

## Data Processing

### IPO Data Enhancement
Each IPO record is enhanced with:
- **Risk Level**: Low/Medium/High based on GMP and confidence
- **Recommendation**: Strong Buy/Buy/Hold/Avoid
- **Estimated Gain**: Calculated potential profit
- **Industry Classification**: Auto-detected from company name
- **Lot Size**: Calculated based on price range

### Duplicate Handling
- Company names are normalized and compared
- Duplicates are removed based on similarity
- Latest data takes precedence

## Monitoring and Troubleshooting

### Log Files
- **Service logs**: `realtime_ipo.log`
- **Application logs**: Check your main app logs
- **Error logs**: Captured in the database

### Common Issues

#### Service Won't Start
```bash
# Check Python installation
python --version

# Check dependencies
pip install -r backend/requirements.txt

# Check database connection
python -c "from backend.database import check_database_health; print(check_database_health())"
```

#### No Data Being Fetched
1. Check internet connection
2. Verify data source URLs are accessible
3. Check for rate limiting or IP blocking
4. Review error logs for specific issues

#### High Memory Usage
- Reduce fetch frequency
- Implement data archiving
- Clear old cache entries
- Monitor database size

### Performance Optimization

#### Caching Strategy
- IPO data cached for 5-10 minutes
- Predictions cached for 30 minutes
- System stats cached for 5 minutes

#### Database Optimization
- Regular cleanup of old data
- Proper indexing on frequently queried fields
- Connection pooling for high load

## Integration

### Frontend Integration
```javascript
import realTimeIPOFetcher from '../lib/realTimeIPOFetcher'

// Start the fetcher
realTimeIPOFetcher.startDailyFetching()

// Listen for updates
realTimeIPOFetcher.addListener((data) => {
  console.log('New IPO data:', data)
  // Update your UI
})

// Get latest data
const latestData = await realTimeIPOFetcher.fetchLatestIPOData()
```

### Backend Integration
```python
from services.real_time_ipo_service import real_time_ipo_service

# Start the service
await real_time_ipo_service.start_service()

# Get latest data
ipos = await real_time_ipo_service.fetch_all_ipo_data()

# Check service status
status = real_time_ipo_service.get_status()
```

## Security Considerations

- API endpoints require authentication for admin functions
- Rate limiting prevents abuse
- Input validation on all data sources
- Secure storage of API keys and credentials
- Regular security updates

## Support

For issues or questions:
1. Check the logs for error messages
2. Review this guide for common solutions
3. Check the admin dashboard for service status
4. Restart the service if needed

## Future Enhancements

- **Real-time WebSocket updates**
- **Advanced ML predictions**
- **Custom alert rules**
- **Mobile app integration**
- **Advanced analytics dashboard**
- **Multi-language support**