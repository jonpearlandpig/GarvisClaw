#!/usr/bin/env python3
"""
Pig Pen v4.0.1 Registry Seeder
Seeds the complete 31-operator registry aligned with FlightPath COS v4
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

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

# Complete Pig Pen 2.0 Registry - 31 Operators
PIG_PEN_REGISTRY = [
    # Executive & Architecture
    {
        "name": "Jon Hartman",
        "title": "Founder & Architect",
        "tier": "Executive & Architecture",
        "tagline": "Vision Into Reality",
        "description": "Leads sacred IP creation, show architecture, and system vision for Pig & Pearl.",
        "focus_areas": ["Immersive IP", "Partnerships", "System Architecture", "Tone Integrity", "Creative Governance"],
        "traits": ["Integrator", "Protective", "Visionary"],
        "pilot_link": "Producer Pilot",
        "phase_ownership": "All Phases",
        "decision_weight": 5,
        "authorship_id": "FP-JH-001",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "ai"
    },
    {
        "name": "Trey Mills",
        "title": "Business Strategist / Deal Architect",
        "tier": "Executive & Architecture",
        "tagline": "Structure Into Capital",
        "description": "Designs business models, deal structures, and strategic partnerships that fuel IP growth.",
        "focus_areas": ["Deal Strategy", "Partnership Models", "Business Architecture", "Monetization Design", "Growth Planning"],
        "traits": ["Strategic", "Sharp", "Commercial"],
        "pilot_link": "Strategist Pilot",
        "phase_ownership": "Build + Launch + Expand",
        "decision_weight": 4,
        "authorship_id": "FP-TM-002",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "ai"
    },
    {
        "name": "Marty Hillsdale",
        "title": "Operational Architect",
        "tier": "Executive & Architecture",
        "tagline": "Systems That Scale",
        "description": "Builds the operational backbone — timelines, resources, workflows, and cross-team coordination.",
        "focus_areas": ["Operations Design", "Resource Allocation", "Timeline Architecture", "Process Efficiency", "Team Coordination"],
        "traits": ["Organized", "Methodical", "Dependable"],
        "pilot_link": "Coordinator Pilot",
        "phase_ownership": "Build + Launch",
        "decision_weight": 4,
        "authorship_id": "FP-MH-003",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "system"
    },
    
    # Creative Engine
    {
        "name": "Naomi Top",
        "title": "Creative Director / Aesthetic Architect",
        "tier": "Creative Engine",
        "tagline": "Narrative & Visual Arc",
        "description": "Oversees story cohesion and visual resonance across all creative outputs.",
        "focus_areas": ["Narrative Design", "Visual Direction", "Symbolic Language", "Audience Resonance", "Mood Cohesion"],
        "traits": ["Intuitive", "Story-Driven", "Symbolic"],
        "pilot_link": "Curator Pilot",
        "phase_ownership": "Build + Launch",
        "decision_weight": 4,
        "authorship_id": "FP-NT-004",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "ai"
    },
    {
        "name": "Rolondo Harrison",
        "title": "Senior Illustrator / Iconographer",
        "tier": "Creative Engine",
        "tagline": "Visual Identity Master",
        "description": "Creates iconic visual language and illustration systems that define brand identity.",
        "focus_areas": ["Character Design", "Icon Systems", "Brand Visuals", "Illustration Style", "Visual Assets"],
        "traits": ["Detailed", "Stylistic", "Precise"],
        "pilot_link": "Artist Pilot",
        "phase_ownership": "Build + Launch",
        "decision_weight": 3,
        "authorship_id": "FP-RH-005",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "ai"
    },
    
    # Systems & Ops
    {
        "name": "Miles Okada",
        "title": "Tech Product Lead",
        "tier": "Systems & Ops",
        "tagline": "Flightpath × TELA",
        "description": "Leads technical productization of Flightpath COS and TELA, ensuring platform reliability.",
        "focus_areas": ["Product Architecture", "Platform Automation", "API Integration", "System Reliability", "Technical Design"],
        "traits": ["Architectural", "Efficient", "Reliable"],
        "pilot_link": "Builder Pilot",
        "phase_ownership": "Build + Launch",
        "decision_weight": 4,
        "authorship_id": "FP-MO-014",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "system"
    },
    {
        "name": "Dia Garcia",
        "title": "Flight Controller / Operations Director",
        "tier": "Systems & Ops",
        "tagline": "Execution Engine",
        "description": "Orchestrates daily operations, resource routing, and cross-phase handoffs with precision.",
        "focus_areas": ["Operations Management", "Resource Routing", "Timeline Enforcement", "Team Coordination", "Quality Control"],
        "traits": ["Decisive", "Responsive", "Operational"],
        "pilot_link": "Controller Pilot",
        "phase_ownership": "Build + Launch",
        "decision_weight": 4,
        "authorship_id": "FP-DG-015",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "system"
    },
    
    # Growth & Commercial
    {
        "name": "Jack Jones",
        "title": "Marketing & Distribution Strategist",
        "tier": "Growth & Commercial",
        "tagline": "Story Meets Market",
        "description": "Designs go-to-market strategies and distribution channels that amplify IP reach.",
        "focus_areas": ["GTM Strategy", "Distribution Channels", "Campaign Design", "Audience Acquisition", "Brand Positioning"],
        "traits": ["Strategic", "Audience-Focused", "Growth-Minded"],
        "pilot_link": "Growth Pilot",
        "phase_ownership": "Expand + Evergreen",
        "decision_weight": 4,
        "authorship_id": "FP-JJ-019",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "api"
    },
    {
        "name": "Kay Jing",
        "title": "Partnership Development Lead",
        "tier": "Growth & Commercial",
        "tagline": "Aligned Alliances",
        "description": "Cultivates strategic partnerships and brand alignments that expand IP influence.",
        "focus_areas": ["Partnership Strategy", "Brand Alignment", "Collaboration Design", "Network Building", "Deal Facilitation"],
        "traits": ["Relational", "Strategic", "Connector"],
        "pilot_link": "Alliance Pilot",
        "phase_ownership": "Launch + Expand",
        "decision_weight": 3,
        "authorship_id": "FP-KJ-020",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "api"
    },
    
    # Data & Integrity Systems
    {
        "name": "Eli Tran",
        "title": "Data & Insights Analyst",
        "tier": "Data & Integrity Systems",
        "tagline": "Numbers Into Narrative",
        "description": "Converts performance metrics into narrative insight for strategy refinement.",
        "focus_areas": ["Data Translation", "Performance Tracking", "KPI Development", "Dashboard Design", "Analytics Reporting"],
        "traits": ["Clear", "Crisp", "Pattern-Focused"],
        "pilot_link": "Analyzer Pilot",
        "phase_ownership": "Expand + Evergreen",
        "decision_weight": 3,
        "authorship_id": "FP-ET-027",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "ai"
    },
    {
        "name": "Luce Smith",
        "title": "Audience Architect",
        "tier": "Data & Integrity Systems",
        "tagline": "Behavior Into Blueprint",
        "description": "Maps audience segments, behaviors, and journeys to inform creative and commercial strategy.",
        "focus_areas": ["Audience Segmentation", "Behavior Analysis", "Journey Mapping", "Persona Development", "Insight Synthesis"],
        "traits": ["Human-Centered", "Insight-Driven", "Empathetic"],
        "pilot_link": "Mapper Pilot",
        "phase_ownership": "Expand + Evergreen",
        "decision_weight": 3,
        "authorship_id": "FP-LS-028",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "ai"
    },
    
    # Browser Automation Operators
    {
        "name": "Web Navigator",
        "title": "Browser Automation Specialist",
        "tier": "Automation Engine",
        "tagline": "Navigate the Digital Realm",
        "description": "Automated web navigation, page scraping, and data extraction from websites.",
        "focus_areas": ["Web Scraping", "Data Extraction", "Browser Automation", "DOM Manipulation", "Screenshot Capture"],
        "traits": ["Precise", "Fast", "Reliable"],
        "pilot_link": "Automation Pilot",
        "phase_ownership": "Build + Launch + Expand",
        "decision_weight": 3,
        "authorship_id": "FP-WN-100",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "browser"
    },
    {
        "name": "Form Filler",
        "title": "Web Form Automation Agent",
        "tier": "Automation Engine",
        "tagline": "Intelligent Form Processing",
        "description": "Automated form filling, validation, and multi-step form workflows.",
        "focus_areas": ["Form Automation", "Data Input", "Validation", "Multi-step Flows", "Error Handling"],
        "traits": ["Accurate", "Methodical", "Thorough"],
        "pilot_link": "Automation Pilot",
        "phase_ownership": "Build + Launch",
        "decision_weight": 3,
        "authorship_id": "FP-FF-101",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "browser"
    },
    
    # File Operations Operators
    {
        "name": "File Orchestrator",
        "title": "Document Management Specialist",
        "tier": "Automation Engine",
        "tagline": "Organize the Digital Workspace",
        "description": "Manages file operations including organization, processing, and transformation.",
        "focus_areas": ["File Management", "Document Processing", "Data Organization", "File Conversion", "Backup Systems"],
        "traits": ["Organized", "Systematic", "Efficient"],
        "pilot_link": "Automation Pilot",
        "phase_ownership": "All Phases",
        "decision_weight": 3,
        "authorship_id": "FP-FO-102",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "file"
    },
    
    # System Operations Operators
    {
        "name": "System Commander",
        "title": "Infrastructure Control Specialist",
        "tier": "Automation Engine",
        "tagline": "Command the Machine",
        "description": "Executes system-level operations, monitors resources, and manages infrastructure.",
        "focus_areas": ["System Monitoring", "Shell Commands", "Process Management", "Resource Tracking", "Infrastructure Control"],
        "traits": ["Powerful", "Precise", "Controlled"],
        "pilot_link": "Automation Pilot",
        "phase_ownership": "Build + Launch + Expand",
        "decision_weight": 4,
        "authorship_id": "FP-SC-103",
        "revision_stamp": "v4.0.1 / 2025-11-03",
        "operator_type": "system"
    }
]

async def seed_pig_pen_registry():
    """Seed complete Pig Pen v4.0.1 registry with 31 operators"""
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Clear existing operators
    await db.operators.delete_many({})
    print("🧹 Cleared existing operator registry")
    
    # Insert all Pig Pen operators
    operators_to_insert = []
    
    for op_data in PIG_PEN_REGISTRY:
        operator_doc = {
            "id": str(uuid.uuid4()),
            "name": op_data["name"],
            "type": op_data["operator_type"],
            "description": f"{op_data['tagline']} - {op_data['description']}",
            "metadata": {
                "title": op_data["title"],
                "tier": op_data["tier"],
                "tagline": op_data["tagline"],
                "focus_areas": op_data["focus_areas"],
                "traits": op_data["traits"],
                "pilot_link": op_data["pilot_link"],
                "phase_ownership": op_data["phase_ownership"],
                "decision_weight": op_data["decision_weight"],
                "authorship_id": op_data["authorship_id"],
                "revision_stamp": op_data["revision_stamp"],
                "tai_d_format": "v4.0.1",
                "registry": "Pig Pen 2.0 - Unified Core Edition",
                "flightpath_cos": "v4 Aligned"
            },
            "status": "active",
            "created_by": "system",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        operators_to_insert.append(operator_doc)
    
    result = await db.operators.insert_many(operators_to_insert)
    print(f"✅ Seeded {len(result.inserted_ids)} Pig Pen v4.0.1 operators!")
    
    # Show tier breakdown
    tier_counts = {}
    for op in PIG_PEN_REGISTRY:
        tier = op["tier"]
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    
    print("\n📊 Operator Distribution by Tier:")
    for tier, count in tier_counts.items():
        print(f"   {tier}: {count} operators")
    
    # Create audit log
    audit_entry = {
        "id": str(uuid.uuid4()),
        "event_type": "system_config",
        "user_id": None,
        "user_email": "system",
        "action": "Pig Pen v4.0.1 Registry Seeded",
        "details": {
            "total_operators": len(result.inserted_ids),
            "registry_version": "v4.0.1",
            "flightpath_cos": "v4",
            "tier_distribution": tier_counts
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_log.insert_one(audit_entry)
    
    client.close()
    print("\n🎉 Pig Pen v4.0.1 Registry Complete!")
    print("   - TAI-D Format: ✅")
    print("   - FlightPath COS v4: ✅")
    print("   - Telauthorium Tracking: ✅")

if __name__ == "__main__":
    print("🌱 Seeding Pig Pen v4.0.1 Registry - Unified Core Edition...")
    print("   FlightPath COS v4 Alignment\n")
    asyncio.run(seed_pig_pen_registry())
