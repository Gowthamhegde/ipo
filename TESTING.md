# IPO GMP Analyzer - Testing Guide

## Overview
This document outlines the testing strategy, methodologies, and procedures for the IPO GMP Analyzer system. It covers unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Strategy

### 1. Testing Pyramid
```
                    E2E Tests
                   /           \
              Integration Tests
             /                   \
        Unit Tests (Foundation)
```

- **Unit Tests (70%)**: Individual component testing
- **Integration Tests (20%)**: Service interaction testing  
- **End-to-End Tests (10%)**: Full user journey testing

### 2. Testing Scope
- **Backend API**: FastAPI endpoints and business logic
- **Frontend Components**: React components and user interactions
- **Data Services**: GMP validation and ML predictions
- **External Integrations**: Data source APIs
- **Database Operations**: CRUD operations and data integrity
- **Background Jobs**: Scheduled tasks and notifications

## Backend Testing

### 1. Unit Tests

#### Setup
```bash
cd backend
pip install pytest pytest-asyncio pytest-cov
```

#### Test Structure
```
backend/tests/
├── __init__.py
├── conftest.py
├── unit/
│   ├── test_models.py
│   ├── test_schemas.py
│   ├── test_auth.py
│   └── services/
│       ├── test_data_fetcher.py
│       ├── test_gmp_validator.py
│       ├── test_notification_service.py
│       └── test_ml_predictor.py
├── integration/
│   ├── test_api_endpoints.py
│   ├── test_database.py
│   └── test_external_apis.py
└── e2e/
    ├── test_user_journey.py
    └── test_notification_flow.py
```

#### Sample Unit Tests

**test_gmp_validator.py**
```python
import pytest
from unittest.mock import Mock, patch
from services.gmp_validator import GMPValidator
from models import IPO, GMPData

class TestGMPValidator:
    
    @pytest.fixture
    def validator(self):
        return GMPValidator()
    
    @pytest.fixture
    def sample_gmp_data(self):
        return [
            GMPData(source="chittorgarh", gmp_value=45.0, gmp_percentage=43.2),
            GMPData(source="ipowatch", gmp_value=47.0, gmp_percentage=45.1),
            GMPData(source="investorgain", gmp_value=46.0, gmp_percentage=44.2)
        ]
    
    def test_validate_ipo_gmp_success(self, validator, sample_gmp_data):
        """Test successful GMP validation with multiple sources"""
        with patch.object(validator, '_get_recent_gmp_data', return_value=sample_gmp_data):
            result = validator.validate_ipo_gmp(1, Mock())
            
            assert result.is_reliable is True
            assert result.sources_count == 3
            assert 45.0 <= result.validated_gmp <= 47.0
            assert result.confidence_score > 0.6
    
    def test_validate_ipo_gmp_insufficient_sources(self, validator):
        """Test validation with insufficient data sources"""
        with patch.object(validator, '_get_recent_gmp_data', return_value=[]):
            result = validator.validate_ipo_gmp(1, Mock())
            
            assert result.is_reliable is False
            assert result.sources_count == 0
            assert result.confidence_score == 0.0
    
    def test_detect_outliers(self, validator):
        """Test outlier detection in GMP data"""
        values = [45.0, 46.0, 47.0, 100.0]  # 100.0 is outlier
        sources = ["source1", "source2", "source3", "source4"]
        
        outliers = validator._detect_outliers(values, sources)
        
        assert "source4" in outliers
        assert len(outliers) == 1
    
    def test_is_gmp_profitable(self, validator):
        """Test profitability criteria"""
        # Test percentage criteria
        assert validator.is_gmp_profitable(15.0, 100.0, 10.0, 20.0) is True
        
        # Test absolute criteria
        assert validator.is_gmp_profitable(25.0, 100.0, 10.0, 20.0) is True
        
        # Test not profitable
        assert validator.is_gmp_profitable(5.0, 100.0, 10.0, 20.0) is False
```

**test_data_fetcher.py**
```python
import pytest
from unittest.mock import Mock, patch, AsyncMock
import aiohttp
from services.data_fetcher import DataFetcher

class TestDataFetcher:
    
    @pytest.fixture
    def fetcher(self):
        return DataFetcher()
    
    @pytest.mark.asyncio
    async def test_fetch_chittorgarh_success(self, fetcher):
        """Test successful data fetching from Chittorgarh"""
        mock_html = """
        <table class="table">
            <tr><td>TechCorp IPO</td><td>100-105</td><td>15 Jan</td><td>17 Jan</td><td>45</td><td>43%</td></tr>
        </table>
        """
        
        with patch.object(fetcher, '_fetch_source_data') as mock_fetch:
            mock_fetch.return_value = [
                {
                    'name': 'TechCorp IPO',
                    'gmp': 45.0,
                    'source': 'chittorgarh'
                }
            ]
            
            result = await fetcher.fetch_all_sources(Mock())
            
            assert 'chittorgarh' in result
            assert len(result['chittorgarh']) > 0
            assert result['chittorgarh'][0]['name'] == 'TechCorp IPO'
    
    def test_parse_gmp_various_formats(self, fetcher):
        """Test GMP parsing with different formats"""
        # Test currency format
        assert fetcher._parse_gmp("₹45") == 45.0
        
        # Test percentage format
        assert fetcher._parse_gmp("43%") == 43.0
        
        # Test negative values
        assert fetcher._parse_gmp("-10") == -10.0
        
        # Test invalid format
        assert fetcher._parse_gmp("invalid") is None
    
    @pytest.mark.asyncio
    async def test_fetch_with_timeout(self, fetcher):
        """Test handling of request timeouts"""
        with patch('aiohttp.ClientSession.get') as mock_get:
            mock_get.side_effect = asyncio.TimeoutError()
            
            result = await fetcher._fetch_source_data(
                Mock(), 'test_source', {'url': 'http://test.com', 'parser': Mock()}
            )
            
            assert result == []
```

#### Running Unit Tests
```bash
# Run all unit tests
pytest tests/unit/ -v

# Run with coverage
pytest tests/unit/ --cov=. --cov-report=html

# Run specific test file
pytest tests/unit/services/test_gmp_validator.py -v

# Run with markers
pytest -m "not slow" -v
```

### 2. Integration Tests

**test_api_endpoints.py**
```python
import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db
from tests.conftest import override_get_db

client = TestClient(app)
app.dependency_overrides[get_db] = override_get_db

class TestIPOEndpoints:
    
    def test_get_ipos_success(self):
        """Test IPO list retrieval"""
        response = client.get("/ipos")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_ipo_by_id_success(self):
        """Test single IPO retrieval"""
        # First create an IPO
        ipo_data = {
            "name": "Test IPO",
            "company_name": "Test Company",
            "issue_price_min": 100,
            "issue_price_max": 105
        }
        
        create_response = client.post("/admin/ipos", json=ipo_data)
        ipo_id = create_response.json()["id"]
        
        # Then retrieve it
        response = client.get(f"/ipos/{ipo_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test IPO"
    
    def test_get_ipo_not_found(self):
        """Test IPO not found scenario"""
        response = client.get("/ipos/99999")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

class TestAuthEndpoints:
    
    def test_register_success(self):
        """Test user registration"""
        user_data = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "testpassword123"
        }
        
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "id" in data
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        user_data = {
            "email": "duplicate@example.com",
            "name": "Test User",
            "password": "testpassword123"
        }
        
        # Register first user
        client.post("/auth/register", json=user_data)
        
        # Try to register again with same email
        response = client.post("/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]
    
    def test_login_success(self):
        """Test user login"""
        # First register a user
        user_data = {
            "email": "login@example.com",
            "name": "Login User",
            "password": "loginpassword123"
        }
        client.post("/auth/register", json=user_data)
        
        # Then login
        login_data = {
            "email": "login@example.com",
            "password": "loginpassword123"
        }
        
        response = client.post("/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
```

### 3. Database Tests

**test_database.py**
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
from models import IPO, User, GMPData

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class TestDatabaseOperations:
    
    @pytest.fixture(autouse=True)
    def setup_database(self):
        """Setup test database"""
        Base.metadata.create_all(bind=engine)
        yield
        Base.metadata.drop_all(bind=engine)
    
    @pytest.fixture
    def db_session(self):
        """Create database session"""
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()
    
    def test_create_ipo(self, db_session):
        """Test IPO creation"""
        ipo = IPO(
            name="Test IPO",
            company_name="Test Company",
            issue_price_min=100,
            issue_price_max=105,
            status="upcoming"
        )
        
        db_session.add(ipo)
        db_session.commit()
        db_session.refresh(ipo)
        
        assert ipo.id is not None
        assert ipo.name == "Test IPO"
    
    def test_create_gmp_data(self, db_session):
        """Test GMP data creation"""
        # First create an IPO
        ipo = IPO(name="Test IPO", company_name="Test Company", 
                 issue_price_min=100, issue_price_max=105)
        db_session.add(ipo)
        db_session.commit()
        
        # Then create GMP data
        gmp_data = GMPData(
            ipo_id=ipo.id,
            source="test_source",
            gmp_value=45.0,
            gmp_percentage=43.2
        )
        
        db_session.add(gmp_data)
        db_session.commit()
        db_session.refresh(gmp_data)
        
        assert gmp_data.id is not None
        assert gmp_data.ipo_id == ipo.id
    
    def test_ipo_gmp_relationship(self, db_session):
        """Test IPO-GMP data relationship"""
        ipo = IPO(name="Test IPO", company_name="Test Company",
                 issue_price_min=100, issue_price_max=105)
        db_session.add(ipo)
        db_session.commit()
        
        # Add multiple GMP records
        for i in range(3):
            gmp_data = GMPData(
                ipo_id=ipo.id,
                source=f"source_{i}",
                gmp_value=40.0 + i,
                gmp_percentage=38.0 + i
            )
            db_session.add(gmp_data)
        
        db_session.commit()
        
        # Test relationship
        db_session.refresh(ipo)
        assert len(ipo.gmp_data) == 3
```

## Frontend Testing

### 1. Component Tests

#### Setup
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

#### Test Structure
```
src/
├── __tests__/
│   ├── components/
│   │   ├── IPOCard.test.tsx
│   │   ├── FilterPanel.test.tsx
│   │   └── Dashboard.test.tsx
│   ├── pages/
│   │   └── index.test.tsx
│   └── utils/
│       └── api.test.ts
├── __mocks__/
│   └── mockData.ts
└── setupTests.ts
```

**IPOCard.test.tsx**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import IPOCard from '@/components/IPOCard'
import { mockIPOs } from '@/lib/mockData'

describe('IPOCard', () => {
  const mockIPO = mockIPOs[0]

  test('renders IPO information correctly', () => {
    render(<IPOCard ipo={mockIPO} />)
    
    expect(screen.getByText(mockIPO.name)).toBeInTheDocument()
    expect(screen.getByText(mockIPO.companyName)).toBeInTheDocument()
    expect(screen.getByText(`₹${mockIPO.issuePriceMin} - ₹${mockIPO.issuePriceMax}`)).toBeInTheDocument()
  })

  test('shows profitable badge for profitable IPOs', () => {
    const profitableIPO = { ...mockIPO, isProfitable: true }
    render(<IPOCard ipo={profitableIPO} />)
    
    expect(screen.getByText('Profitable')).toBeInTheDocument()
  })

  test('expands details when clicked', () => {
    render(<IPOCard ipo={mockIPO} />)
    
    const expandButton = screen.getByText('More Details')
    fireEvent.click(expandButton)
    
    expect(screen.getByText('AI Prediction Factors')).toBeInTheDocument()
  })

  test('displays correct GMP trend icon', () => {
    const positiveGMPIPO = { ...mockIPO, gmpPercentage: 15.5 }
    render(<IPOCard ipo={positiveGMPIPO} />)
    
    // Check for trending up icon (you might need to adjust based on your icon implementation)
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument()
  })
})
```

**FilterPanel.test.tsx**
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import FilterPanel from '@/components/FilterPanel'

describe('FilterPanel', () => {
  const mockFilters = {
    status: 'all',
    minGMP: 0,
    maxGMP: 1000,
    industry: 'all',
    profitableOnly: false
  }

  const mockOnFiltersChange = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders all filter options', () => {
    render(
      <FilterPanel 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByLabelText('Status')).toBeInTheDocument()
    expect(screen.getByLabelText('Industry')).toBeInTheDocument()
    expect(screen.getByLabelText('GMP Range (₹)')).toBeInTheDocument()
  })

  test('calls onFiltersChange when status changes', () => {
    render(
      <FilterPanel 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
        onClose={mockOnClose}
      />
    )
    
    const statusSelect = screen.getByLabelText('Status')
    fireEvent.change(statusSelect, { target: { value: 'open' } })
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: 'open'
    })
  })

  test('resets filters when reset button clicked', () => {
    render(
      <FilterPanel 
        filters={mockFilters} 
        onFiltersChange={mockOnFiltersChange}
        onClose={mockOnClose}
      />
    )
    
    const resetButton = screen.getByText('Reset')
    fireEvent.click(resetButton)
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: 'all',
      minGMP: 0,
      maxGMP: 1000,
      industry: 'all',
      profitableOnly: false
    })
  })
})
```

#### Running Frontend Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test IPOCard.test.tsx
```

## End-to-End Testing

### 1. Playwright Setup

```bash
npm install --save-dev @playwright/test
npx playwright install
```

**playwright.config.ts**
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 2. E2E Test Examples

**e2e/user-journey.spec.ts**
```typescript
import { test, expect } from '@playwright/test'

test.describe('User Journey', () => {
  test('complete user flow from landing to dashboard', async ({ page }) => {
    // Navigate to landing page
    await page.goto('/')
    
    // Check landing page elements
    await expect(page.getByText('Smart IPO Analysis')).toBeVisible()
    await expect(page.getByText('Start Analyzing IPOs')).toBeVisible()
    
    // Click to access dashboard
    await page.getByText('Start Analyzing IPOs').click()
    
    // Verify dashboard loads
    await expect(page.getByText('IPO Dashboard')).toBeVisible()
    await expect(page.getByText('Total IPOs')).toBeVisible()
    
    // Check IPO cards are displayed
    await expect(page.locator('[data-testid="ipo-card"]').first()).toBeVisible()
    
    // Test filtering
    await page.getByText('Filters').click()
    await page.selectOption('[data-testid="status-filter"]', 'open')
    await page.getByText('Apply Filters').click()
    
    // Verify filtered results
    await expect(page.getByText('Open')).toBeVisible()
  })

  test('IPO detail expansion and interaction', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Click on first IPO card
    const firstIPOCard = page.locator('[data-testid="ipo-card"]').first()
    await firstIPOCard.getByText('More Details').click()
    
    // Verify expanded content
    await expect(page.getByText('AI Prediction Factors')).toBeVisible()
    await expect(page.getByText('Track IPO')).toBeVisible()
    
    // Test action buttons
    await page.getByText('Set Alert').click()
    // Add assertions for alert setup modal/flow
  })
})
```

**e2e/notification-flow.spec.ts**
```typescript
import { test, expect } from '@playwright/test'

test.describe('Notification Flow', () => {
  test('user can configure notification preferences', async ({ page }) => {
    // Mock authentication
    await page.goto('/dashboard')
    
    // Open notification settings
    await page.getByTestId('notification-settings').click()
    
    // Configure preferences
    await page.fill('[data-testid="min-profit-input"]', '15')
    await page.check('[data-testid="email-notifications"]')
    await page.uncheck('[data-testid="sms-notifications"]')
    
    // Save preferences
    await page.getByText('Save Preferences').click()
    
    // Verify success message
    await expect(page.getByText('Preferences saved successfully')).toBeVisible()
  })
})
```

## Performance Testing

### 1. Load Testing with Artillery

**artillery.yml**
```yaml
config:
  target: 'http://localhost:8000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "Get IPOs"
    weight: 70
    flow:
      - get:
          url: "/ipos"
      - think: 2
      - get:
          url: "/ipos/{{ $randomInt(1, 100) }}"

  - name: "User Authentication"
    weight: 20
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "test@example.com"
            password: "testpassword"
      - think: 1

  - name: "Get Predictions"
    weight: 10
    flow:
      - get:
          url: "/ipos/{{ $randomInt(1, 50) }}/prediction"
```

### 2. Database Performance Tests

**test_performance.py**
```python
import pytest
import time
from sqlalchemy.orm import Session
from models import IPO, GMPData
import concurrent.futures

class TestPerformance:
    
    def test_bulk_ipo_creation(self, db_session: Session):
        """Test bulk IPO creation performance"""
        start_time = time.time()
        
        ipos = []
        for i in range(1000):
            ipo = IPO(
                name=f"IPO {i}",
                company_name=f"Company {i}",
                issue_price_min=100 + i,
                issue_price_max=105 + i,
                status="upcoming"
            )
            ipos.append(ipo)
        
        db_session.bulk_save_objects(ipos)
        db_session.commit()
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Should complete within 5 seconds
        assert duration < 5.0
        
        # Verify all records created
        count = db_session.query(IPO).count()
        assert count >= 1000
    
    def test_concurrent_gmp_validation(self, db_session: Session):
        """Test concurrent GMP validation performance"""
        from services.gmp_validator import GMPValidator
        
        validator = GMPValidator()
        
        # Create test IPOs
        for i in range(10):
            ipo = IPO(name=f"IPO {i}", company_name=f"Company {i}",
                     issue_price_min=100, issue_price_max=105)
            db_session.add(ipo)
        db_session.commit()
        
        start_time = time.time()
        
        # Run concurrent validations
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = []
            for i in range(1, 11):
                future = executor.submit(validator.validate_ipo_gmp, i, db_session)
                futures.append(future)
            
            results = [future.result() for future in futures]
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Should complete within 10 seconds
        assert duration < 10.0
        assert len(results) == 10
```

## Test Data Management

### 1. Test Fixtures

**conftest.py**
```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Create database session for tests"""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def sample_ipo_data():
    """Sample IPO data for tests"""
    return {
        "name": "Test IPO",
        "company_name": "Test Company Ltd",
        "issue_price_min": 100,
        "issue_price_max": 105,
        "issue_size": 1000,
        "lot_size": 100,
        "status": "upcoming",
        "industry": "Technology"
    }

@pytest.fixture
def authenticated_user():
    """Create authenticated user for tests"""
    from utils.auth import create_access_token
    
    token = create_access_token({"sub": "test@example.com"})
    return {"Authorization": f"Bearer {token}"}
```

### 2. Mock Data Generators

**mock_generators.py**
```python
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker()

def generate_mock_ipo():
    """Generate mock IPO data"""
    base_price = random.randint(50, 500)
    return {
        "name": f"{fake.company()} IPO",
        "company_name": fake.company(),
        "issue_price_min": base_price,
        "issue_price_max": base_price + random.randint(5, 20),
        "issue_size": random.randint(100, 5000),
        "lot_size": random.choice([50, 75, 100, 150, 200]),
        "open_date": fake.future_date(end_date='+30d'),
        "close_date": fake.future_date(end_date='+35d'),
        "listing_date": fake.future_date(end_date='+45d'),
        "status": random.choice(["upcoming", "open", "closed"]),
        "industry": random.choice([
            "Technology", "Healthcare", "Financial Services",
            "Manufacturing", "Energy", "Retail"
        ])
    }

def generate_mock_gmp_data(ipo_id: int, num_records: int = 5):
    """Generate mock GMP data for an IPO"""
    base_gmp = random.uniform(10, 100)
    sources = ["chittorgarh", "ipowatch", "investorgain", "applynse"]
    
    records = []
    for i in range(num_records):
        gmp_value = base_gmp + random.uniform(-10, 10)
        records.append({
            "ipo_id": ipo_id,
            "source": random.choice(sources),
            "gmp_value": max(0, gmp_value),
            "gmp_percentage": (gmp_value / 100) * 100,  # Assuming base price of 100
            "timestamp": datetime.utcnow() - timedelta(hours=random.randint(0, 24)),
            "is_valid": True,
            "confidence": random.uniform(0.6, 1.0)
        })
    
    return records
```

## Continuous Integration

### 1. GitHub Actions Workflow

**.github/workflows/test.yml**
```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-asyncio pytest-cov
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        REDIS_URL: redis://localhost:6379
      run: |
        cd backend
        pytest tests/ -v --cov=. --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
    
    - name: Build application
      run: npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Start services
      run: |
        docker-compose -f deployment/docker-compose.yml up -d
        sleep 30  # Wait for services to start
    
    - name: Run E2E tests
      run: npx playwright test
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
```

## Test Coverage Goals

### Coverage Targets
- **Backend**: Minimum 80% code coverage
- **Frontend**: Minimum 70% code coverage
- **Critical Paths**: 95% coverage for core business logic

### Coverage Reports
```bash
# Backend coverage
cd backend
pytest --cov=. --cov-report=html
open htmlcov/index.html

# Frontend coverage
npm test -- --coverage
open coverage/lcov-report/index.html
```

## Testing Best Practices

### 1. Test Organization
- **Arrange-Act-Assert**: Structure tests clearly
- **Single Responsibility**: One assertion per test
- **Descriptive Names**: Clear test method names
- **Independent Tests**: No test dependencies

### 2. Mock Strategy
- **External APIs**: Always mock external services
- **Database**: Use test database or in-memory DB
- **Time-dependent**: Mock datetime functions
- **Random Data**: Use fixed seeds for reproducibility

### 3. Test Data
- **Minimal Data**: Use only necessary test data
- **Clean State**: Reset data between tests
- **Realistic Data**: Use representative test data
- **Edge Cases**: Test boundary conditions

### 4. Performance Considerations
- **Fast Tests**: Keep unit tests under 100ms
- **Parallel Execution**: Run tests concurrently
- **Resource Cleanup**: Properly clean up resources
- **Test Isolation**: Avoid shared state

## Debugging Tests

### 1. Common Issues
- **Async/Await**: Proper handling of async operations
- **Database State**: Ensure clean database state
- **Mock Configuration**: Correct mock setup
- **Environment Variables**: Test environment configuration

### 2. Debugging Tools
```bash
# Run specific test with verbose output
pytest tests/unit/test_gmp_validator.py::TestGMPValidator::test_validate_ipo_gmp_success -v -s

# Debug with pdb
pytest --pdb tests/unit/test_gmp_validator.py

# Run with logging
pytest --log-cli-level=DEBUG tests/
```

### 3. Test Maintenance
- **Regular Updates**: Keep tests updated with code changes
- **Flaky Tests**: Identify and fix unstable tests
- **Test Reviews**: Include tests in code reviews
- **Documentation**: Document complex test scenarios