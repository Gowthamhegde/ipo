'use client'

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  TrendingUpIcon, 
  CurrencyRupeeIcon, 
  CalendarIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Simple API service
const apiService = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async post(endpoint, data) {
    try {
      const response = await fet