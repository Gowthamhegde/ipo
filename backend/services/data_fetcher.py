import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime, timedelta
import asyncio
import aiohttp
from typing import List, Dict, Optional
import logging
from sqlalchemy.orm import Session

from models import IPO, GMPData, DataSource
from utils.logger import get_logger
from utils.cache import cache_manager

logger = get_logger(__name__)

class DataFetcher:
    """Fetches IPO and GMP data from multiple sources"""
    
    def __init__(self):
        self.sources = {
            "chittorgarh": {
                "url": "https://www.chittorgarh.com/ipo/ipo_grey_market_premium.asp",
                "parser": self._parse_chittorgarh
            },
            "ipowatch": {
                "url": "https://ipowatch.in/",
                "parser": self._parse_ipowatch
            },
            "investorgain": {
                "url": "https://www.investorgain.com/report/live-ipo-gmp/331/",
                "parser": self._parse_investorgain
            },
            "applynse": {
                "url": "https://www.applynse.com/ipo-gmp/",
                "parser": self._parse_applynse
            }
        }
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    async def fetch_all_sources(self, db: Session) -> Dict[str, List[Dict]]:
        """Fetch data from all sources concurrently"""
        results = {}
        
        async with aiohttp.ClientSession() as session:
            tasks = []
            for source_name, config in self.sources.items():
                task = self._fetch_source_data(session, source_name, config)
                tasks.append(task)
            
            source_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, (source_name, _) in enumerate(self.sources.items()):
                result = source_results[i]
                if isinstance(result, Exception):
                    logger.error(f"Error fetching from {source_name}: {result}")
                    results[source_name] = []
                else:
                    results[source_name] = result
                    await self._save_source_data(db, source_name, result)
        
        return results

    async def _fetch_source_data(self, session: aiohttp.ClientSession, source_name: str, config: Dict) -> List[Dict]:
        """Fetch data from a single source"""
        try:
            # Check cache first
            cached_data = cache_manager.get(f"source_data_{source_name}")
            if cached_data:
                return cached_data
            
            async with session.get(config["url"], timeout=30) as response:
                if response.status == 200:
                    html = await response.text()
                    data = config["parser"](html)
                    
                    # Cache for 30 minutes
                    cache_manager.set(f"source_data_{source_name}", data, 1800)
                    
                    logger.info(f"Successfully fetched {len(data)} IPOs from {source_name}")
                    return data
                else:
                    logger.warning(f"HTTP {response.status} from {source_name}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error fetching from {source_name}: {e}")
            return []

    def _parse_chittorgarh(self, html: str) -> List[Dict]:
        """Parse Chittorgarh IPO data"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            ipos = []
            
            # Find the IPO table
            table = soup.find('table', {'class': 'table'})
            if not table:
                return []
            
            rows = table.find_all('tr')[1:]  # Skip header
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 6:
                    try:
                        ipo_data = {
                            'name': cols[0].get_text(strip=True),
                            'price_band': cols[1].get_text(strip=True),
                            'open_date': self._parse_date(cols[2].get_text(strip=True)),
                            'close_date': self._parse_date(cols[3].get_text(strip=True)),
                            'gmp': self._parse_gmp(cols[4].get_text(strip=True)),
                            'listing_gain': cols[5].get_text(strip=True),
                            'source': 'chittorgarh'
                        }
                        
                        if ipo_data['gmp'] is not None:
                            ipos.append(ipo_data)
                            
                    except Exception as e:
                        logger.warning(f"Error parsing row in Chittorgarh: {e}")
                        continue
            
            return ipos
            
        except Exception as e:
            logger.error(f"Error parsing Chittorgarh data: {e}")
            return []

    def _parse_ipowatch(self, html: str) -> List[Dict]:
        """Parse IPOWatch data"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            ipos = []
            
            # Find IPO cards or table
            ipo_elements = soup.find_all('div', {'class': 'ipo-card'}) or soup.find_all('tr', {'class': 'ipo-row'})
            
            for element in ipo_elements:
                try:
                    # Extract IPO information based on IPOWatch structure
                    name = element.find('h3') or element.find('td', {'class': 'ipo-name'})
                    gmp_element = element.find('span', {'class': 'gmp'}) or element.find('td', {'class': 'gmp'})
                    
                    if name and gmp_element:
                        ipo_data = {
                            'name': name.get_text(strip=True),
                            'gmp': self._parse_gmp(gmp_element.get_text(strip=True)),
                            'source': 'ipowatch'
                        }
                        
                        if ipo_data['gmp'] is not None:
                            ipos.append(ipo_data)
                            
                except Exception as e:
                    logger.warning(f"Error parsing IPOWatch element: {e}")
                    continue
            
            return ipos
            
        except Exception as e:
            logger.error(f"Error parsing IPOWatch data: {e}")
            return []

    def _parse_investorgain(self, html: str) -> List[Dict]:
        """Parse InvestorGain data"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            ipos = []
            
            table = soup.find('table')
            if not table:
                return []
            
            rows = table.find_all('tr')[1:]  # Skip header
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 4:
                    try:
                        ipo_data = {
                            'name': cols[0].get_text(strip=True),
                            'gmp': self._parse_gmp(cols[2].get_text(strip=True)),
                            'source': 'investorgain'
                        }
                        
                        if ipo_data['gmp'] is not None:
                            ipos.append(ipo_data)
                            
                    except Exception as e:
                        logger.warning(f"Error parsing InvestorGain row: {e}")
                        continue
            
            return ipos
            
        except Exception as e:
            logger.error(f"Error parsing InvestorGain data: {e}")
            return []

    def _parse_applynse(self, html: str) -> List[Dict]:
        """Parse ApplyNSE data"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            ipos = []
            
            # Find the GMP table
            gmp_table = soup.find('table', {'id': 'gmp-table'}) or soup.find('table', {'class': 'gmp'})
            if not gmp_table:
                return []
            
            rows = gmp_table.find_all('tr')[1:]  # Skip header
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 3:
                    try:
                        ipo_data = {
                            'name': cols[0].get_text(strip=True),
                            'gmp': self._parse_gmp(cols[1].get_text(strip=True)),
                            'source': 'applynse'
                        }
                        
                        if ipo_data['gmp'] is not None:
                            ipos.append(ipo_data)
                            
                    except Exception as e:
                        logger.warning(f"Error parsing ApplyNSE row: {e}")
                        continue
            
            return ipos
            
        except Exception as e:
            logger.error(f"Error parsing ApplyNSE data: {e}")
            return []

    def _parse_gmp(self, gmp_text: str) -> Optional[float]:
        """Parse GMP value from text"""
        try:
            # Remove currency symbols and extra spaces
            gmp_text = gmp_text.replace('₹', '').replace('Rs', '').replace(',', '').strip()
            
            # Handle percentage format
            if '%' in gmp_text:
                return float(gmp_text.replace('%', ''))
            
            # Handle negative values
            if gmp_text.startswith('-'):
                return -float(gmp_text[1:])
            
            # Handle regular numbers
            if gmp_text.replace('.', '').isdigit():
                return float(gmp_text)
            
            return None
            
        except (ValueError, AttributeError):
            return None

    def _parse_date(self, date_text: str) -> Optional[datetime]:
        """Parse date from various formats"""
        try:
            # Common date formats
            formats = [
                '%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d',
                '%d %b %Y', '%d %B %Y', '%b %d, %Y'
            ]
            
            date_text = date_text.strip()
            
            for fmt in formats:
                try:
                    return datetime.strptime(date_text, fmt)
                except ValueError:
                    continue
            
            return None
            
        except Exception:
            return None

    async def _save_source_data(self, db: Session, source_name: str, data: List[Dict]):
        """Save fetched data to database"""
        try:
            for ipo_data in data:
                # Find or create IPO
                ipo = db.query(IPO).filter(IPO.name.ilike(f"%{ipo_data['name']}%")).first()
                
                if not ipo:
                    # Create new IPO if not exists
                    ipo = IPO(
                        name=ipo_data['name'],
                        company_name=ipo_data['name'],
                        issue_price_min=0,  # Will be updated later
                        issue_price_max=0,
                        status='upcoming'
                    )
                    db.add(ipo)
                    db.commit()
                    db.refresh(ipo)
                
                # Save GMP data
                if 'gmp' in ipo_data and ipo_data['gmp'] is not None:
                    gmp_entry = GMPData(
                        ipo_id=ipo.id,
                        source=source_name,
                        gmp_value=ipo_data['gmp'],
                        gmp_percentage=ipo_data['gmp'],  # Assuming percentage for now
                        timestamp=datetime.utcnow()
                    )
                    db.add(gmp_entry)
            
            db.commit()
            logger.info(f"Saved {len(data)} records from {source_name}")
            
        except Exception as e:
            logger.error(f"Error saving data from {source_name}: {e}")
            db.rollback()

    def fetch_nse_data(self) -> List[Dict]:
        """Fetch IPO data from NSE"""
        try:
            # NSE API endpoints (these may change)
            nse_url = "https://www.nseindia.com/api/ipo-current-issues"
            
            response = self.session.get(nse_url)
            if response.status_code == 200:
                data = response.json()
                return self._process_nse_data(data)
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching NSE data: {e}")
            return []

    def fetch_bse_data(self) -> List[Dict]:
        """Fetch IPO data from BSE"""
        try:
            # BSE website scraping
            bse_url = "https://www.bseindia.com/corporates/Forthcoming_Issues.aspx"
            
            response = self.session.get(bse_url)
            if response.status_code == 200:
                return self._parse_bse_data(response.text)
            
            return []
            
        except Exception as e:
            logger.error(f"Error fetching BSE data: {e}")
            return []

    def _process_nse_data(self, data: Dict) -> List[Dict]:
        """Process NSE API response"""
        ipos = []
        try:
            if 'data' in data:
                for item in data['data']:
                    ipo_data = {
                        'name': item.get('companyName', ''),
                        'issue_size': item.get('issueSize', 0),
                        'price_band': f"{item.get('priceFrom', 0)}-{item.get('priceTo', 0)}",
                        'open_date': item.get('issueStartDate'),
                        'close_date': item.get('issueEndDate'),
                        'source': 'nse'
                    }
                    ipos.append(ipo_data)
        except Exception as e:
            logger.error(f"Error processing NSE data: {e}")
        
        return ipos

    def _parse_bse_data(self, html: str) -> List[Dict]:
        """Parse BSE IPO data"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            ipos = []
            
            # Find IPO table on BSE
            table = soup.find('table', {'id': 'ContentPlaceHolder1_gvData'})
            if not table:
                return []
            
            rows = table.find_all('tr')[1:]  # Skip header
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) >= 5:
                    try:
                        ipo_data = {
                            'name': cols[0].get_text(strip=True),
                            'issue_size': cols[1].get_text(strip=True),
                            'price_band': cols[2].get_text(strip=True),
                            'open_date': self._parse_date(cols[3].get_text(strip=True)),
                            'close_date': self._parse_date(cols[4].get_text(strip=True)),
                            'source': 'bse'
                        }
                        ipos.append(ipo_data)
                    except Exception as e:
                        logger.warning(f"Error parsing BSE row: {e}")
                        continue
            
            return ipos
            
        except Exception as e:
            logger.error(f"Error parsing BSE data: {e}")
            return []