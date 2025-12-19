import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import joblib
import os
from datetime import datetime
import logging
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class IPOPredictionModel:
    """
    Advanced ML model for predicting IPO listing gains with XGBoost and RandomForest ensemble
    """
    
    def __init__(self, model_dir: str = "models/"):
        self.model_dir = model_dir
        self.xgb_model = None
        self.rf_model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = []
        self.is_trained = False
        
        # Ensure model directory exists
        os.makedirs(model_dir, exist_ok=True)
        
        # Model parameters
        self.xgb_params = {
            'n_estimators': 200,
            'max_depth': 8,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'n_jobs': -1
        }
        
        self.rf_params = {
            'n_estimators': 150,
            'max_depth': 10,
            'min_samples_split': 5,
            'min_samples_leaf': 2,
            'random_state': 42,
            'n_jobs': -1
        }
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Advanced feature engineering for IPO prediction
        """
        df = df.copy()
        
        # Basic calculations
        df['price_range'] = df['issue_price_max'] - df['issue_price_min']
        df['price_midpoint'] = (df['issue_price_max'] + df['issue_price_min']) / 2
        df['gmp_to_price_ratio'] = df['gmp'] / df['price_midpoint']
        df['issue_size_log'] = np.log1p(df['issue_size'])
        
        # Subscription ratios
        df['total_subscription'] = df['retail_subscription'] + df['qib_subscription'] + df['hni_subscription']
        df['retail_dominance'] = df['retail_subscription'] / (df['total_subscription'] + 1e-6)
        df['qib_dominance'] = df['qib_subscription'] / (df['total_subscription'] + 1e-6)
        df['hni_dominance'] = df['hni_subscription'] / (df['total_subscription'] + 1e-6)
        
        # Market conditions (if available)
        if 'listing_date' in df.columns:
            df['listing_date'] = pd.to_datetime(df['listing_date'])
            df['listing_month'] = df['listing_date'].dt.month
            df['listing_quarter'] = df['listing_date'].dt.quarter
            df['listing_year'] = df['listing_date'].dt.year
        
        # GMP momentum (if historical GMP data available)
        if 'gmp_trend' in df.columns:
            df['gmp_momentum'] = df['gmp_trend']
        else:
            df['gmp_momentum'] = 0
        
        # Risk indicators
        df['high_subscription_risk'] = (df['total_subscription'] > 10).astype(int)
        df['low_subscription_risk'] = (df['total_subscription'] < 1).astype(int)
        df['high_gmp_risk'] = (df['gmp_to_price_ratio'] > 0.5).astype(int)
        
        # Sector performance indicators
        df['tech_sector'] = (df['sector'].str.contains('Technology|IT|Software', case=False, na=False)).astype(int)
        df['pharma_sector'] = (df['sector'].str.contains('Pharma|Healthcare', case=False, na=False)).astype(int)
        df['finance_sector'] = (df['sector'].str.contains('Finance|Bank|NBFC', case=False, na=False)).astype(int)
        
        return df
    
    def prepare_data(self, df: pd.DataFrame, target_col: str = 'listing_gain_percent') -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare data for training with comprehensive preprocessing
        """
        # Engineer features
        df = self.engineer_features(df)
        
        # Handle missing values
        numeric_columns = df.select_dtypes(include=[np.number]).columns
        df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].median())
        
        categorical_columns = df.select_dtypes(include=['object']).columns
        for col in categorical_columns:
            df[col] = df[col].fillna('Unknown')
        
        # Encode categorical variables
        for col in categorical_columns:
            if col != target_col:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df[col] = self.label_encoders[col].fit_transform(df[col].astype(str))
                else:
                    # Handle unseen categories
                    unique_values = set(self.label_encoders[col].classes_)
                    df[col] = df[col].apply(lambda x: x if x in unique_values else 'Unknown')
                    df[col] = self.label_encoders[col].transform(df[col].astype(str))
        
        # Select features
        feature_columns = [
            'gmp', 'issue_price_min', 'issue_price_max', 'issue_size',
            'retail_subscription', 'qib_subscription', 'hni_subscription',
            'sector', 'price_range', 'price_midpoint', 'gmp_to_price_ratio',
            'issue_size_log', 'total_subscription', 'retail_dominance',
            'qib_dominance', 'hni_dominance', 'gmp_momentum',
            'high_subscription_risk', 'low_subscription_risk', 'high_gmp_risk',
            'tech_sector', 'pharma_sector', 'finance_sector'
        ]
        
        # Add time-based features if available
        if 'listing_month' in df.columns:
            feature_columns.extend(['listing_month', 'listing_quarter'])
        
        # Filter available columns
        available_features = [col for col in feature_columns if col in df.columns]
        self.feature_columns = available_features
        
        X = df[available_features]
        y = df[target_col] if target_col in df.columns else None
        
        return X, y
    
    def train(self, df: pd.DataFrame, target_col: str = 'listing_gain_percent') -> Dict:
        """
        Train ensemble model with XGBoost and RandomForest
        """
        logger.info("Starting model training...")
        
        # Prepare data
        X, y = self.prepare_data(df, target_col)
        
        if y is None:
            raise ValueError(f"Target column '{target_col}' not found in data")
        
        # Remove outliers (beyond 3 standard deviations)
        z_scores = np.abs((y - y.mean()) / y.std())
        mask = z_scores < 3
        X, y = X[mask], y[mask]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=None
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train XGBoost
        logger.info("Training XGBoost model...")
        self.xgb_model = xgb.XGBRegressor(**self.xgb_params)
        self.xgb_model.fit(X_train_scaled, y_train)
        
        # Train RandomForest
        logger.info("Training RandomForest model...")
        self.rf_model = RandomForestRegressor(**self.rf_params)
        self.rf_model.fit(X_train_scaled, y_train)
        
        # Evaluate models
        xgb_pred = self.xgb_model.predict(X_test_scaled)
        rf_pred = self.rf_model.predict(X_test_scaled)
        
        # Ensemble prediction (weighted average)
        ensemble_pred = 0.6 * xgb_pred + 0.4 * rf_pred
        
        # Calculate metrics
        metrics = {
            'xgb_mae': mean_absolute_error(y_test, xgb_pred),
            'xgb_rmse': np.sqrt(mean_squared_error(y_test, xgb_pred)),
            'xgb_r2': r2_score(y_test, xgb_pred),
            'rf_mae': mean_absolute_error(y_test, rf_pred),
            'rf_rmse': np.sqrt(mean_squared_error(y_test, rf_pred)),
            'rf_r2': r2_score(y_test, rf_pred),
            'ensemble_mae': mean_absolute_error(y_test, ensemble_pred),
            'ensemble_rmse': np.sqrt(mean_squared_error(y_test, ensemble_pred)),
            'ensemble_r2': r2_score(y_test, ensemble_pred),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'features_used': len(self.feature_columns)
        }
        
        # Cross-validation
        xgb_cv_scores = cross_val_score(self.xgb_model, X_train_scaled, y_train, cv=5, scoring='r2')
        rf_cv_scores = cross_val_score(self.rf_model, X_train_scaled, y_train, cv=5, scoring='r2')
        
        metrics['xgb_cv_mean'] = xgb_cv_scores.mean()
        metrics['xgb_cv_std'] = xgb_cv_scores.std()
        metrics['rf_cv_mean'] = rf_cv_scores.mean()
        metrics['rf_cv_std'] = rf_cv_scores.std()
        
        # Feature importance
        xgb_importance = dict(zip(self.feature_columns, self.xgb_model.feature_importances_))
        rf_importance = dict(zip(self.feature_columns, self.rf_model.feature_importances_))
        
        metrics['xgb_feature_importance'] = xgb_importance
        metrics['rf_feature_importance'] = rf_importance
        
        self.is_trained = True
        logger.info(f"Model training completed. Ensemble R²: {metrics['ensemble_r2']:.4f}")
        
        return metrics
    
    def predict(self, data: Dict) -> Dict:
        """
        Make prediction for a single IPO
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first or load a trained model.")
        
        # Convert to DataFrame
        df = pd.DataFrame([data])
        
        # Prepare data
        X, _ = self.prepare_data(df)
        
        # Ensure all required features are present
        missing_features = set(self.feature_columns) - set(X.columns)
        if missing_features:
            logger.warning(f"Missing features: {missing_features}. Using default values.")
            for feature in missing_features:
                X[feature] = 0
        
        # Reorder columns to match training
        X = X[self.feature_columns]
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        xgb_pred = self.xgb_model.predict(X_scaled)[0]
        rf_pred = self.rf_model.predict(X_scaled)[0]
        
        # Ensemble prediction
        ensemble_pred = 0.6 * xgb_pred + 0.4 * rf_pred
        
        # Calculate confidence based on model agreement
        model_agreement = 1 - abs(xgb_pred - rf_pred) / (abs(xgb_pred) + abs(rf_pred) + 1e-6)
        confidence = min(max(model_agreement, 0.1), 0.95)
        
        # Determine risk level
        if ensemble_pred > 50:
            risk_level = "High"
        elif ensemble_pred > 20:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        # Calculate expected listing price
        issue_price = data.get('issue_price_max', data.get('price_midpoint', 0))
        expected_listing_price = issue_price * (1 + ensemble_pred / 100)
        
        return {
            'predicted_gain_percent': round(ensemble_pred, 2),
            'confidence_score': round(confidence, 3),
            'risk_level': risk_level,
            'expected_listing_price': round(expected_listing_price, 2),
            'xgb_prediction': round(xgb_pred, 2),
            'rf_prediction': round(rf_pred, 2),
            'model_agreement': round(model_agreement, 3)
        }
    
    def save_model(self, version: str = None) -> str:
        """
        Save trained model and preprocessors
        """
        if not self.is_trained:
            raise ValueError("No trained model to save")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = version or timestamp
        
        model_path = os.path.join(self.model_dir, f"ipo_model_{version}")
        os.makedirs(model_path, exist_ok=True)
        
        # Save models
        joblib.dump(self.xgb_model, os.path.join(model_path, "xgb_model.pkl"))
        joblib.dump(self.rf_model, os.path.join(model_path, "rf_model.pkl"))
        joblib.dump(self.scaler, os.path.join(model_path, "scaler.pkl"))
        joblib.dump(self.label_encoders, os.path.join(model_path, "label_encoders.pkl"))
        joblib.dump(self.feature_columns, os.path.join(model_path, "feature_columns.pkl"))
        
        # Save metadata
        metadata = {
            'version': version,
            'timestamp': timestamp,
            'feature_count': len(self.feature_columns),
            'features': self.feature_columns
        }
        joblib.dump(metadata, os.path.join(model_path, "metadata.pkl"))
        
        logger.info(f"Model saved to {model_path}")
        return model_path
    
    def load_model(self, model_path: str) -> bool:
        """
        Load trained model and preprocessors
        """
        try:
            self.xgb_model = joblib.load(os.path.join(model_path, "xgb_model.pkl"))
            self.rf_model = joblib.load(os.path.join(model_path, "rf_model.pkl"))
            self.scaler = joblib.load(os.path.join(model_path, "scaler.pkl"))
            self.label_encoders = joblib.load(os.path.join(model_path, "label_encoders.pkl"))
            self.feature_columns = joblib.load(os.path.join(model_path, "feature_columns.pkl"))
            
            self.is_trained = True
            logger.info(f"Model loaded from {model_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def get_feature_importance(self) -> Dict:
        """
        Get feature importance from both models
        """
        if not self.is_trained:
            return {}
        
        xgb_importance = dict(zip(self.feature_columns, self.xgb_model.feature_importances_))
        rf_importance = dict(zip(self.feature_columns, self.rf_model.feature_importances_))
        
        # Combined importance (weighted average)
        combined_importance = {}
        for feature in self.feature_columns:
            combined_importance[feature] = 0.6 * xgb_importance[feature] + 0.4 * rf_importance[feature]
        
        # Sort by importance
        sorted_importance = dict(sorted(combined_importance.items(), key=lambda x: x[1], reverse=True))
        
        return {
            'combined': sorted_importance,
            'xgboost': xgb_importance,
            'random_forest': rf_importance
        }

class ModelTrainer:
    """
    Utility class for training and managing IPO prediction models
    """
    
    def __init__(self, data_path: str = None):
        self.data_path = data_path
        self.model = IPOPredictionModel()
    
    def load_historical_data(self) -> pd.DataFrame:
        """
        Load historical IPO data for training
        """
        # This would typically load from database
        # For now, return sample data structure
        sample_data = {
            'ipo_name': ['Company A', 'Company B', 'Company C'],
            'issue_price_min': [100, 200, 150],
            'issue_price_max': [110, 220, 160],
            'issue_size': [1000, 2000, 1500],
            'gmp': [50, 80, 30],
            'retail_subscription': [2.5, 1.8, 3.2],
            'qib_subscription': [4.1, 2.3, 1.9],
            'hni_subscription': [1.2, 0.8, 2.1],
            'sector': ['Technology', 'Healthcare', 'Finance'],
            'listing_gain_percent': [45.5, 36.4, 18.7]
        }
        
        return pd.DataFrame(sample_data)
    
    def train_model(self) -> Dict:
        """
        Train the IPO prediction model
        """
        df = self.load_historical_data()
        metrics = self.model.train(df)
        return metrics
    
    def evaluate_model(self, test_data: pd.DataFrame) -> Dict:
        """
        Evaluate model performance on test data
        """
        predictions = []
        actuals = []
        
        for _, row in test_data.iterrows():
            pred = self.model.predict(row.to_dict())
            predictions.append(pred['predicted_gain_percent'])
            actuals.append(row['listing_gain_percent'])
        
        mae = mean_absolute_error(actuals, predictions)
        rmse = np.sqrt(mean_squared_error(actuals, predictions))
        r2 = r2_score(actuals, predictions)
        
        return {
            'mae': mae,
            'rmse': rmse,
            'r2': r2,
            'predictions': predictions,
            'actuals': actuals
        }