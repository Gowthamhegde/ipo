from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class IPO(Base):
    __tablename__ = "ipos"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    issue_price_min = Column(Float, nullable=False)
    issue_price_max = Column(Float, nullable=False)
    issue_size = Column(Float)  # in crores
    lot_size = Column(Integer)
    open_date = Column(DateTime)
    close_date = Column(DateTime)
    listing_date = Column(DateTime)
    status = Column(String(50), default="upcoming")  # upcoming, open, closed, listed
    industry = Column(String(100))
    lead_managers = Column(Text)
    registrar = Column(String(255))
    
    # GMP related fields
    current_gmp = Column(Float, default=0.0)
    gmp_percentage = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    is_profitable = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    gmp_data = relationship("GMPData", back_populates="ipo")
    notifications = relationship("Notification", back_populates="ipo")

class GMPData(Base):
    __tablename__ = "gmp_data"
    
    id = Column(Integer, primary_key=True, index=True)
    ipo_id = Column(Integer, ForeignKey("ipos.id"), nullable=False)
    source = Column(String(50), nullable=False)  # chittorgarh, ipowatch, etc.
    gmp_value = Column(Float, nullable=False)
    gmp_percentage = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=func.now())
    is_valid = Column(Boolean, default=True)
    confidence = Column(Float, default=1.0)
    
    # Relationships
    ipo = relationship("IPO", back_populates="gmp_data")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # User preferences stored as JSON
    preferences = Column(JSON, default={})
    
    # Metadata
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime)
    
    # Relationships
    notifications = relationship("Notification", back_populates="user")

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ipo_id = Column(Integer, ForeignKey("ipos.id"), nullable=True)
    
    type = Column(String(50), nullable=False)  # new_ipo, gmp_spike, listing_reminder, profitable_ipo
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Notification status
    is_sent = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    
    # Delivery channels
    email_sent = Column(Boolean, default=False)
    sms_sent = Column(Boolean, default=False)
    push_sent = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    ipo = relationship("IPO", back_populates="notifications")

class DataSource(Base):
    __tablename__ = "data_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    url = Column(String(500), nullable=False)
    is_active = Column(Boolean, default=True)
    last_fetch = Column(DateTime)
    success_rate = Column(Float, default=100.0)
    avg_response_time = Column(Float, default=0.0)
    
    # Configuration stored as JSON
    config = Column(JSON, default={})
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class MLModel(Base):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    model_path = Column(String(500), nullable=False)
    accuracy = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    
    # Model metadata
    features = Column(JSON)  # List of features used
    training_data_size = Column(Integer)
    training_date = Column(DateTime)
    
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), nullable=False)  # INFO, WARNING, ERROR, CRITICAL
    module = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    details = Column(JSON)  # Additional context
    
    timestamp = Column(DateTime, default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ipo_id = Column(Integer, ForeignKey("ipos.id"), nullable=True)