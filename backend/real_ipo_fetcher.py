#!/usr/bin/env python3
"""
Real IPO Data Fetcher
Fetches live IPO data from reliable sources
"""

import requests
from bs4 import BeautifulSoup
import json
import re
from datetime import datetime
import time

class RealIPOFetcher:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def fetch_from_chittorgarh(self):
        """Fetch IPO data from Chittorgarh.com"""
        try:
            url = "https://www.chittorgarh.com/ipo/ipo_list_2024.asp"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            ipos = []
            
            # Find IPO table
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows[1:]:  # Skip header
                    cols = row.find_all('td')
                    if len(cols) >= 6:
                        try:
                            name = cols[0].get_text(strip=True)
                            if name and 'IPO' not in name.upper():
                                name += ' IPO'
                            
                            price_range = cols[1].get_text(strip=True)
                            open_date = cols[2].get_text(strip=True)
                            close_date = cols[3].get_text(strip=True)
                            listing_date = cols[4].get_text(strip=True)
                            status = cols[5].get_text(strip=True)
                            
                            if name and price_range:
                                ipo = {
                                    'name': name,
                                    'company': name.replace(' IPO', ''),
                                    'price_range': price_range,
                                    'open_date': self.parse_date(open_date),
                                    'close_date': self.parse_date(close_date),
                                    'listing_date': self.parse_date(listing_date),
                                    'status': self.normalize_status(status),
                                    'source': 'chittorgarh'
                                }
                                ipos.append(ipo)
                        except Exception as e:
                            continue
            
            return ipos[:10]  # Return top 10
            
        except Exception as e:
            print(f"Error fetching from Chittorgarh: {e}")
            return []

    def fetch_from_investorgain(self):
        """Fetch IPO data from InvestorGain"""
        try:
            url = "https://www.investorgain.com/report/live-ipo-gmp/331/"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            ipos = []
            
            # Find IPO data in tables
            tables = soup.find_all('table', class_='table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows[1:]:  # Skip header
                    cols = row.find_all('td')
                    if len(cols) >= 5:
                        try:
                            name = cols[0].get_text(strip=True)
                            price_range = cols[1].get_text(strip=True)
                            gmp_text = cols[2].get_text(strip=True)
                            status = cols[3].get_text(strip=True)
                            
                            # Extract GMP value
                            gmp = self.extract_gmp(gmp_text)
                            
                            if name and price_range:
                                ipo = {
                                    'name': name if 'IPO' in name else f"{name} IPO",
                                    'company': name.replace(' IPO', ''),
                                    'price_range': price_range,
                                    'gmp': gmp,
                                    'status': self.normalize_status(status),
                                    'source': 'investorgain'
                                }
                                ipos.append(ipo)
                        except Exception as e:
                            continue
            
            return ipos[:10]
            
        except Exception as e:
            print(f"Error fetching from InvestorGain: {e}")
            return []

    def fetch_from_ipowatch(self):
        """Fetch IPO data from IPOWatch"""
        try:
            url = "https://www.ipowatch.in/p/ipo-grey-market-premium-latest-ipo-gmp.html"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            ipos = []
            
            # Look for IPO data in various table formats
            tables = soup.find_all('table')
            for table in tables:
                rows = table.find_all('tr')
                for row in rows:
                    cols = row.find_all(['td', 'th'])
                    if len(cols) >= 4:
                        try:
                            text_content = [col.get_text(strip=True) for col in cols]
                            
                            # Look for IPO names and GMP data
                            for i, text in enumerate(text_content):
                                if 'IPO' in text or any(keyword in text.lower() for keyword in ['limited', 'ltd', 'corp', 'inc']):
                                    name = text if 'IPO' in text else f"{text} IPO"
                                    
                                    # Try to find GMP in adjacent columns
                                    gmp = 0
                                    for j in range(max(0, i-2), min(len(text_content), i+3)):
                                        gmp_candidate = self.extract_gmp(text_content[j])
                                        if gmp_candidate != 0:
                                            gmp = gmp_candidate
                                            break
                                    
                                    if name and len(name) > 3:
                                        ipo = {
                                            'name': name,
                                            'company': name.replace(' IPO', ''),
                                            'gmp': gmp,
                                            'status': 'Open',
                                            'source': 'ipowatch'
                                        }
                                        ipos.append(ipo)
                                        break
                        except Exception as e:
                            continue
            
            return ipos[:8]
            
        except Exception as e:
            print(f"Error fetching from IPOWatch: {e}")
            return []

    def fetch_nse_ipo_data(self):
        """Fetch IPO data from NSE"""
        try:
            url = "https://www.nseindia.com/api/ipo-detail"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                ipos = []
                
                for ipo_data in data.get('data', []):
                    try:
                        ipo = {
                            'name': ipo_data.get('companyName', '') + ' IPO',
                            'company': ipo_data.get('companyName', ''),
                            'price_range': f"₹{ipo_data.get('priceMin', 0)} - ₹{ipo_data.get('priceMax', 0)}",
                            'issue_size': ipo_data.get('issueSize', 0),
                            'open_date': ipo_data.get('openDate', ''),
                            'close_date': ipo_data.get('closeDate', ''),
                            'listing_date': ipo_data.get('listingDate', ''),
                            'status': ipo_data.get('status', 'Unknown'),
                            'source': 'nse'
                        }
                        ipos.append(ipo)
                    except Exception as e:
                        continue
                
                return ipos
            
        except Exception as e:
            print(f"Error fetching from NSE: {e}")
            return []

    def extract_gmp(self, text):
        """Extract GMP value from text"""
        try:
            # Remove currency symbols and extra spaces
            clean_text = re.sub(r'[₹$,\s]', '', text)
            
            # Look for numbers with optional + or - sign
            match = re.search(r'([+-]?\d+(?:\.\d+)?)', clean_text)
            if match:
                return float(match.group(1))
            return 0
        except:
            return 0

    def parse_date(self, date_str):
        """Parse date string to standard format"""
        try:
            if not date_str or date_str.lower() in ['tba', 'na', '-', '']:
                return None
            
            # Try different date formats
            formats = ['%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%d %b %Y', '%d-%b-%Y']
            
            for fmt in formats:
                try:
                    parsed_date = datetime.strptime(date_str.strip(), fmt)
                    return parsed_date.strftime('%Y-%m-%d')
                except:
                    continue
            
            return date_str  # Return as-is if parsing fails
        except:
            return None

    def normalize_status(self, status):
        """Normalize IPO status"""
        status = status.lower().strip()
        
        if any(word in status for word in ['open', 'ongoing', 'live']):
            return 'Open'
        elif any(word in status for word in ['upcoming', 'forthcoming', 'announced']):
            return 'Upcoming'
        elif any(word in status for word in ['closed', 'completed']):
            return 'Closed'
        elif any(word in status for word in ['listed', 'trading']):
            return 'Listed'
        else:
            return 'Unknown'

    def calculate_additional_data(self, ipo):
        """Calculate additional IPO metrics"""
        try:
            # Extract price range
            price_match = re.search(r'₹?(\d+).*?₹?(\d+)', ipo.get('price_range', ''))
            if price_match:
                min_price = float(price_match.group(1))
                max_price = float(price_match.group(2))
                avg_price = (min_price + max_price) / 2
                
                gmp = ipo.get('gmp', 0)
                if gmp and avg_price:
                    ipo['gmp_percent'] = round((gmp / avg_price) * 100, 2)
                    ipo['is_profitable'] = gmp >= 10 or ipo['gmp_percent'] >= 5
                
                # Estimate lot size based on price
                if avg_price <= 50:
                    ipo['lot_size'] = 300
                elif avg_price <= 100:
                    ipo['lot_size'] = 150
                elif avg_price <= 500:
                    ipo['lot_size'] = 30
                else:
                    ipo['lot_size'] = 10
            
            # Set default values
            ipo.setdefault('industry', 'Others')
            ipo.setdefault('board_type', 'Main Board')
            ipo.setdefault('gmp', 0)
            ipo.setdefault('gmp_percent', 0)
            ipo.setdefault('is_profitable', False)
            
        except Exception as e:
            print(f"Error calculating additional data: {e}")
        
        return ipo

    def fetch_all_sources(self):
        """Fetch IPO data from all sources and combine"""
        print("🔍 Fetching real IPO data from multiple sources...")
        
        all_ipos = []
        
        # Fetch from different sources
        sources = [
            ('Chittorgarh', self.fetch_from_chittorgarh),
            ('InvestorGain', self.fetch_from_investorgain),
            ('IPOWatch', self.fetch_from_ipowatch),
            ('NSE', self.fetch_nse_ipo_data)
        ]
        
        for source_name, fetch_func in sources:
            try:
                print(f"📡 Fetching from {source_name}...")
                ipos = fetch_func()
                if ipos:
                    print(f"✅ Found {len(ipos)} IPOs from {source_name}")
                    all_ipos.extend(ipos)
                else:
                    print(f"⚠️ No data from {source_name}")
                
                # Small delay between requests
                time.sleep(1)
                
            except Exception as e:
                print(f"❌ Error fetching from {source_name}: {e}")
                continue
        
        # Remove duplicates and process data
        unique_ipos = []
        seen_names = set()
        
        for ipo in all_ipos:
            name = ipo.get('name', '').lower()
            if name and name not in seen_names:
                seen_names.add(name)
                
                # Calculate additional metrics
                ipo = self.calculate_additional_data(ipo)
                ipo['id'] = len(unique_ipos) + 1
                
                unique_ipos.append(ipo)
        
        print(f"🎯 Total unique IPOs found: {len(unique_ipos)}")
        return unique_ipos

def get_real_ipo_data():
    """Main function to get real IPO data"""
    fetcher = RealIPOFetcher()
    return fetcher.fetch_all_sources()

if __name__ == "__main__":
    # Test the fetcher
    ipos = get_real_ipo_data()
    print(f"\n📊 Found {len(ipos)} real IPOs:")
    for ipo in ipos[:5]:  # Show first 5
        print(f"- {ipo.get('name', 'Unknown')} | GMP: ₹{ipo.get('gmp', 0)} | Status: {ipo.get('status', 'Unknown')}")