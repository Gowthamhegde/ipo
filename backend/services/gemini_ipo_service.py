"""
Gemini AI IPO Service for Backend
Fetches and processes IPO data using Google's Gemini AI from real sources like Groww and Zerodha
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import os
import re
from bs4 import BeautifulSoup
import google.generativeai as genai
from utils.logger import get_logger
from utils.cache import cache_manager

logger = get_logger(__name__)

class GeminiIPOService:
    def __init__(self):
        self.api_key = os.getenv('GEMINI_API_KEY')
        self.model = None
        self.cache_timeout = 30 * 60  # 30 minutes
        self.is_initialized = False
        self.last_fetch = None
        self.daily_task = None
        self.last_daily_update = None
        self.session = None

    async def initialize(self):
        """Initialize the Gemini service"""
        if self.is_initialized:
            return True

        if not self.api_key:
            logger.warning("Gemini API key not found. Please set GEMINI_API_KEY environment variable")
            return False

        try:
            # Configure the API key
            genai.configure(api_key=self.api_key)
            
            # Create HTTP session for web scraping
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30),
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            )
            
            self.is_initialized = True
            logger.info("✅ Gemini IPO Service initialized successfully")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini IPO Service: {str(e)}")
            return False

    def extract_number(self, text):
        """Extract number from text"""
        try:
            # Remove currency symbols and extract numbers
            numbers = re.findall(r'[\d,]+\.?\d*', text.replace(',', ''))
            return float(numbers[0]) if numbers else 0
        except:
            return 0

    async def enhance_with_gemini(self, raw_ipos):
        """Use Gemini AI to enhance and analyze IPO data"""
        if not self.is_initialized or not self.api_key:
            logger.warning("Gemini not initialized, using local enhancement logic")
            return self._local_enhance(raw_ipos)

        try:
            # Prepare data for Gemini
            ipo_summary = []
            for ipo in raw_ipos:
                ipo_summary.append({
                    "name": ipo.get('company_name', ipo.get('name', '')),
                    "gmp": ipo.get('current_gmp', 0),
                    "sector": ipo.get('sector', ''),
                    "subscription": ipo.get('subscription_status', '')
                })

            prompt = f"""
            Analyze the following Indian IPO data and provide detailed insights:
            {json.dumps(ipo_summary)}

            For each IPO, provide:
            1. Risk level (Low, Medium, High)
            2. Recommendation (Buy, Hold, Avoid)
            3. Three key highlights
            4. Sector outlook
            5. Listing potential percentage range

            Format the response as a JSON array of objects with the following keys:
            company_name, risk_level, recommendation, highlights (list), sector_outlook, listing_potential
            """

            response_text = await self.call_gemini_api(prompt)
            
            # Extract JSON from response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                ai_analysis = json.loads(json_match.group(0))
                
                # Merge AI analysis with raw data
                enhanced_ipos = []
                for ipo in raw_ipos:
                    enhanced_ipo = ipo.copy()
                    name = ipo.get('company_name', ipo.get('name', ''))
                    
                    # Find matching analysis
                    match = next((a for a in ai_analysis if a.get('company_name') == name), None)
                    if match:
                        enhanced_ipo.update({
                            'risk_level': match.get('risk_level', 'Medium'),
                            'recommendation': match.get('recommendation', 'Hold'),
                            'highlights': match.get('highlights', []),
                            'sector_outlook': match.get('sector_outlook', ''),
                            'listing_potential': match.get('listing_potential', '')
                        })
                    else:
                        # Fallback to local enhancement if AI didn't return this IPO
                        fallback = self._local_enhance([ipo])[0]
                        enhanced_ipo.update(fallback)
                    
                    enhanced_ipos.append(enhanced_ipo)
                
                logger.info("✅ Enhanced IPO data with Gemini AI")
                return enhanced_ipos
            else:
                logger.warning("Could not parse Gemini JSON response, using local enhancement")
                return self._local_enhance(raw_ipos)
                
        except Exception as e:
            logger.error(f"❌ Error enhancing data with Gemini: {str(e)}")
            return self._local_enhance(raw_ipos)

    def _local_enhance(self, raw_ipos):
        """Local fallback for IPO enhancement logic"""
        enhanced_ipos = []
        for ipo in raw_ipos:
            enhanced_ipo = ipo.copy()
            
            # Risk assessment based on GMP and subscription
            gmp = ipo.get('current_gmp', 0)
            subscription_text = str(ipo.get('subscription_status', '')).lower()
            
            if gmp > 30:
                enhanced_ipo['risk_level'] = 'High'
                enhanced_ipo['recommendation'] = 'Buy' if 'oversubscribed' in subscription_text else 'Hold'
            elif gmp > 10:
                enhanced_ipo['risk_level'] = 'Medium'
                enhanced_ipo['recommendation'] = 'Buy'
            elif gmp > 0:
                enhanced_ipo['risk_level'] = 'Low'
                enhanced_ipo['recommendation'] = 'Hold'
            else:
                enhanced_ipo['risk_level'] = 'High'
                enhanced_ipo['recommendation'] = 'Avoid'
            
            # Generate highlights
            sector = ipo.get('sector', '').lower()
            if 'financial' in sector:
                enhanced_ipo['highlights'] = ["Growing digital finance sector", "Strong regulatory support", "Increasing digital adoption"]
            elif 'technology' in sector:
                enhanced_ipo['highlights'] = ["Tech sector resilience", "Digital transformation trends", "Innovation-driven growth"]
            else:
                enhanced_ipo['highlights'] = ["Established market presence", "Sector fundamentals strong", "Growth potential identified"]
            
            enhanced_ipo['sector_outlook'] = "Positive" if gmp > 0 else "Cautious"
            enhanced_ipo['listing_potential'] = f"{max(0, gmp-5)}-{gmp+10}% gains"
            
            enhanced_ipos.append(enhanced_ipo)
        return enhanced_ipos

    async def call_gemini_api(self, prompt: str) -> str:
        """Call Gemini AI API directly"""
        if not self.is_initialized:
            await self.initialize()

        try:
            # Updated to use a model confirmed to be available and within quota
            model = genai.GenerativeModel('gemini-flash-lite-latest')
            response = await asyncio.to_thread(model.generate_content, prompt)
            return response.text
        except Exception as e:
            logger.error(f"❌ Gemini API call failed: {str(e)}")
            raise

    async def force_update(self):
        """Force immediate update from web sources"""
        return await self.fetch_ipo_data()

    async def get_ipo_analysis(self, ipo_name: str) -> Optional[Dict]:
        """Get detailed AI analysis for a specific IPO"""
        if not self.is_initialized:
            await self.initialize()

        try:
            prompt = f"Provide a detailed investment analysis for the upcoming Indian IPO: {ipo_name}. Include company overview, financials, pros/cons, and final verdict."
            analysis_text = await self.call_gemini_api(prompt)
            
            return {
                "ipo_name": ipo_name,
                "analysis": analysis_text,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"❌ Error getting analysis for {ipo_name}: {str(e)}")
            return None

    async def get_gmp_updates(self, ipo_names: Optional[List[str]] = None) -> List[Dict]:
        """Get latest GMP updates for specified IPOs"""
        all_ipos = await self.fetch_current_ipos()
        
        if not ipo_names:
            return [{"name": i.get('company_name'), "gmp": i.get('current_gmp')} for i in all_ipos]
            
        updates = []
        for name in ipo_names:
            match = next((i for i in all_ipos if name.lower() in i.get('company_name', '').lower()), None)
            if match:
                updates.append({"name": match.get('company_name'), "gmp": match.get('current_gmp')})
        
        return updates

    async def fetch_ipo_data(self):
        """Fetch IPO data and enhance with Gemini AI"""
        if not self.is_initialized:
            # Try to initialize if not already done
            await self.initialize()

        try:
            # Use the consolidated real-time service to get base data
            from services.real_time_ipo_service import real_time_ipo_service
            all_ipos = await real_time_ipo_service.fetch_all_ipo_data()
            
            if not all_ipos:
                logger.warning("No real IPO data found from sources")
                return []
            
            # Enhance with Gemini AI
            enhanced_ipos = await self.enhance_with_gemini(all_ipos)
            
            # Cache the results
            cache_manager.cache.set('gemini_ipo_data', enhanced_ipos, self.cache_timeout)
            self.last_fetch = datetime.utcnow()
            
            logger.info(f"✅ Fetched and enhanced {len(enhanced_ipos)} IPOs")
            return enhanced_ipos

        except Exception as e:
            logger.error(f"❌ Error fetching IPO data: {str(e)}")
            return []

    async def fetch_current_ipos(self):
        """Alias for fetch_ipo_data for backward compatibility"""
        return await self.fetch_ipo_data()

    def get_service_status(self):
        """Get the current service status"""
        return {
            "is_initialized": self.is_initialized,
            "has_api_key": bool(self.api_key),
            "last_fetch": self.last_fetch.isoformat() if self.last_fetch else None,
            "last_daily_update": self.last_daily_update.isoformat() if self.last_daily_update else None,
            "daily_updates_running": bool(self.daily_task and not self.daily_task.done()),
            "service": "Gemini AI with Real-Time IPO Service"
        }

    def get_status(self):
        """Alias for get_service_status for backward compatibility"""
        return self.get_service_status()

    async def get_market_sentiment(self):
        """Get market sentiment analysis using real data"""
        if not self.is_initialized:
            raise Exception("Service not initialized")

        try:
            # Get current IPO data for sentiment analysis
            current_ipos = await self.fetch_current_ipos()
            
            # Calculate sentiment based on real data
            if not current_ipos:
                return {
                    "sentiment_score": 5.0,
                    "analysis": "No current IPO data available for sentiment analysis.",
                    "key_drivers": ["Market data unavailable"]
                }
            
            # Analyze IPO performance metrics
            total_ipos = len(current_ipos)
            positive_gmp_count = sum(1 for ipo in current_ipos if ipo.get('current_gmp', 0) > 0)
            avg_gmp = sum(ipo.get('current_gmp', 0) for ipo in current_ipos) / total_ipos
            
            # Count oversubscribed IPOs
            oversubscribed_count = sum(1 for ipo in current_ipos 
                                     if 'oversubscribed' in ipo.get('subscription_status', '').lower())
            
            # Calculate sentiment score (1-10)
            base_score = 5.0
            
            # Adjust based on GMP performance
            if avg_gmp > 20:
                base_score += 2.0
            elif avg_gmp > 10:
                base_score += 1.0
            elif avg_gmp < 0:
                base_score -= 1.5
            
            # Adjust based on positive GMP ratio
            positive_ratio = positive_gmp_count / total_ipos
            if positive_ratio > 0.8:
                base_score += 1.0
            elif positive_ratio < 0.4:
                base_score -= 1.0
            
            # Adjust based on subscription levels
            if oversubscribed_count > total_ipos * 0.6:
                base_score += 0.5
            
            # Ensure score is within bounds
            sentiment_score = max(1.0, min(10.0, base_score))
            
            # Generate analysis text
            if sentiment_score >= 7.5:
                sentiment_text = "bullish"
                market_condition = "strong investor confidence"
            elif sentiment_score >= 6.0:
                sentiment_text = "cautiously optimistic"
                market_condition = "selective investor interest"
            elif sentiment_score >= 4.0:
                sentiment_text = "neutral"
                market_condition = "mixed market signals"
            else:
                sentiment_text = "bearish"
                market_condition = "investor caution prevailing"
            
            analysis = f"Market sentiment is {sentiment_text} with {market_condition}. Average GMP of ₹{avg_gmp:.1f} across {total_ipos} IPOs, with {positive_gmp_count} showing positive premiums."
            
            # Key drivers based on data
            key_drivers = []
            if avg_gmp > 15:
                key_drivers.append("Strong grey market premiums")
            if oversubscribed_count > 0:
                key_drivers.append("High subscription levels")
            if positive_ratio > 0.7:
                key_drivers.append("Broad-based investor interest")
            else:
                key_drivers.append("Selective stock picking")
            
            if not key_drivers:
                key_drivers = ["Market consolidation", "Investor caution", "Sector rotation"]
            
            return {
                "sentiment_score": round(sentiment_score, 1),
                "analysis": analysis,
                "key_drivers": key_drivers
            }

        except Exception as e:
            logger.error(f"❌ Error getting market sentiment: {str(e)}")
            return {
                "sentiment_score": 6.0,
                "analysis": "Market sentiment analysis temporarily unavailable. System showing moderate optimism based on recent IPO trends.",
                "key_drivers": ["System analysis", "Recent IPO performance", "Market trends"]
            }

    async def start_daily_updates(self):
        """Start daily automatic updates"""
        if self.daily_task and not self.daily_task.done():
            logger.info("Daily updates already running")
            return

        async def daily_update_task():
            while True:
                try:
                    await asyncio.sleep(24 * 60 * 60)  # Wait 24 hours
                    await self.fetch_ipo_data()
                    self.last_daily_update = datetime.utcnow()
                    logger.info("✅ Daily IPO data update completed")
                except Exception as e:
                    logger.error(f"❌ Daily update failed: {str(e)}")

        self.daily_task = asyncio.create_task(daily_update_task())
        logger.info("✅ Daily updates started")

    def stop_daily_updates(self):
        """Stop daily automatic updates"""
        if self.daily_task and not self.daily_task.done():
            self.daily_task.cancel()
            logger.info("✅ Daily updates stopped")

    async def close(self):
        """Close the service and cleanup resources"""
        if self.session:
            await self.session.close()
        self.stop_daily_updates()

# Create global service instance
gemini_ipo_service = GeminiIPOService()