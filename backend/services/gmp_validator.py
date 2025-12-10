import numpy as np
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import statistics
import logging

from models import IPO, GMPData
from schemas import GMPValidationResult
from utils.logger import get_logger

logger = get_logger(__name__)

class GMPValidator:
    """Validates GMP data across multiple sources and calculates confidence scores"""
    
    def __init__(self):
        self.min_sources = 2  # Minimum sources required for validation
        self.max_variance_threshold = 0.3  # 30% variance threshold
        self.outlier_threshold = 2.0  # Standard deviations for outlier detection
        self.time_window_hours = 6  # Consider data within 6 hours as current
        
        # Source reliability weights (based on historical accuracy)
        self.source_weights = {
            'chittorgarh': 0.9,
            'ipowatch': 0.85,
            'investorgain': 0.8,
            'applynse': 0.75,
            'nse': 1.0,  # Official sources get highest weight
            'bse': 1.0
        }

    def validate_ipo_gmp(self, ipo_id: int, db: Session) -> GMPValidationResult:
        """Validate GMP for a specific IPO across all sources"""
        
        # Get recent GMP data for the IPO
        cutoff_time = datetime.utcnow() - timedelta(hours=self.time_window_hours)
        
        gmp_records = db.query(GMPData).filter(
            GMPData.ipo_id == ipo_id,
            GMPData.timestamp >= cutoff_time,
            GMPData.is_valid == True
        ).all()
        
        if len(gmp_records) < self.min_sources:
            logger.warning(f"Insufficient data sources for IPO {ipo_id}: {len(gmp_records)} sources")
            return GMPValidationResult(
                ipo_id=ipo_id,
                validated_gmp=0.0,
                confidence_score=0.0,
                sources_count=len(gmp_records),
                is_reliable=False,
                variance=0.0,
                outliers=[]
            )
        
        return self._calculate_validated_gmp(ipo_id, gmp_records)

    def _calculate_validated_gmp(self, ipo_id: int, gmp_records: List[GMPData]) -> GMPValidationResult:
        """Calculate validated GMP using weighted average and outlier detection"""
        
        # Extract GMP values and sources
        gmp_values = []
        sources = []
        weights = []
        
        for record in gmp_records:
            gmp_values.append(record.gmp_value)
            sources.append(record.source)
            weights.append(self.source_weights.get(record.source, 0.5))
        
        # Convert to numpy arrays for easier calculation
        values = np.array(gmp_values)
        weights_array = np.array(weights)
        
        # Detect and remove outliers
        outliers = self._detect_outliers(values, sources)
        
        # Filter out outliers
        valid_indices = [i for i, source in enumerate(sources) if source not in outliers]
        
        if len(valid_indices) < self.min_sources:
            logger.warning(f"Too many outliers detected for IPO {ipo_id}")
            # Use all data if too many outliers
            valid_indices = list(range(len(values)))
            outliers = []
        
        valid_values = values[valid_indices]
        valid_weights = weights_array[valid_indices]
        
        # Calculate weighted average
        weighted_gmp = np.average(valid_values, weights=valid_weights)
        
        # Calculate variance and confidence score
        variance = np.var(valid_values) / (np.mean(valid_values) + 1e-6)  # Coefficient of variation
        confidence_score = self._calculate_confidence_score(
            valid_values, valid_weights, variance, len(valid_indices)
        )
        
        # Determine if the GMP is reliable
        is_reliable = (
            len(valid_indices) >= self.min_sources and
            variance <= self.max_variance_threshold and
            confidence_score >= 0.6
        )
        
        logger.info(f"IPO {ipo_id}: Validated GMP = {weighted_gmp:.2f}, "
                   f"Confidence = {confidence_score:.2f}, Sources = {len(valid_indices)}")
        
        return GMPValidationResult(
            ipo_id=ipo_id,
            validated_gmp=round(weighted_gmp, 2),
            confidence_score=round(confidence_score, 3),
            sources_count=len(valid_indices),
            is_reliable=is_reliable,
            variance=round(variance, 3),
            outliers=outliers
        )

    def _detect_outliers(self, values: np.ndarray, sources: List[str]) -> List[str]:
        """Detect outlier GMP values using statistical methods"""
        
        if len(values) < 3:
            return []  # Need at least 3 values for outlier detection
        
        outliers = []
        
        # Method 1: Z-score based outlier detection
        mean_val = np.mean(values)
        std_val = np.std(values)
        
        if std_val > 0:
            z_scores = np.abs((values - mean_val) / std_val)
            outlier_indices = np.where(z_scores > self.outlier_threshold)[0]
            
            for idx in outlier_indices:
                outliers.append(sources[idx])
        
        # Method 2: IQR based outlier detection (additional validation)
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        
        iqr_outliers = []
        for i, val in enumerate(values):
            if val < lower_bound or val > upper_bound:
                if sources[i] not in outliers:  # Only add if not already detected
                    iqr_outliers.append(sources[i])
        
        # Combine both methods (intersection for conservative approach)
        if len(outliers) > len(values) // 2:  # If too many outliers, use IQR method
            outliers = iqr_outliers
        
        logger.debug(f"Detected outliers: {outliers} from sources: {sources}")
        return outliers

    def _calculate_confidence_score(self, values: np.ndarray, weights: np.ndarray, 
                                  variance: float, source_count: int) -> float:
        """Calculate confidence score based on multiple factors"""
        
        # Base confidence from source count (more sources = higher confidence)
        source_confidence = min(source_count / 5.0, 1.0)  # Max at 5 sources
        
        # Variance confidence (lower variance = higher confidence)
        variance_confidence = max(0, 1 - variance / self.max_variance_threshold)
        
        # Weight confidence (higher average weight = higher confidence)
        weight_confidence = np.mean(weights)
        
        # Time-based confidence (fresher data = higher confidence)
        # This would require timestamp information, using 1.0 for now
        time_confidence = 1.0
        
        # Combine all factors with weights
        confidence_score = (
            0.3 * source_confidence +
            0.3 * variance_confidence +
            0.2 * weight_confidence +
            0.2 * time_confidence
        )
        
        return min(confidence_score, 1.0)

    def is_gmp_profitable(self, gmp_value: float, issue_price: float, 
                         min_profit_percentage: float = 10.0, 
                         min_absolute_profit: float = 20.0) -> bool:
        """Check if GMP indicates profitable IPO based on user criteria"""
        
        if issue_price <= 0:
            return False
        
        # Calculate percentage gain
        percentage_gain = (gmp_value / issue_price) * 100
        
        # Check both percentage and absolute criteria
        meets_percentage = percentage_gain >= min_profit_percentage
        meets_absolute = gmp_value >= min_absolute_profit
        
        return meets_percentage or meets_absolute

    def detect_gmp_spike(self, ipo_id: int, db: Session, 
                        spike_threshold: float = 8.0) -> Optional[Dict]:
        """Detect significant GMP spikes for notifications"""
        
        # Get GMP data for the last 24 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        
        gmp_records = db.query(GMPData).filter(
            GMPData.ipo_id == ipo_id,
            GMPData.timestamp >= cutoff_time,
            GMPData.is_valid == True
        ).order_by(GMPData.timestamp.desc()).limit(10).all()
        
        if len(gmp_records) < 2:
            return None
        
        # Get current and previous validated GMP
        current_validation = self.validate_ipo_gmp(ipo_id, db)
        
        # Get GMP from 6 hours ago for comparison
        comparison_time = datetime.utcnow() - timedelta(hours=6)
        older_records = db.query(GMPData).filter(
            GMPData.ipo_id == ipo_id,
            GMPData.timestamp <= comparison_time,
            GMPData.is_valid == True
        ).order_by(GMPData.timestamp.desc()).limit(5).all()
        
        if not older_records:
            return None
        
        # Calculate previous GMP (simple average for comparison)
        previous_gmp = statistics.mean([r.gmp_value for r in older_records])
        current_gmp = current_validation.validated_gmp
        
        if previous_gmp <= 0:
            return None
        
        # Calculate percentage change
        percentage_change = ((current_gmp - previous_gmp) / previous_gmp) * 100
        
        if abs(percentage_change) >= spike_threshold:
            return {
                'ipo_id': ipo_id,
                'previous_gmp': previous_gmp,
                'current_gmp': current_gmp,
                'percentage_change': percentage_change,
                'spike_type': 'increase' if percentage_change > 0 else 'decrease',
                'confidence_score': current_validation.confidence_score
            }
        
        return None

    def validate_all_active_ipos(self, db: Session) -> List[GMPValidationResult]:
        """Validate GMP for all active IPOs"""
        
        # Get all active IPOs
        active_ipos = db.query(IPO).filter(
            IPO.status.in_(['upcoming', 'open'])
        ).all()
        
        results = []
        
        for ipo in active_ipos:
            try:
                validation_result = self.validate_ipo_gmp(ipo.id, db)
                results.append(validation_result)
                
                # Update IPO with validated GMP
                if validation_result.is_reliable:
                    ipo.current_gmp = validation_result.validated_gmp
                    ipo.confidence_score = validation_result.confidence_score
                    
                    # Calculate GMP percentage based on issue price
                    avg_issue_price = (ipo.issue_price_min + ipo.issue_price_max) / 2
                    if avg_issue_price > 0:
                        ipo.gmp_percentage = (validation_result.validated_gmp / avg_issue_price) * 100
                        
                        # Check if IPO is profitable
                        ipo.is_profitable = self.is_gmp_profitable(
                            validation_result.validated_gmp, avg_issue_price
                        )
                
                db.commit()
                
            except Exception as e:
                logger.error(f"Error validating GMP for IPO {ipo.id}: {e}")
                db.rollback()
                continue
        
        logger.info(f"Validated GMP for {len(results)} IPOs")
        return results

    def get_source_reliability_stats(self, db: Session, days: int = 30) -> Dict[str, Dict]:
        """Get reliability statistics for each data source"""
        
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        
        # Get all GMP data from the specified period
        gmp_records = db.query(GMPData).filter(
            GMPData.timestamp >= cutoff_time
        ).all()
        
        source_stats = {}
        
        # Group by source
        sources = {}
        for record in gmp_records:
            if record.source not in sources:
                sources[record.source] = []
            sources[record.source].append(record)
        
        for source, records in sources.items():
            values = [r.gmp_value for r in records]
            
            if len(values) > 0:
                source_stats[source] = {
                    'total_records': len(values),
                    'avg_gmp': statistics.mean(values),
                    'std_deviation': statistics.stdev(values) if len(values) > 1 else 0,
                    'reliability_weight': self.source_weights.get(source, 0.5),
                    'last_update': max(r.timestamp for r in records),
                    'data_freshness_hours': (datetime.utcnow() - max(r.timestamp for r in records)).total_seconds() / 3600
                }
        
        return source_stats