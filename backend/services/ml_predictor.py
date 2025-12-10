import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from sqlalchemy.orm import Session

from models import IPO, GMPData, MLModel
from utils.logger import get_logger

logger = get_logger(__name__)

class MLPredictor:
    """ML-based IPO listing gain prediction using historical data"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = [
            'issue_size', 'price_band_width', 'lot_size', 'gmp_avg',
            'gmp_trend', 'days_to_listing', 'subscription_ratio',
            'market_sentiment', 'industry_encoded', 'lead_manager_encoded'
        ]
        self.model_path = "models/ipo_predictor.joblib"
        self.scaler_path = "models/scaler.joblib"
        self.encoders_path = "models/encoders.joblib"
        
        # Create models directory
        os.makedirs("models", exist_ok=True)
        
        # Load existing model if available
        self._load_model()

    def prepare_training_data(self, db: Session, years_back: int = 5) -> pd.DataFrame:
        """Prepare training data from historical IPO data"""
        
        # Get historical IPO data
        cutoff_date = datetime.utcnow() - timedelta(days=years_back * 365)
        
        historical_ipos = db.query(IPO).filter(
            IPO.listing_date >= cutoff_date,
            IPO.status == 'listed'
        ).all()
        
        if len(historical_ipos) < 10:
            logger.warning("Insufficient historical data for ML training")
            return pd.DataFrame()
        
        training_data = []
        
        for ipo in historical_ipos:
            try:
                # Calculate features
                features = self._extract_features(ipo, db)
                
                # Calculate actual listing gain (target variable)
                avg_issue_price = (ipo.issue_price_min + ipo.issue_price_max) / 2
                
                # For demo purposes, simulate listing price based on GMP
                # In real implementation, you'd have actual listing price data
                simulated_listing_price = avg_issue_price + ipo.current_gmp
                listing_gain = ((simulated_listing_price - avg_issue_price) / avg_issue_price) * 100
                
                features['listing_gain'] = listing_gain
                training_data.append(features)
                
            except Exception as e:
                logger.warning(f"Error processing IPO {ipo.id} for training: {e}")
                continue
        
        df = pd.DataFrame(training_data)
        logger.info(f"Prepared training data with {len(df)} samples")
        
        return df

    def _extract_features(self, ipo: IPO, db: Session) -> Dict:
        """Extract features for ML model"""
        
        # Basic IPO features
        issue_size = ipo.issue_size or 0
        price_band_width = ipo.issue_price_max - ipo.issue_price_min
        lot_size = ipo.lot_size or 0
        
        # GMP features
        gmp_data = db.query(GMPData).filter(
            GMPData.ipo_id == ipo.id
        ).order_by(GMPData.timestamp.desc()).limit(10).all()
        
        if gmp_data:
            gmp_values = [g.gmp_value for g in gmp_data]
            gmp_avg = np.mean(gmp_values)
            gmp_trend = self._calculate_trend(gmp_values)
        else:
            gmp_avg = 0
            gmp_trend = 0
        
        # Time-based features
        if ipo.listing_date and ipo.close_date:
            days_to_listing = (ipo.listing_date - ipo.close_date).days
        else:
            days_to_listing = 7  # Default assumption
        
        # Market sentiment (simplified)
        market_sentiment = self._get_market_sentiment(ipo.open_date)
        
        # Subscription ratio (simulated for demo)
        subscription_ratio = np.random.uniform(1.0, 50.0)  # Replace with actual data
        
        return {
            'issue_size': issue_size,
            'price_band_width': price_band_width,
            'lot_size': lot_size,
            'gmp_avg': gmp_avg,
            'gmp_trend': gmp_trend,
            'days_to_listing': days_to_listing,
            'subscription_ratio': subscription_ratio,
            'market_sentiment': market_sentiment,
            'industry': ipo.industry or 'Unknown',
            'lead_managers': ipo.lead_managers or 'Unknown'
        }

    def _calculate_trend(self, values: List[float]) -> float:
        """Calculate trend in GMP values"""
        if len(values) < 2:
            return 0
        
        # Simple linear trend calculation
        x = np.arange(len(values))
        y = np.array(values)
        
        # Calculate slope
        slope = np.polyfit(x, y, 1)[0]
        return slope

    def _get_market_sentiment(self, date: Optional[datetime]) -> float:
        """Get market sentiment score (simplified)"""
        if not date:
            return 0.5
        
        # Simulate market sentiment based on date
        # In real implementation, use market indices, VIX, etc.
        base_sentiment = 0.5
        
        # Add some seasonal variation
        month = date.month
        if month in [1, 2, 11, 12]:  # Winter months typically better for IPOs
            base_sentiment += 0.1
        elif month in [6, 7, 8]:  # Monsoon months typically weaker
            base_sentiment -= 0.1
        
        return max(0, min(1, base_sentiment))

    def train_model(self, db: Session, years_back: int = 5) -> Dict:
        """Train the ML model with historical data"""
        
        # Prepare training data
        df = self.prepare_training_data(db, years_back)
        
        if df.empty:
            return {"error": "Insufficient training data"}
        
        # Encode categorical variables
        categorical_columns = ['industry', 'lead_managers']
        
        for col in categorical_columns:
            if col in df.columns:
                le = LabelEncoder()
                df[f'{col}_encoded'] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
        
        # Prepare features and target
        feature_cols = [col for col in self.feature_columns if col in df.columns]
        X = df[feature_cols]
        y = df['listing_gain']
        
        # Handle missing values
        X = X.fillna(X.mean())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train ensemble model
        models = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42)
        }
        
        best_model = None
        best_score = -np.inf
        
        for name, model in models.items():
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = model.predict(X_test_scaled)
            score = r2_score(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            
            logger.info(f"{name} - R2: {score:.3f}, MAE: {mae:.3f}")
            
            if score > best_score:
                best_score = score
                best_model = model
        
        self.model = best_model
        
        # Save model and preprocessors
        self._save_model()
        
        # Save model metadata to database
        model_record = MLModel(
            name="IPO Listing Gain Predictor",
            version="1.0",
            model_path=self.model_path,
            accuracy=best_score,
            precision=best_score,  # For regression, using R2 as proxy
            recall=best_score,
            f1_score=best_score,
            features=feature_cols,
            training_data_size=len(df),
            training_date=datetime.utcnow(),
            is_active=True
        )
        
        # Deactivate old models
        db.query(MLModel).update({MLModel.is_active: False})
        db.add(model_record)
        db.commit()
        
        return {
            "success": True,
            "model_type": type(best_model).__name__,
            "r2_score": best_score,
            "training_samples": len(df),
            "features_used": feature_cols
        }

    def predict_listing_gain(self, ipo: IPO, db: Session = None) -> Dict:
        """Predict listing gain for an IPO"""
        
        if not self.model:
            return {
                "error": "Model not trained",
                "gain_percentage": 0,
                "confidence": 0
            }
        
        try:
            # Extract features
            features = self._extract_features(ipo, db) if db else self._extract_basic_features(ipo)
            
            # Encode categorical variables
            for col in ['industry', 'lead_managers']:
                if col in features and col in self.label_encoders:
                    try:
                        encoded_value = self.label_encoders[col].transform([str(features[col])])[0]
                        features[f'{col}_encoded'] = encoded_value
                    except ValueError:
                        # Handle unseen categories
                        features[f'{col}_encoded'] = 0
                else:
                    features[f'{col}_encoded'] = 0
            
            # Prepare feature vector
            feature_vector = []
            for col in self.feature_columns:
                if col in features:
                    feature_vector.append(features[col])
                else:
                    feature_vector.append(0)  # Default value for missing features
            
            # Scale features
            feature_vector = np.array(feature_vector).reshape(1, -1)
            feature_vector_scaled = self.scaler.transform(feature_vector)
            
            # Make prediction
            prediction = self.model.predict(feature_vector_scaled)[0]
            
            # Calculate confidence based on feature importance and data quality
            confidence = self._calculate_prediction_confidence(features, ipo)
            
            # Identify key factors
            factors = self._identify_key_factors(features, ipo)
            
            return {
                "gain_percentage": round(prediction, 2),
                "confidence": round(confidence, 3),
                "factors": factors,
                "model_version": "1.0"
            }
            
        except Exception as e:
            logger.error(f"Error predicting listing gain for IPO {ipo.id}: {e}")
            return {
                "error": str(e),
                "gain_percentage": 0,
                "confidence": 0
            }

    def _extract_basic_features(self, ipo: IPO) -> Dict:
        """Extract basic features when database is not available"""
        return {
            'issue_size': ipo.issue_size or 0,
            'price_band_width': ipo.issue_price_max - ipo.issue_price_min,
            'lot_size': ipo.lot_size or 0,
            'gmp_avg': ipo.current_gmp,
            'gmp_trend': 0,  # Cannot calculate without historical data
            'days_to_listing': 7,  # Default assumption
            'subscription_ratio': 5.0,  # Default assumption
            'market_sentiment': 0.5,  # Neutral
            'industry': ipo.industry or 'Unknown',
            'lead_managers': ipo.lead_managers or 'Unknown'
        }

    def _calculate_prediction_confidence(self, features: Dict, ipo: IPO) -> float:
        """Calculate confidence score for the prediction"""
        
        confidence_factors = []
        
        # GMP data quality
        if features.get('gmp_avg', 0) > 0:
            confidence_factors.append(0.8)  # Good GMP data
        else:
            confidence_factors.append(0.3)  # No GMP data
        
        # Issue size factor (larger IPOs more predictable)
        issue_size = features.get('issue_size', 0)
        if issue_size > 1000:  # Large IPO
            confidence_factors.append(0.9)
        elif issue_size > 100:  # Medium IPO
            confidence_factors.append(0.7)
        else:  # Small IPO
            confidence_factors.append(0.5)
        
        # Industry factor
        if features.get('industry') and features['industry'] != 'Unknown':
            confidence_factors.append(0.8)
        else:
            confidence_factors.append(0.4)
        
        # Overall confidence score
        confidence = np.mean(confidence_factors)
        
        # Add some randomness to simulate model uncertainty
        confidence *= np.random.uniform(0.9, 1.0)
        
        return min(confidence, 1.0)

    def _identify_key_factors(self, features: Dict, ipo: IPO) -> List[Dict]:
        """Identify key factors influencing the prediction"""
        
        factors = []
        
        # GMP factor
        gmp_avg = features.get('gmp_avg', 0)
        if gmp_avg > 50:
            factors.append({
                "factor": "High GMP",
                "value": f"₹{gmp_avg}",
                "impact": "Positive",
                "weight": 0.8
            })
        elif gmp_avg > 0:
            factors.append({
                "factor": "Moderate GMP",
                "value": f"₹{gmp_avg}",
                "impact": "Positive",
                "weight": 0.6
            })
        
        # Issue size factor
        issue_size = features.get('issue_size', 0)
        if issue_size > 1000:
            factors.append({
                "factor": "Large Issue Size",
                "value": f"₹{issue_size} crores",
                "impact": "Neutral",
                "weight": 0.5
            })
        
        # Price band factor
        price_band_width = features.get('price_band_width', 0)
        if price_band_width > 50:
            factors.append({
                "factor": "Wide Price Band",
                "value": f"₹{price_band_width}",
                "impact": "Negative",
                "weight": 0.3
            })
        
        # Market sentiment
        market_sentiment = features.get('market_sentiment', 0.5)
        if market_sentiment > 0.7:
            factors.append({
                "factor": "Positive Market Sentiment",
                "value": f"{market_sentiment:.1%}",
                "impact": "Positive",
                "weight": 0.4
            })
        elif market_sentiment < 0.3:
            factors.append({
                "factor": "Negative Market Sentiment",
                "value": f"{market_sentiment:.1%}",
                "impact": "Negative",
                "weight": 0.4
            })
        
        return factors

    def _save_model(self):
        """Save trained model and preprocessors"""
        try:
            joblib.dump(self.model, self.model_path)
            joblib.dump(self.scaler, self.scaler_path)
            joblib.dump(self.label_encoders, self.encoders_path)
            logger.info("Model saved successfully")
        except Exception as e:
            logger.error(f"Error saving model: {e}")

    def _load_model(self):
        """Load existing model and preprocessors"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.scaler = joblib.load(self.scaler_path)
                self.label_encoders = joblib.load(self.encoders_path)
                logger.info("Model loaded successfully")
            else:
                logger.info("No existing model found")
        except Exception as e:
            logger.error(f"Error loading model: {e}")

    def retrain_model(self, db: Session) -> Dict:
        """Retrain model with latest data"""
        logger.info("Starting model retraining...")
        return self.train_model(db)

    def get_model_performance(self, db: Session) -> Dict:
        """Get current model performance metrics"""
        
        model_record = db.query(MLModel).filter(
            MLModel.is_active == True
        ).first()
        
        if not model_record:
            return {"error": "No active model found"}
        
        return {
            "model_name": model_record.name,
            "version": model_record.version,
            "accuracy": model_record.accuracy,
            "training_date": model_record.training_date,
            "training_data_size": model_record.training_data_size,
            "features": model_record.features
        }