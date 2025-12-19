import requests
from bs4 import BeautifulSoup
import time
import random
from typing import Dict, List, Optional
import logging
from datetime import datetime, timedelta
import re
from urllib.parse import urljoin, urlparse
import json
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import asyncio
import aiohttp
from fake_useragent import UserAgent

logger = logging.getLogger(__name__)

class IPOWatchScraper:
    """
    Secure and robust scraper for IPOWatch.in with rate limiting and error handling
    """
    
    def __init__(self):
        self.base_url = "https://www.ipowatch.in"
        self.session = None
        self.ua = UserAgent()
        self.last_request_time = 0
        self.min_delay = 2  # Minimum delay between requests (seconds)
        self.max_retries = 3
        self.timeout = 30
        
        # Setup session with retry strategy
        self.setup_session()
    
    def setup_session(self):
        """
        Setup requests session with retry strategy and proper headers
        """
        self.session = requests.Session()
        
        # Retry strategy
        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            method_whitelist=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        self.session.mount("http://", adapter)
        self.session.mount("https://", adapter)
        
        # Default headers
        self.session.headers.update({
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
    
    def rate_limit(self):
        """
        Implement rate limiting to be respectful to the server
        """
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < self.min_delay:
            sleep_time = self.min_delay - time_since_last + random.uniform(0.5, 1.5)
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f} seconds")
            time.sleep(sleep_time)
        
        self.last_request_time = time.time()
    
    def make_request(self, url: str, **kwargs) -> Optional[requests.Response]:
        """
        Make HTTP request with rate limiting and error handling
        """
        self.rate_limit()
        
        try:
            # Rotate User-Agent for each request
            self.session.headers['User-Agent'] = self.ua.random
            
            response = self.session.get(url, timeout=self.timeout, **kwargs)
            response.raise_for_status()
            
            logger.debug(f"Successfully fetched: {url}")
            return response
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Request failed for {url}: {e}")
            return None
    
    def parse_gmp_data(self, html: str) -> List[Dict]:
        """
        Parse GMP data from IPOWatch HTML
        """
        soup = BeautifulSoup(html, 'html.parser')
        gmp_data = []
        
        try:
            # Look for different possible table structures
            tables = soup.find_all('table')
            
            for table in tables:
                # Check if this table contains GMP data
                headers = table.find('tr')
                if not headers:
                    continue
                
                header_texts = [th.get_text(strip=True).lower() for th in headers.find_all(['th', 'td'])]
                
                # Check if this looks like a GMP table
                if any(keyword in ' '.join(header_texts) for keyword in ['gmp', 'grey', 'market', 'premium', 'ipo']):
                    rows = table.find_all('tr')[1:]  # Skip header
                    
                    for row in rows:
                        cells = row.find_all(['td', 'th'])
                        if len(cells) >= 3:  # Minimum columns for IPO data
                            try:
                                ipo_data = self.extract_ipo_data_from_row(cells)
                                if ipo_data:
                                    gmp_data.append(ipo_data)
                            except Exception as e:
                                logger.warning(f"Error parsing row: {e}")
                                continue
            
            # Also look for card-based layouts
            cards = soup.find_all(['div'], class_=re.compile(r'ipo|card|item', re.I))
            for card in cards:
                try:
                    ipo_data = self.extract_ipo_data_from_card(card)
                    if ipo_data:
                        gmp_data.append(ipo_data)
                except Exception as e:
                    logger.warning(f"Error parsing card: {e}")
                    continue
        
        except Exception as e:
            logger.error(f"Error parsing GMP data: {e}")
        
        return gmp_data
    
    def extract_ipo_data_from_row(self, cells) -> Optional[Dict]:
        """
        Extract IPO data from table row cells
        """
        try:
            cell_texts = [cell.get_text(strip=True) for cell in cells]
            
            # Common patterns for IPO data
            ipo_name = None
            gmp_value = None
            issue_price = None
            
            for i, text in enumerate(cell_texts):
                # Look for IPO name (usually first column or contains company keywords)
                if not ipo_name and (i == 0 or any(keyword in text.lower() for keyword in ['ltd', 'limited', 'inc', 'corp'])):
                    ipo_name = text
                
                # Look for GMP value (contains ₹ or numbers)
                if '₹' in text or re.search(r'\d+', text):
                    numbers = re.findall(r'[-+]?\d*\.?\d+', text)
                    if numbers:
                        value = float(numbers[0])
                        if 'gmp' in text.lower() or (not gmp_value and 10 <= value <= 1000):
                            gmp_value = value
                        elif 'price' in text.lower() or (not issue_price and 50 <= value <= 5000):
                            issue_price = value
            
            if ipo_name and gmp_value is not None:
                return {
                    'ipo_name': ipo_name,
                    'gmp': gmp_value,
                    'issue_price': issue_price,
                    'source': 'ipowatch',
                    'scraped_at': datetime.now().isoformat(),
                    'raw_data': cell_texts
                }
        
        except Exception as e:
            logger.debug(f"Error extracting from row: {e}")
        
        return None
    
    def extract_ipo_data_from_card(self, card) -> Optional[Dict]:
        """
        Extract IPO data from card/div elements
        """
        try:
            text = card.get_text(strip=True)
            
            # Look for IPO name in headings
            ipo_name = None
            headings = card.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for heading in headings:
                heading_text = heading.get_text(strip=True)
                if any(keyword in heading_text.lower() for keyword in ['ltd', 'limited', 'ipo']):
                    ipo_name = heading_text
                    break
            
            # Extract numbers for GMP and price
            numbers = re.findall(r'₹?\s*[-+]?\d*\.?\d+', text)
            gmp_value = None
            issue_price = None
            
            for num_text in numbers:
                try:
                    value = float(re.findall(r'[-+]?\d*\.?\d+', num_text)[0])
                    if 'gmp' in text.lower() and not gmp_value:
                        gmp_value = value
                    elif 'price' in text.lower() and not issue_price:
                        issue_price = value
                except:
                    continue
            
            if ipo_name and gmp_value is not None:
                return {
                    'ipo_name': ipo_name,
                    'gmp': gmp_value,
                    'issue_price': issue_price,
                    'source': 'ipowatch',
                    'scraped_at': datetime.now().isoformat(),
                    'raw_data': text[:200]  # First 200 chars for debugging
                }
        
        except Exception as e:
            logger.debug(f"Error extracting from card: {e}")
        
        return None
    
    def fetch_current_gmp_data(self) -> List[Dict]:
        """
        Fetch current GMP data from IPOWatch
        """
        logger.info("Fetching GMP data from IPOWatch...")
        
        # Try multiple possible URLs
        urls_to_try = [
            f"{self.base_url}/",
            f"{self.base_url}/ipo-gmp/",
            f"{self.base_url}/current-ipo/",
            f"{self.base_url}/live-gmp/"
        ]
        
        all_gmp_data = []
        
        for url in urls_to_try:
            try:
                response = self.make_request(url)
                if response and response.status_code == 200:
                    gmp_data = self.parse_gmp_data(response.text)
                    all_gmp_data.extend(gmp_data)
                    logger.info(f"Found {len(gmp_data)} IPOs from {url}")
                else:
                    logger.warning(f"Failed to fetch from {url}")
            
            except Exception as e:
                logger.error(f"Error fetching from {url}: {e}")
                continue
        
        # Remove duplicates based on IPO name
        unique_data = {}
        for item in all_gmp_data:
            name = item['ipo_name'].lower().strip()
            if name not in unique_data or item['gmp'] > 0:
                unique_data[name] = item
        
        final_data = list(unique_data.values())
        logger.info(f"Total unique IPOs found: {len(final_data)}")
        
        return final_data
    
    def fetch_ipo_details(self, ipo_name: str) -> Optional[Dict]:
        """
        Fetch detailed information for a specific IPO
        """
        logger.info(f"Fetching details for IPO: {ipo_name}")
        
        # Search for the IPO
        search_urls = [
            f"{self.base_url}/search?q={ipo_name.replace(' ', '+')}",
            f"{self.base_url}/ipo/{ipo_name.lower().replace(' ', '-')}/"
        ]
        
        for url in search_urls:
            try:
                response = self.make_request(url)
                if response and response.status_code == 200:
                    details = self.parse_ipo_details(response.text, ipo_name)
                    if details:
                        return details
            except Exception as e:
                logger.error(f"Error fetching IPO details from {url}: {e}")
        
        return None
    
    def parse_ipo_details(self, html: str, ipo_name: str) -> Optional[Dict]:
        """
        Parse detailed IPO information from HTML
        """
        soup = BeautifulSoup(html, 'html.parser')
        
        try:
            details = {
                'ipo_name': ipo_name,
                'source': 'ipowatch',
                'scraped_at': datetime.now().isoformat()
            }
            
            # Look for key-value pairs in the page
            text = soup.get_text()
            
            # Extract issue price
            price_match = re.search(r'issue\s+price[:\s]+₹?\s*(\d+(?:\.\d+)?)\s*-?\s*₹?\s*(\d+(?:\.\d+)?)?', text, re.I)
            if price_match:
                details['issue_price_min'] = float(price_match.group(1))
                details['issue_price_max'] = float(price_match.group(2)) if price_match.group(2) else details['issue_price_min']
            
            # Extract issue size
            size_match = re.search(r'issue\s+size[:\s]+₹?\s*(\d+(?:\.\d+)?)\s*(crore|cr)?', text, re.I)
            if size_match:
                details['issue_size'] = float(size_match.group(1))
            
            # Extract lot size
            lot_match = re.search(r'lot\s+size[:\s]+(\d+)', text, re.I)
            if lot_match:
                details['lot_size'] = int(lot_match.group(1))
            
            # Extract dates
            date_patterns = [
                r'open[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'close[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})',
                r'listing[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})'
            ]
            
            for pattern in date_patterns:
                match = re.search(pattern, text, re.I)
                if match:
                    date_str = match.group(1)
                    try:
                        # Try different date formats
                        for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%d-%m-%y', '%d/%m/%y']:
                            try:
                                date_obj = datetime.strptime(date_str, fmt)
                                if 'open' in pattern:
                                    details['open_date'] = date_obj.isoformat()
                                elif 'close' in pattern:
                                    details['close_date'] = date_obj.isoformat()
                                elif 'listing' in pattern:
                                    details['listing_date'] = date_obj.isoformat()
                                break
                            except ValueError:
                                continue
                    except:
                        pass
            
            return details if len(details) > 3 else None  # At least some data found
        
        except Exception as e:
            logger.error(f"Error parsing IPO details: {e}")
            return None
    
    def validate_gmp_data(self, gmp_data: List[Dict]) -> List[Dict]:
        """
        Validate and clean scraped GMP data
        """
        validated_data = []
        
        for item in gmp_data:
            try:
                # Basic validation
                if not item.get('ipo_name') or not isinstance(item.get('gmp'), (int, float)):
                    continue
                
                # Clean IPO name
                item['ipo_name'] = re.sub(r'\s+', ' ', item['ipo_name']).strip()
                
                # Validate GMP range (reasonable values)
                gmp = float(item['gmp'])
                if not (-100 <= gmp <= 1000):  # GMP typically in this range
                    logger.warning(f"Suspicious GMP value {gmp} for {item['ipo_name']}")
                    continue
                
                # Add confidence score based on data completeness
                confidence = 0.7  # Base confidence
                if item.get('issue_price'):
                    confidence += 0.1
                if item.get('raw_data'):
                    confidence += 0.1
                
                item['confidence'] = min(confidence, 1.0)
                item['validated_at'] = datetime.now().isoformat()
                
                validated_data.append(item)
            
            except Exception as e:
                logger.warning(f"Error validating item {item}: {e}")
                continue
        
        logger.info(f"Validated {len(validated_data)} out of {len(gmp_data)} items")
        return validated_data
    
    def close(self):
        """
        Close the session
        """
        if self.session:
            self.session.close()

class AsyncIPOWatchScraper:
    """
    Async version of IPOWatch scraper for better performance
    """
    
    def __init__(self):
        self.base_url = "https://www.ipowatch.in"
        self.ua = UserAgent()
        self.semaphore = asyncio.Semaphore(3)  # Limit concurrent requests
        self.min_delay = 1
    
    async def fetch_with_session(self, session: aiohttp.ClientSession, url: str) -> Optional[str]:
        """
        Fetch URL with async session
        """
        async with self.semaphore:
            try:
                await asyncio.sleep(random.uniform(0.5, 1.5))  # Random delay
                
                headers = {
                    'User-Agent': self.ua.random,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
                
                async with session.get(url, headers=headers, timeout=30) as response:
                    if response.status == 200:
                        return await response.text()
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")
                        return None
            
            except Exception as e:
                logger.error(f"Error fetching {url}: {e}")
                return None
    
    async def fetch_all_gmp_data(self) -> List[Dict]:
        """
        Fetch GMP data from multiple URLs concurrently
        """
        urls = [
            f"{self.base_url}/",
            f"{self.base_url}/ipo-gmp/",
            f"{self.base_url}/current-ipo/"
        ]
        
        async with aiohttp.ClientSession() as session:
            tasks = [self.fetch_with_session(session, url) for url in urls]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            all_data = []
            scraper = IPOWatchScraper()  # Use sync scraper for parsing
            
            for i, result in enumerate(results):
                if isinstance(result, str):
                    gmp_data = scraper.parse_gmp_data(result)
                    all_data.extend(gmp_data)
                    logger.info(f"Async fetch from {urls[i]}: {len(gmp_data)} items")
            
            return scraper.validate_gmp_data(all_data)

# Utility functions
def get_latest_gmp_data() -> List[Dict]:
    """
    Get latest GMP data using the scraper
    """
    scraper = IPOWatchScraper()
    try:
        gmp_data = scraper.fetch_current_gmp_data()
        validated_data = scraper.validate_gmp_data(gmp_data)
        return validated_data
    finally:
        scraper.close()

async def get_latest_gmp_data_async() -> List[Dict]:
    """
    Get latest GMP data using async scraper
    """
    scraper = AsyncIPOWatchScraper()
    return await scraper.fetch_all_gmp_data()

def get_ipo_details(ipo_name: str) -> Optional[Dict]:
    """
    Get detailed information for a specific IPO
    """
    scraper = IPOWatchScraper()
    try:
        return scraper.fetch_ipo_details(ipo_name)
    finally:
        scraper.close()