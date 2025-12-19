# 🚀 IPO GMP Analyzer - Installation Guide

## **Quick Install (5 Minutes)**

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL or MySQL
- Redis (optional, for caching)

### **Step 1: Install Frontend Dependencies**

```bash
# Install all frontend packages
npm install

# If you get errors, try:
npm install --legacy-peer-deps

# Or clean install:
rm -rf node_modules package-lock.json
npm install
```

### **Step 2: Install Backend Dependencies**

```bash
cd backend
pip install -r requirements.txt

# Or with virtual environment (recommended):
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### **Step 3: Setup Database**

```bash
# PostgreSQL (recommended)
createdb ipo_gmp_analyzer

# Or MySQL
mysql -u root -p -e "CREATE DATABASE ipo_gmp_analyzer;"
```

### **Step 4: Configure Environment**

```bash
# Copy environment files
cp .env.example .env.local
cp backend/.env.example backend/.env

# Edit .env.local and backend/.env with your settings
```

**Required Environment Variables:**

```env
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend (backend/.env)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ipo_gmp_analyzer
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-super-secret-key-change-this
```

### **Step 5: Initialize Database**

```bash
cd backend
python -c "from database import engine, Base; from models_new import *; Base.metadata.create_all(bind=engine); print('Database initialized!')"
```

### **Step 6: Run the Application**

**Terminal 1 - Backend:**
```bash
cd backend
python api/main.py
# Backend runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### **Step 7: Access the Application**

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## **🐳 Docker Installation (Easiest)**

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## **🔧 Troubleshooting**

### **Frontend Issues**

**Problem: Module not found errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json .next
npm install
```

**Problem: React Query errors**
```bash
# Install specific version
npm install react-query@3.39.3
```

### **Backend Issues**

**Problem: Module import errors**
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
```

**Problem: Database connection failed**
```bash
# Check PostgreSQL is running
pg_isready

# Or start PostgreSQL
sudo service postgresql start  # Linux
brew services start postgresql  # macOS
```

**Problem: Redis connection failed**
```bash
# Start Redis
redis-server

# Or install Redis
# Ubuntu: sudo apt install redis-server
# macOS: brew install redis
```

### **Common Errors**

**Error: "fake-useragent" not found**
```bash
pip install fake-useragent
```

**Error: "xgboost" not found**
```bash
pip install xgboost
```

**Error: Port already in use**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000   # Windows (then kill PID)
```

---

## **📦 Manual Dependency Installation**

### **Frontend**
```bash
npm install next@14.0.0 react@18.2.0 react-dom@18.2.0
npm install react-query@3.39.3
npm install @heroicons/react@2.0.18
npm install axios@1.6.2
npm install tailwindcss@3.4.0
npm install recharts@2.8.0
npm install react-hot-toast@2.4.1
npm install framer-motion@10.16.16
npm install date-fns@2.30.0
npm install zustand@4.4.7
```

### **Backend**
```bash
pip install fastapi==0.104.1
pip install uvicorn[standard]==0.24.0
pip install sqlalchemy==2.0.23
pip install psycopg2-binary==2.9.9
pip install redis==5.0.1
pip install requests==2.31.0
pip install beautifulsoup4==4.12.2
pip install fake-useragent==1.4.0
pip install scikit-learn==1.3.2
pip install pandas==2.1.4
pip install xgboost==2.0.2
pip install python-jose[cryptography]==3.3.0
pip install passlib[bcrypt]==1.7.4
pip install python-dotenv==1.0.0
```

---

## **✅ Verify Installation**

```bash
# Check frontend
curl http://localhost:3000

# Check backend
curl http://localhost:8000/health

# Check API docs
open http://localhost:8000/docs
```

---

## **🎯 Next Steps**

1. **Create Admin User**: Register at http://localhost:3000/register
2. **Fetch GMP Data**: Use the admin panel to fetch latest GMP data
3. **Train ML Model**: Run the model training script
4. **Explore IPOs**: Browse the dashboard at http://localhost:3000

---

## **📞 Need Help?**

- Check logs: `docker-compose logs -f` or `npm run dev` / `python api/main.py`
- Review documentation in `/docs` folder
- Check GitHub issues

**Installation complete! Your IPO GMP Analyzer is ready to use.** 🎉