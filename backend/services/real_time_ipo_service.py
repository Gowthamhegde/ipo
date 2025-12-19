"""
Real-time IPO Data Service
Handles automatic fetching, processing, and storage of IPO data from multiple sources
"""

import asyncio
import aiohttp
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import re
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from database import get_db
from models import IPO
from utils.cache import cache_manager
from utils.logger import get_logger

logger = get_logger(__name__)

class RealTimeIPOService:
    def __init__(self):
        self.sources = {
            'chittorgarh': 'https://www.chittorgarh.com/ipo/ipo_list_2024.asp',
            'ipowatch': 'https://ipowatch.in/',
            'nse': 'https://www.nseindia.com/market-data/securities-available-for-trading',
            'bse': 'https://www.bseindia.com/corporates/Forthcoming_Issues.aspx'
        }
        self.session = None
        self.is_running = False
        self.last_fetch = None
        
    async def start_service(self):
        """Start the real-time IPO data fetching service"""
        if self.is_running:
            logger.info("Real-time IPO service already running")
            return
            
        self.is_running = True
        logger.info("🚀 Starting real-time IPO data service...")
        
        # Create aiohttp session
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        
        # Initial fetch
        await self.fetch_all_ipo_data()
        
        # Schedule periodic fetching
        asyncio.create_task(self._periodic_fetch())
        
        logger.info("✅ Real-time IPO service started")
    
    async def stop_service(self):
        """Stop the real-time IPO data fetching service"""
        self.is_running = False
        if self.session:
            await self.session.close()
        logger.info("⏹️ Real-time IPO service stopped")
    
    async def _periodic_fetch(self):
        """Periodically fetch IPO data every 6 hours"""
        while self.is_running:
            try:
                await asyncio.sleep(6 * 60 * 60)  # 6 hours
                if self.is_running:
                    await self.fetch_all_ipo_data()
            except Exception as e:
                logger.error(f"Error in periodic fetch: {e}")
                await asyncio.sleep(60)  # Wait 1 minute before retry
    
    async def fetch_all_ipo_data(self) -> List[Dict]:
        """Fetch IPO data from all sources"""
        try:
            logger.info("🔄 Fetching IPO data from all sources...")
            
            # Fetch from all sources concurrently
            tasks = [
                self.fetch_from_chittorgarh(),
                self.fetch_from_ipowatch(),
                self.fetch_from_nse(),
                self.fetch_from_bse(),
                self.fetch_mock_data()  # Fallback mock data
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            all_ipos = []
            source_names = ['Chittorgarh', 'IPOWatch', 'NSE', 'BSE', 'Mock']
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Error fetching from {source_names[i]}: {result}")
                    continue
                    
                if result and len(result) > 0:
                    logger.info(f"✅ {source_names[i]}: Found {len(result)} IPOs")
                    all_ipos.extend(result)
            
            # Process and deduplicate
            unique_ipos = self._remove_duplicates(all_ipos)
            processed_ipos = self._process_ipo_data(unique_ipos)
            
            if processed_ipos:
                # Save to database
                await self._save_to_database(processed_ipos)
                
                # Cache the data
                cache_manager.set('latest_ipo_data', processed_ipos, ttl=3600)
                
                self.last_fetch = datetime.now().isoformat()
                logger.info(f"🎯 Successfully processed {len(processed_ipos)} IPOs")
                
                return processed_ipos
            else:
                logger.warning("⚠️ No IPO data found from any source")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error fetching IPO data: {e}")
            return []
    
    async def fetch_from_chittorgarh(self) -> List[Dict]:
        """Fetch IPO data from Chittorgarh"""
        try:
            if not self.session:
                return []
                
            async with self.session.get(self.sources['chittorgarh']) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}")
                
                html = await response.text()
                return self._parse_chittorgarh_html(html)
                
        except Exception as e:
            logger.warning(f"Chittorgarh fetch failed: {e}")
            return []
    
    def _parse_chittorgarh_html(self, html: str) -> List[Dict]:
        """Parse Chittorgarh HTML for IPO data"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            ipos = []
            
            # Find IPO table
            table = soup.find('table', {'class': 'table'}) or soup.find('table')
            if not table:
                return []
            
            rows = table.find_all('tr')[1:]  # Skip header
            
            for row in rows[:20]:  # Limit to 20 IPOs
                cells = row.find_all('td')
                if len(cells) >= 6:
                    ipo = self._parse_chittorgarh_row(cells)
                    if ipo:
                        ipos.append(ipo)
            
            return ipos
            
        except Exception as e:
            logger.error(f"Error parsing Chittorgarh HTML: {e}")
            return []
    
    def _parse_chittorgarh_row(self, cells) -> Optional[Dict]:
        """Parse individual Chittorgarh table row"""
        try:
            name = cells[0].get_text(strip=True)
            price_range = cells[1].get_text(strip=True)
            open_date = cells[2].get_text(strip=True)
            close_date = cells[3].get_text(strip=True)
            gmp_text = cells[4].get_text(strip=True)
            gmp_percent_text = cells[5].get_text(strip=True) if len(cells) > 5 else '0'
            
            if not name or len(name) < 3:
                return None
            
            # Parse GMP
            gmp = self._parse_number(gmp_text)
            gmp_percent = self._parse_number(gmp_percent_text)
            
            # Parse price range
            price_match = re.search(r'(\d+).*?(\d+)', price_range)
            min_price = int(price_match.group(1)) if price_match else 100
            max_price = int(price_match.group(2)) if price_match else min_price + 10
            
            return {
                'id': f"chittorgarh_{datetime.now().timestamp()}_{hash(name) % 10000}",
                'name': f"{name} IPO",
                'company': name,
                'price_range': f"₹{min_price} - ₹{max_price}",
                'issue_size': self._estimate_issue_size(),
                'gmp': gmp,
                'gmp_percent': gmp_percent,
                'status': self._normalize_status('upcoming'),
                'is_profitable': gmp >= 20 or gmp_percent >= 10,
                'open_date': self._format_date(open_date),
                'close_date': self._format_date(close_date),
                'listing_date': self._calculate_listing_date(close_date),
                'confidence_score': min(0.9, max(0.6, 0.7 + (gmp / 100))),
                'industry': self._guess_industry(name),
                'lot_size': self._calculate_lot_size(min_price),
                'board_type': self._guess_board_type(name),
                'source': 'chittorgarh'
            }
            
        except Exception as e:
            logger.error(f"Error parsing Chittorgarh row: {e}")
            return None
    
    async def fetch_from_ipowatch(self) -> List[Dict]:
        """Fetch IPO data from IPOWatch"""
        try:
            # Mock implementation - replace with actual API when available
            return self._generate_mock_data('ipowatch', 5)
        except Exception as e:
            logger.warning(f"IPOWatch fetch failed: {e}")
            return []
    
    async def fetch_from_nse(self) -> List[Dict]:
        """Fetch IPO data from NSE"""
        try:
            # Mock implementation - replace with actual API when available
            return self._generate_mock_data('nse', 3)
        except Exception as e:
            logger.warning(f"NSE fetch failed: {e}")
            return []
    
    async def fetch_from_bse(self) -> List[Dict]:
        """Fetch IPO data from BSE"""
        try:
            # Mock implementation - replace with actual API when available
            return self._generate_mock_data('bse', 4)
        except Exception as e:
            logger.warning(f"BSE fetch failed: {e}")
            return []
    
    async def fetch_mock_data(self) -> List[Dict]:
        """Generate mock IPO data for testing"""
        return self._generate_mock_data('mock', 8)
    
    def _generate_mock_data(self, source: str, count: int) -> List[Dict]:
        """Generate mock IPO data"""
        companies = [
            'TechCorp Solutions', 'Green Energy Ltd', 'FinTech Innovations',
            'Healthcare Plus', 'Digital Media Co', 'Smart Logistics',
            'EduTech Systems', 'Food & Beverages Ltd', 'Renewable Power',
            'AI Technologies', 'Biotech Research', 'E-commerce Hub'
        ]
        
        industries = [
            'Technology', 'Energy', 'Finance', 'Healthcare', 'Media',
            'Logistics', 'Education', 'FMCG', 'Power', 'Biotechnology'
        ]
        
        import random
        ipos = []
        
        for i in range(count):
            company = random.choice(companies)
            industry = random.choice(industries)
            min_price = random.randint(100, 500)
            max_price = min_price + random.randint(20, 100)
            gmp = random.randint(-50, 200)
            gmp_percent = (gmp / min_price) * 100
            
            ipos.append({
                'id': f"{source}_{datetime.now().timestamp()}_{i}",
                'name': f"{company} IPO",
                'company': company,
                'price_range': f"₹{min_price} - ₹{max_price}",
                'issue_size': random.randint(500, 5000),
                'gmp': gmp,
                'gmp_percent': round(gmp_percent, 2),
                'status': random.choice(['Upcoming', 'Open', 'Closed']),
                'is_profitable': gmp >= 20 or gmp_percent >= 10,
                'open_date': self._get_random_future_date(-5, 5),
                'close_date': self._get_random_future_date(5, 15),
                'listing_date': self._get_random_future_date(15, 25),
                'confidence_score': round(random.uniform(0.6, 1.0), 2),
                'industry': industry,
                'lot_size': self._calculate_lot_size(min_price),
                'board_type': 'SME' if random.random() > 0.7 else 'Main Board',
                'source': source
            })
        
        return ipos
    
    def _remove_duplicates(self, ipos: List[Dict]) -> List[Dict]:
        """Remove duplicate IPOs based on company name"""
        seen = set()
        unique_ipos = []
        
        for ipo in ipos:
            key = ipo['company'].lower().replace(' ', '')
            if key not in seen:
                seen.add(key)
                unique_ipos.append(ipo)
        
        return unique_ipos
    
    def _process_ipo_data(self, ipos: List[Dict]) -> List[Dict]:
        """Process and enhance IPO data"""
        processed = []
        
        for ipo in ipos:
            # Add calculated fields
            ipo['estimated_gain'] = max(0, ipo['gmp'] * ipo['lot_size'])
            ipo['risk_level'] = self._calculate_risk_level(ipo)
            ipo['recommendation'] = self._generate_recommendation(ipo)
            ipo['last_updated'] = datetime.now().isoformat()
            
            processed.append(ipo)
        
        return processed
    
    async def _save_to_database(self, ipos: List[Dict]):
        """Save IPO data to database"""
        try:
            db = next(get_db())
            
            for ipo_data in ipos:
                # Check if IPO already exists
                existing = db.query(IPO).filter(IPO.company == ipo_data['company']).first()
                
                if existing:
                    # Update existing IPO
                    for key, value in ipo_data.items():
                        if hasattr(existing, key):
                            setattr(existing, key, value)
                else:
                    # Create new IPO
                    ipo = IPO(**ipo_data)
                    db.add(ipo)
            
            db.commit()
            logger.info(f"💾 Saved {len(ipos)} IPOs to database")
            
        except Exception as e:
            logger.error(f"Error saving to database: {e}")
            db.rollback()
        finally:
            db.close()
    
    # Utility methods
    def _parse_number(self, text: str) -> float:
        """Parse number from text"""
        match = re.search(r'-?\d+\.?\d*', str(text))
        return float(match.group()) if match else 0.0
    
    def _normalize_status(self, status: str) -> str:
        """Normalize IPO status"""
        status_map = {
            'open': 'Open',
            'closed': 'Closed',
            'upcoming': 'Upcoming',
            'listed': 'Listed',
            'withdrawn': 'Withdrawn'
        }
        return status_map.get(status.lower(), 'Unknown')
    
    def _format_date(self, date_str: str) -> str:
        """Format date string"""
        try:
            if not date_str:
                return datetime.now().strftime('%Y-%m-%d')
            
            # Try to parse various date formats
            for fmt in ['%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y']:
                try:
                    date = datetime.strptime(date_str, fmt)
                    return date.strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            return datetime.now().strftime('%Y-%m-%d')
        except:
            return datetime.now().strftime('%Y-%m-%d')
    
    def _calculate_listing_date(self, close_date: str) -> str:
        """Calculate estimated listing date"""
        try:
            close = datetime.strptime(close_date, '%Y-%m-%d')
            listing = close + timedelta(days=7)
            return listing.strftime('%Y-%m-%d')
        except:
            future = datetime.now() + timedelta(days=14)
            return future.strftime('%Y-%m-%d')
    
    def _guess_industry(self, name: str) -> str:
        """Guess industry from company name"""
        keywords = {
            'Technology': ['tech', 'software', 'digital', 'ai', 'data', 'cyber'],
            'Healthcare': ['health', 'medical', 'pharma', 'bio', 'hospital'],
            'Finance': ['bank', 'finance', 'fintech', 'insurance', 'capital'],
            'Energy': ['energy', 'power', 'solar', 'renewable', 'oil', 'gas'],
            'Manufacturing': ['manufacturing', 'industrial', 'steel', 'auto', 'textile']
        }
        
        name_lower = name.lower()
        
        for industry, words in keywords.items():
            if any(word in name_lower for word in words):
                return industry
        
        return 'Others'
    
    def _calculate_lot_size(self, price: int) -> int:
        """Calculate lot size based on price"""
        if price <= 200:
            return 75
        elif price <= 500:
            return 30
        elif price <= 1000:
            return 15
        else:
            return 10
    
    def _guess_board_type(self, name: str) -> str:
        """Guess board type from company name"""
        sme_keywords = ['micro', 'small', 'sme', 'emerging', 'startup']
        name_lower = name.lower()
        
        return 'SME' if any(keyword in name_lower for keyword in sme_keywords) else 'Main Board'
    
    def _get_random_future_date(self, min_days: int, max_days: int) -> str:
        """Get random future date"""
        import random
        days = random.randint(min_days, max_days)
        future_date = datetime.now() + timedelta(days=days)
        return future_date.strftime('%Y-%m-%d')
    
    def _estimate_issue_size(self) -> int:
        """Estimate issue size"""
        import random
        return random.randint(500, 5000)
    
    def _calculate_risk_level(self, ipo: Dict) -> str:
        """Calculate risk level"""
        risk = 0
        
        if ipo['gmp'] < 0:
            risk += 3
        elif ipo['gmp'] < 20:
            risk += 2
        elif ipo['gmp'] < 50:
            risk += 1
        
        if ipo['confidence_score'] < 0.6:
            risk += 2
        elif ipo['confidence_score'] < 0.8:
            risk += 1
        
        if ipo['board_type'] == 'SME':
            risk += 1
        
        if risk >= 4:
            return 'High'
        elif risk >= 2:
            return 'Medium'
        else:
            return 'Low'
    
    def _generate_recommendation(self, ipo: Dict) -> str:
        """Generate investment recommendation"""
        if ipo['gmp'] >= 50 and ipo['confidence_score'] >= 0.8:
            return 'Strong Buy'
        elif ipo['gmp'] >= 20 and ipo['confidence_score'] >= 0.7:
            return 'Buy'
        elif ipo['gmp'] >= 0 and ipo['confidence_score'] >= 0.6:
            return 'Hold'
        else:
            return 'Avoid'
    
    def get_status(self) -> Dict:
        """Get service status"""
        return {
            'is_running': self.is_running,
            'last_fetch': self.last_fetch,
            'sources': list(self.sources.keys())
        }

# Create singleton instance
real_time_ipo_service = RealTimeIPOService()