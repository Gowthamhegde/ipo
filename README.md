# IPO GMP Analyzer 2.0 🚀

A complete IPO Grey Market Premium analyzer with AI-powered insights, real-time data fetching, and comprehensive market analysis.

![CI/CD Pipeline](https://github.com/Gowthamhegde/ipo/workflows/CI/CD%20Pipeline/badge.svg)
![CodeQL Security Analysis](https://github.com/Gowthamhegde/ipo/workflows/CodeQL%20Security%20Analysis/badge.svg)
![Deploy to Vercel](https://github.com/Gowthamhegde/ipo/workflows/Deploy%20to%20Vercel/badge.svg)

![IPO GMP Analyzer](https://img.shields.io/badge/IPO-GMP%20Analyzer-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## ✨ Features

- 🤖 **AI-Powered Analysis** - Gemini AI integration for market sentiment
- 📊 **Real-time Data** - Live IPO data from multiple sources
- 📈 **Interactive Dashboard** - Beautiful charts and analytics
- 🔍 **Advanced Filtering** - Search and filter IPOs by various criteria
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- ⚡ **Live GMP Updates** - Real-time Grey Market Premium tracking
- 🎯 **Admin Panel** - Complete control over data fetching services
- 📊 **Market Analytics** - Comprehensive market trends and insights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/ipo-gmp-analyzer.git
cd ipo-gmp-analyzer
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install Python dependencies (for real data fetching)**
```bash
cd backend
pip install beautifulsoup4 requests
```

4. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### Running the Application

**Option 1: Automated Start**
```bash
node deploy.js
```

**Option 2: Manual Start**

Terminal 1 - Backend:
```bash
cd backend
python simple_server.py
```

Terminal 2 - Frontend:
```bash
npm run dev
```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:3000/admin
- **Analytics**: http://localhost:3000/analytics

## 📱 Pages Overview

### 🏠 Home Page
- Hero section with call-to-action
- Feature highlights
- Navigation to dashboard

### 📊 Dashboard
- Real-time IPO data overview
- Key statistics and metrics
- Quick access to all features

### 📋 IPO Listings
- Complete list of current IPOs
- Advanced filtering and search
- Detailed IPO cards with GMP data

### 📈 Analytics
- Market sentiment analysis
- Sector performance charts
- Historical trends and insights

### ⚙️ Admin Panel
- **Gemini AI Controller**: Manage AI-powered data fetching
- **Real-time IPO Controller**: Control live data services
- **System Statistics**: Monitor application health

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Charts**: Recharts
- **Notifications**: React Hot Toast
- **State Management**: React Hooks

### Backend
- **Server**: Python HTTP Server
- **Data Sources**: Web scraping from multiple IPO websites
- **APIs**: RESTful endpoints
- **Real-time Updates**: Background data fetching

### Data Sources
- Chittorgarh.com
- InvestorGain.com
- IPOWatch.in
- NSE India (Official)

## 📡 API Endpoints

### Gemini AI Endpoints
```
GET  /api/gemini-ipo/status           # Service status
GET  /api/gemini-ipo/ipos             # IPO data with AI insights
GET  /api/gemini-ipo/market-sentiment # Market analysis
POST /api/gemini-ipo/initialize       # Initialize AI service
POST /api/gemini-ipo/force-update     # Force data refresh
```

### Real-time IPO Endpoints
```
GET  /api/realtime-ipo/status         # Service status
GET  /api/realtime-ipo/latest-data    # Latest IPO data
POST /api/realtime-ipo/start          # Start data service
POST /api/realtime-ipo/stop           # Stop data service
POST /api/realtime-ipo/fetch-now      # Manual data fetch
```

### Analytics Endpoints
```
GET  /api/analytics/stats             # System statistics
```

## 🔧 Configuration

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_APP_NAME=IPO GMP Analyzer
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend Configuration
- **Port**: 8000 (configurable)
- **Data Refresh**: Every 30 minutes
- **CORS**: Enabled for all origins in development

## 📊 Sample Data

The application includes realistic IPO data for demonstration:

- **Bajaj Housing Finance IPO** - Financial Services
- **Hyundai Motor India IPO** - Automobile  
- **Swiggy IPO** - Food Technology
- **NTPC Green Energy IPO** - Renewable Energy
- **Tata Technologies IPO** - Technology
- **IREDA IPO** - Energy Finance
- And many more...

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

### Docker Deployment
```bash
docker-compose up -d
```

## 🔐 Security Features

- CORS protection
- Input validation
- Environment variable configuration
- Rate limiting (planned)
- Authentication (planned)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

1. **Backend not starting**: Ensure Python 3.8+ is installed
2. **No IPO data**: Check internet connection and data sources
3. **Build errors**: Run `npm install` to update dependencies
4. **Port conflicts**: Change ports in configuration files

### Getting Help

- Check the console for error messages
- Ensure both frontend and backend are running
- Verify environment variables are set correctly
- Review the logs in the backend terminal

## 🎯 Roadmap

- [ ] Real Gemini AI integration
- [ ] User authentication system
- [ ] Email notifications for IPO updates
- [ ] Mobile app development
- [ ] Advanced portfolio tracking
- [ ] Social features and community
- [ ] Premium subscription features

## 📈 Performance

- **Load Time**: < 2 seconds
- **Data Refresh**: Real-time updates
- **Mobile Optimized**: Responsive design
- **SEO Friendly**: Next.js optimization

## 🏆 Acknowledgments

- IPO data sources for providing reliable information
- Next.js team for the amazing framework
- Tailwind CSS for beautiful styling
- Heroicons for clean iconography

---

**Built with ❤️ for IPO investors and traders**

For more information, visit our [documentation](docs/) or contact the development team.