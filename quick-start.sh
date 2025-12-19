#!/bin/bash

# IPO GMP Analyzer - Quick Start Script
echo "🚀 Starting IPO GMP Analyzer Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

print_status "Setting up project structure..."

# Create necessary directories
mkdir -p backend/{api,ml,scrapers,utils,models,logs}
mkdir -p frontend/{src/{components,hooks,services,utils},public}
mkdir -p database
mkdir -p logs

# Setup backend
print_status "Setting up Python backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_status "Created Python virtual environment"
fi

# Activate virtual environment
source venv/bin/activate || source venv/Scripts/activate

# Install Python dependencies
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    print_status "Installed Python dependencies"
else
    print_warning "requirements.txt not found, installing basic dependencies..."
    pip install fastapi uvicorn sqlalchemy psycopg2-binary redis pandas scikit-learn xgboost requests beautifulsoup4 python-jose passlib bcrypt
fi

cd ..

# Setup frontend
print_status "Setting up React frontend..."
cd frontend

# Install Node.js dependencies
if [ -f "package.json" ]; then
    npm install
    print_status "Installed Node.js dependencies"
else
    print_warning "package.json not found in frontend directory"
fi

cd ..

# Create environment files
print_status "Creating environment configuration..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ipo_gmp_analyzer

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application
APP_NAME=IPO GMP Analyzer
APP_VERSION=1.0.0
DEBUG=true
LOG_LEVEL=INFO

# External APIs
NSE_API_URL=https://www.nseindia.com
BSE_API_URL=https://www.bseindia.com
CHITTORGARH_URL=https://www.chittorgarh.com
IPOWATCH_URL=https://www.ipowatch.in

# CORS
ALLOWED_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
EOF
    print_status "Created backend .env file"
fi

# Frontend .env
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=IPO GMP Analyzer
NEXT_PUBLIC_ENVIRONMENT=development
EOF
    print_status "Created frontend .env.local file"
fi

# Create a simple database initialization script
cat > database/init.sql << EOF
-- IPO GMP Analyzer Database Initialization
CREATE DATABASE IF NOT EXISTS ipo_gmp_analyzer;

-- Create user if not exists (PostgreSQL)
-- CREATE USER IF NOT EXISTS ipo_user WITH PASSWORD 'password';
-- GRANT ALL PRIVILEGES ON DATABASE ipo_gmp_analyzer TO ipo_user;

-- Basic tables will be created by SQLAlchemy
EOF

print_status "Created database initialization script"

# Create startup scripts
cat > start-backend.sh << 'EOF'
#!/bin/bash
echo "🐍 Starting Python Backend..."
cd backend
source venv/bin/activate || source venv/Scripts/activate
python api/main.py
EOF

cat > start-frontend.sh << 'EOF'
#!/bin/bash
echo "⚛️ Starting React Frontend..."
cd frontend
npm run dev
EOF

chmod +x start-backend.sh start-frontend.sh

print_status "Created startup scripts"

# Display instructions
echo ""
echo -e "${BLUE}🎉 Setup Complete!${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. 📊 Setup Database:"
echo "   - Install PostgreSQL and create database 'ipo_gmp_analyzer'"
echo "   - Or use SQLite by changing DATABASE_URL in backend/.env"
echo ""
echo "2. 🚀 Start the Application:"
echo "   - Backend:  ./start-backend.sh  (or cd backend && python api/main.py)"
echo "   - Frontend: ./start-frontend.sh (or cd frontend && npm run dev)"
echo ""
echo "3. 🌐 Access the Application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
echo ""
echo -e "${GREEN}🔧 Development Commands:${NC}"
echo "   - Backend tests: cd backend && python -m pytest"
echo "   - Frontend tests: cd frontend && npm test"
echo "   - Lint code: cd frontend && npm run lint"
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo "   - Update database credentials in backend/.env"
echo "   - Install Redis for caching (optional but recommended)"
echo "   - Check logs/ directory for application logs"
echo ""
echo -e "${GREEN}✅ Ready to develop your IPO GMP Analyzer!${NC}"
EOF

chmod +x quick-start.sh