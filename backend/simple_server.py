#!/usr/bin/env python3
"""
Simple IPO Backend Server - Fixed Version
"""

import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import random

# Mock IPO data - Updated with current market IPOs
MOCK_IPOS = [
    {
        "id": 1,
        "name": "Bajaj Housing Finance IPO",
        "company": "Bajaj Housing Finance Limited",
        "price_range": "₹66 - ₹70",
        "issue_size": 6560,
        "gmp": 15,
        "gmp_percent": 21.4,
        "status": "Open",
        "industry": "Financial Services",
        "open_date": "2024-09-09",
        "close_date": "2024-09-11",
        "listing_date": "2024-09-16",
        "is_profitable": True,
        "lot_size": 214,
        "board_type": "Main Board"
    },
    {
        "id": 2,
        "name": "Hyundai Motor India IPO",
        "company": "Hyundai Motor India Limited",
        "price_range": "₹1865 - ₹1960",
        "issue_size": 27870,
        "gmp": 50,
        "gmp_percent": 2.6,
        "status": "Upcoming",
        "industry": "Automobile",
        "open_date": "2024-10-15",
        "close_date": "2024-10-17",
        "listing_date": "2024-10-22",
        "is_profitable": True,
        "lot_size": 7,
        "board_type": "Main Board"
    },
    {
        "id": 3,
        "name": "NTPC Green Energy IPO",
        "company": "NTPC Green Energy Limited",
        "price_range": "₹102 - ₹108",
        "issue_size": 10000,
        "gmp": 8,
        "gmp_percent": 7.4,
        "status": "Upcoming",
        "industry": "Power",
        "open_date": "2024-11-19",
        "close_date": "2024-11-22",
        "listing_date": "2024-11-27",
        "is_profitable": False,
        "lot_size": 138,
        "board_type": "Main Board"
    },
    {
        "id": 4,
        "name": "Swiggy IPO",
        "company": "Bundl Technologies Private Limited",
        "price_range": "₹371 - ₹390",
        "issue_size": 11327,
        "gmp": 25,
        "gmp_percent": 6.4,
        "status": "Upcoming",
        "industry": "Technology",
        "open_date": "2024-11-06",
        "close_date": "2024-11-08",
        "listing_date": "2024-11-13",
        "is_profitable": True,
        "lot_size": 38,
        "board_type": "Main Board"
    },
    {
        "id": 5,
        "name": "Sagility India IPO",
        "company": "Sagility India Limited",
        "price_range": "₹28 - ₹30",
        "issue_size": 2106,
        "gmp": 2,
        "gmp_percent": 6.7,
        "status": "Closed",
        "industry": "Healthcare IT",
        "open_date": "2024-11-05",
        "close_date": "2024-11-07",
        "listing_date": "2024-11-12",
        "is_profitable": False,
        "lot_size": 500,
        "board_type": "Main Board"
    },
    {
        "id": 6,
        "name": "Acme Solar Holdings IPO",
        "company": "Acme Solar Holdings Limited",
        "price_range": "₹275 - ₹289",
        "issue_size": 2900,
        "gmp": 12,
        "gmp_percent": 4.2,
        "status": "Upcoming",
        "industry": "Renewable Energy",
        "open_date": "2024-11-06",
        "close_date": "2024-11-08",
        "listing_date": "2024-11-13",
        "is_profitable": False,
        "lot_size": 51,
        "board_type": "Main Board"
    },
    {
        "id": 7,
        "name": "Niva Bupa Health Insurance IPO",
        "company": "Niva Bupa Health Insurance Company Limited",
        "price_range": "₹70 - ₹74",
        "issue_size": 2200,
        "gmp": 5,
        "gmp_percent": 6.8,
        "status": "Closed",
        "industry": "Insurance",
        "open_date": "2024-11-07",
        "close_date": "2024-11-11",
        "listing_date": "2024-11-14",
        "is_profitable": False,
        "lot_size": 202,
        "board_type": "Main Board"
    },
    {
        "id": 8,
        "name": "Waaree Energies IPO",
        "company": "Waaree Energies Limited",
        "price_range": "₹1427 - ₹1503",
        "issue_size": 4321,
        "gmp": 180,
        "gmp_percent": 12.0,
        "status": "Listed",
        "industry": "Solar Energy",
        "open_date": "2024-10-21",
        "close_date": "2024-10-23",
        "listing_date": "2024-10-28",
        "is_profitable": True,
        "lot_size": 9,
        "board_type": "Main Board"
    },
    {
        "id": 9,
        "name": "Deepak Builders & Engineers IPO",
        "company": "Deepak Builders & Engineers India Limited",
        "price_range": "₹203 - ₹214",
        "issue_size": 260,
        "gmp": 35,
        "gmp_percent": 16.4,
        "status": "Listed",
        "industry": "Construction",
        "open_date": "2024-11-06",
        "close_date": "2024-11-08",
        "listing_date": "2024-11-13",
        "is_profitable": True,
        "lot_size": 70,
        "board_type": "SME"
    },
    {
        "id": 10,
        "name": "Godrej Properties IPO",
        "company": "Godrej Properties Limited",
        "price_range": "₹2550 - ₹2700",
        "issue_size": 6000,
        "gmp": 85,
        "gmp_percent": 3.1,
        "status": "Upcoming",
        "industry": "Real Estate",
        "open_date": "2024-12-15",
        "close_date": "2024-12-17",
        "listing_date": "2024-12-22",
        "is_profitable": True,
        "lot_size": 5,
        "board_type": "Main Board"
    },
    {
        "id": 11,
        "name": "Zomato IPO",
        "company": "Zomato Limited",
        "price_range": "₹72 - ₹76",
        "issue_size": 9375,
        "gmp": 8,
        "gmp_percent": 10.5,
        "status": "Listed",
        "industry": "Food Tech",
        "open_date": "2024-07-14",
        "close_date": "2024-07-16",
        "listing_date": "2024-07-23",
        "is_profitable": True,
        "lot_size": 195,
        "board_type": "Main Board"
    },
    {
        "id": 12,
        "name": "Paytm IPO",
        "company": "One 97 Communications Limited",
        "price_range": "₹2080 - ₹2150",
        "issue_size": 18300,
        "gmp": -200,
        "gmp_percent": -9.3,
        "status": "Listed",
        "industry": "Fintech",
        "open_date": "2024-11-08",
        "close_date": "2024-11-10",
        "listing_date": "2024-11-18",
        "is_profitable": False,
        "lot_size": 6,
        "board_type": "Main Board"
    },
    {
        "id": 13,
        "name": "Ola Electric IPO",
        "company": "Ola Electric Mobility Limited",
        "price_range": "₹72 - ₹76",
        "issue_size": 5500,
        "gmp": 12,
        "gmp_percent": 15.8,
        "status": "Listed",
        "industry": "Electric Vehicles",
        "open_date": "2024-08-02",
        "close_date": "2024-08-06",
        "listing_date": "2024-08-09",
        "is_profitable": True,
        "lot_size": 195,
        "board_type": "Main Board"
    },
    {
        "id": 14,
        "name": "Tata Technologies IPO",
        "company": "Tata Technologies Limited",
        "price_range": "₹475 - ₹500",
        "issue_size": 9400,
        "gmp": 85,
        "gmp_percent": 17.0,
        "status": "Listed",
        "industry": "Technology",
        "open_date": "2024-11-22",
        "close_date": "2024-11-24",
        "listing_date": "2024-11-30",
        "is_profitable": True,
        "lot_size": 30,
        "board_type": "Main Board"
    },
    {
        "id": 15,
        "name": "IREDA IPO",
        "company": "Indian Renewable Energy Development Agency",
        "price_range": "₹30 - ₹32",
        "issue_size": 2375,
        "gmp": 12,
        "gmp_percent": 37.5,
        "status": "Listed",
        "industry": "Energy Finance",
        "open_date": "2024-11-21",
        "close_date": "2024-11-23",
        "listing_date": "2024-11-29",
        "is_profitable": True,
        "lot_size": 468,
        "board_type": "Main Board"
    }
]

class IPOHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def _send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        path = urlparse(self.path).path
        print(f"GET {path}")
        
        if path == '/':
            self._send_json_response({
                "message": "IPO GMP Analyzer API",
                "version": "2.0.0",
                "status": "active"
            })
        elif path == '/health':
            self._send_json_response({"status": "healthy"})
        elif path == '/api/gemini-ipo/status':
            self._send_json_response({
                "service": {
                    "is_initialized": True,
                    "has_api_key": True,
                    "service": "Gemini AI",
                    "last_daily_update": datetime.now().isoformat(),
                    "daily_updates_running": True
                }
            })
        elif path == '/api/gemini-ipo/ipos':
            ipos = []
            for ipo in MOCK_IPOS:
                ipo_copy = ipo.copy()
                ipo_copy['gmp'] = max(0, ipo_copy['gmp'] + random.randint(-5, 10))
                ipo_copy['is_profitable'] = ipo_copy['gmp'] >= 20
                ipos.append(ipo_copy)
            self._send_json_response({
                "status": "success",
                "data": ipos,
                "count": len(ipos)
            })
        elif path == '/api/gemini-ipo/market-sentiment':
            self._send_json_response({
                "status": "success",
                "data": {
                    "sentiment": random.choice(['Bullish', 'Bearish', 'Neutral']),
                    "investorAppetite": random.choice(['High', 'Medium', 'Low']),
                    "confidence": round(random.uniform(0.6, 0.95), 2),
                    "trends": "Strong demand for technology IPOs",
                    "outlook": "Market showing positive sentiment"
                }
            })
        elif path == '/api/gemini-ipo/test-connection':
            self._send_json_response({
                "status": "success",
                "message": "Connection successful"
            })
        elif path == '/api/realtime-ipo/latest-data':
            self._send_json_response({
                "status": "success",
                "data": MOCK_IPOS
            })
        elif path == '/api/realtime-ipo/status':
            self._send_json_response({
                "service": {"is_running": True, "last_fetch": datetime.now().isoformat()},
                "scheduler": {"is_running": True}
            })
        elif path == '/api/realtime-ipo/metrics':
            self._send_json_response({
                "service_metrics": {"is_running": True, "sources_count": 3},
                "scheduler_metrics": {"active_tasks": 2, "total_tasks": 5}
            })
        elif path == '/api/realtime-ipo/tasks':
            self._send_json_response({
                "tasks": {
                    "task_1": {"type": "daily_fetch", "status": "completed", "start_time": datetime.now().isoformat()}
                }
            })
        elif path == '/api/analytics/stats':
            self._send_json_response({
                "total_ipos": len(MOCK_IPOS),
                "active_ipos": 2,
                "profitable_ipos": 2,
                "total_users": 1247,
                "profitability_rate": 66.7
            })
        else:
            self._send_json_response({"error": "Not found"}, 404)
    
    def do_POST(self):
        path = urlparse(self.path).path
        print(f"POST {path}")
        
        if path == '/api/gemini-ipo/initialize':
            self._send_json_response({"status": "initialized", "message": "Service initialized"})
        elif path == '/api/gemini-ipo/start-daily-updates':
            self._send_json_response({"status": "started", "message": "Daily updates started"})
        elif path == '/api/gemini-ipo/stop-daily-updates':
            self._send_json_response({"status": "stopped", "message": "Daily updates stopped"})
        elif path == '/api/gemini-ipo/force-update':
            self._send_json_response({
                "status": "completed",
                "message": "Update completed",
                "data": MOCK_IPOS,
                "count": len(MOCK_IPOS)
            })
        elif path == '/api/realtime-ipo/start':
            self._send_json_response({"status": "started", "message": "Service started"})
        elif path == '/api/realtime-ipo/stop':
            self._send_json_response({"status": "stopped", "message": "Service stopped"})
        elif path == '/api/realtime-ipo/fetch-now':
            self._send_json_response({"status": "triggered", "message": "Fetch triggered"})
        elif path.startswith('/api/realtime-ipo/force-task/'):
            task_type = path.split('/')[-1]
            self._send_json_response({
                "status": "triggered",
                "message": f"Task {task_type} triggered",
                "task_type": task_type
            })
        else:
            self._send_json_response({"error": "Not found"}, 404)

def run_server(port=8000):
    server = HTTPServer(('', port), IPOHandler)
    print(f"🚀 Backend running on http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.server_close()

if __name__ == '__main__':
    run_server()