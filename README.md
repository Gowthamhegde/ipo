# IPO GMP Analyzer 2.0

A complete IPO Grey Market Premium analyzer with AI-powered insights and real-time data.

## 🚀 Quick Start

### Option 1: Automated Deployment
```bash
node deploy.js
```

### Option 2: Manual Setup

1. **Start Backend:**
```bash
cd backend
python simple_server.py
```

2. **Start Frontend:**
```bash
npm run dev
```

## 📊 Features

- **Real-time IPO Data**: Live GMP tracking and updates
- **AI-Powered Analysis**: Gemini AI integration for market sentiment
- **Interactive Dashboard**: Beautiful UI with charts and analytics
- **Admin Panel**: Control and monitor data fetching services
- **Responsive Design**: Works on desktop and mobile

## 🔧 Configuration

### Environment Variables (.env.local)
```
NEXT_PUBLIC_APP_NAME=IPO GMP Analyzer
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
BACKEND_URL=http://localhost:8000
```

## 📱 Pages

- **Home**: Landing page with hero section
- **Dashboard**: Main IPO data dashboard
- **IPOs**: Detailed IPO listings with filters
- **Analytics**: Market analytics and trends
- **Admin**: Service control and monitoring

## 🛠 Tech Stack

### Frontend
- Next.js 15
- React 18
- Tailwind CSS
- Heroicons
- React Hot Toast
- Recharts

### Backend
- Python HTTP Server
- Mock IPO data
- RESTful API endpoints
- CORS enabled

## 📡 API Endpoints

### Gemini AI Endpoints
- `GET /api/gemini-ipo/status` - Service status
- `GET /api/gemini-ipo/ipos` - IPO data
- `GET /api/gemini-ipo/market-sentiment` - Market analysis
- `POST /api/gemini-ipo/initialize` - Initialize service
- `POST /api/gemini-ipo/force-update` - Force data update

### Real-time IPO Endpoints
- `GET /api/realtime-ipo/status` - Service status
- `GET /api/realtime-ipo/latest-data` - Latest IPO data
- `POST /api/realtime-ipo/start` - Start service
- `POST /api/realtime-ipo/stop` - Stop service

### Analytics Endpoints
- `GET /api/analytics/stats` - System statistics

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Optional)
```bash
docker-compose up -d
```

## 📈 Sample Data

The application includes mock IPO data for demonstration:
- Tata Technologies IPO
- IREDA IPO
- HealthTech Solutions IPO
- And more...

## 🔐 Security

- CORS enabled for cross-origin requests
- Environment variable configuration
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the console for error messages
2. Ensure both frontend and backend are running
3. Verify environment variables are set correctly

## 🎯 Roadmap

- [ ] Real Gemini AI integration
- [ ] Database persistence
- [ ] User authentication
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced analytics

---

Built with ❤️ for IPO investors