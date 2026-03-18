#!/usr/bin/env python3
"""
Seed script for GARVIS OpenClaw
Creates initial operators for demonstration
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_operators():
    """Seed initial operators into the database"""
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if operators already exist
    count = await db.operators.count_documents({})
    if count > 0:
        print(f"Database already has {count} operators. Skipping seed.")
        client.close()
        return
    
    operators = [
        {
            "id": str(uuid.uuid4()),
            "name": "Web Scraper",
            "type": "browser",
            "description": "Automated web scraping using browser automation. Can navigate pages, extract data, and handle dynamic content.",
            "metadata": {
                "capability": "web_scraping",
                "supports": ["navigation", "data_extraction", "screenshots"],
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Form Filler",
            "type": "browser",
            "description": "Intelligently fills out web forms with provided data. Handles validation and multi-step forms.",
            "metadata": {
                "capability": "form_automation",
                "supports": ["text_inputs", "dropdowns", "checkboxes", "file_uploads"],
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "File Manager",
            "type": "file",
            "description": "Manages file operations including reading, writing, organizing, and processing documents.",
            "metadata": {
                "capability": "file_operations",
                "supports": ["read", "write", "organize", "convert"],
                "max_file_size": "100MB",
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "System Monitor",
            "type": "system",
            "description": "Monitors system resources, logs, and performance metrics. Provides alerts on anomalies.",
            "metadata": {
                "capability": "system_monitoring",
                "supports": ["cpu", "memory", "disk", "network", "processes"],
                "alert_threshold": "80%",
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "API Integrator",
            "type": "api",
            "description": "Connects to external APIs, handles authentication, rate limiting, and data transformation.",
            "metadata": {
                "capability": "api_integration",
                "supports": ["rest", "graphql", "webhooks"],
                "auth_methods": ["bearer", "oauth", "api_key"],
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "AI Analyzer",
            "type": "ai",
            "description": "Uses AI models to analyze text, images, and data. Provides insights and recommendations.",
            "metadata": {
                "capability": "ai_analysis",
                "supports": ["text_analysis", "sentiment", "classification", "summarization"],
                "model": "gpt-4o-mini",
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Data Pipeline",
            "type": "system",
            "description": "Orchestrates data workflows with ETL capabilities. Supports batch and real-time processing.",
            "metadata": {
                "capability": "data_processing",
                "supports": ["extract", "transform", "load", "validate"],
                "batch_size": 1000,
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Email Handler",
            "type": "api",
            "description": "Manages email operations including sending, receiving, parsing, and classification.",
            "metadata": {
                "capability": "email_management",
                "supports": ["send", "receive", "parse", "classify", "attachments"],
                "protocols": ["smtp", "imap"],
                "version": "1.0.0"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Insert operators
    result = await db.operators.insert_many(operators)
    print(f"✅ Successfully seeded {len(result.inserted_ids)} operators!")
    
    # Create audit log entry
    audit_entry = {
        "id": str(uuid.uuid4()),
        "event_type": "system_config",
        "user_id": None,
        "user_email": "system",
        "action": "Initial database seed completed",
        "details": {"operators_created": len(result.inserted_ids)},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_log.insert_one(audit_entry)
    
    client.close()
    print("✅ Seed completed successfully!")

if __name__ == "__main__":
    print("🌱 Starting GARVIS OpenClaw database seed...")
    asyncio.run(seed_operators())
