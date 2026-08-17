import json
import datetime
from sqlalchemy.orm import Session
from .models import (
    User, Company, Lead, LeadActivity, Task, ScoringRule, FilterRule, PipelineStage, DuplicateGroup, Base
)
from .database import engine, SessionLocal
from .engines.scoring_engine import calculate_lead_score

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Check if already seeded
    if db.query(User).filter(User.email == "admin@admin.com").first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database with default admin credentials and sample leads...")

    # 1. Users
    admin = User(
        name="System Administrator",
        email="admin@admin.com",
        password_hash="admin@access.com", # Plain text for dev/seed simplicity as requested
        role="Admin"
    )
    rep1 = User(
        name="Ali Khan",
        email="ali@crm.com",
        password_hash="ali123",
        role="Senior Sales Rep"
    )
    rep2 = User(
        name="Sarah Connor",
        email="sarah@crm.com",
        password_hash="sarah123",
        role="Account Executive"
    )
    db.add_all([admin, rep1, rep2])
    db.commit()

    # 2. Pipeline Stages
    stages = [
        PipelineStage(key="NEW", name="New Leads", display_order=1, color="#64748b"),
        PipelineStage(key="CONTACTED", name="Contacted", display_order=2, color="#0284c7"),
        PipelineStage(key="QUALIFIED", name="Qualified", display_order=3, color="#8b5cf6"),
        PipelineStage(key="MEETING", name="Meeting Scheduled", display_order=4, color="#eab308"),
        PipelineStage(key="PROPOSAL", name="Proposal Sent", display_order=5, color="#f97316"),
        PipelineStage(key="NEGOTIATION", name="Negotiation", display_order=6, color="#ec4899"),
        PipelineStage(key="WON", name="Closed Won", display_order=7, color="#22c55e"),
        PipelineStage(key="LOST", name="Closed Lost", display_order=8, color="#ef4444"),
    ]
    db.add_all(stages)
    db.commit()

    # 3. Dynamic Scoring Rules
    rule1 = ScoringRule(
        name="High Value CTO / Executive",
        description="Awards points to CTOs, CEOs, and Tech Leads in larger enterprises",
        conditions_json=json.dumps([
            {"field": "job_title", "operator": "contains", "value": "CTO"},
            {"field": "company_size", "operator": "in", "value": ["50-100", "100-500", "500+"]}
        ]),
        action="increase_score",
        score_value=20,
        set_priority="HIGH",
        create_task=True,
        task_title="Executive Outreach & Product Demo Call",
        priority=1,
        is_active=True
    )
    rule2 = ScoringRule(
        name="SaaS & Tech Industry Match",
        description="Applies bonus score for SaaS and Software company leads",
        conditions_json=json.dumps([
            {"field": "industry", "operator": "in", "value": ["SaaS", "Software", "Cloud", "Fintech"]}
        ]),
        action="increase_score",
        score_value=15,
        priority=2,
        is_active=True
    )
    rule3 = ScoringRule(
        name="Verified Email Credibility",
        description="Gives points when lead email deliverability is verified",
        conditions_json=json.dumps([
            {"field": "email_verified", "operator": "is_true", "value": True}
        ]),
        action="increase_score",
        score_value=10,
        priority=3,
        is_active=True
    )
    rule4 = ScoringRule(
        name="High Intent Pricing Page Visit",
        description="Triggered when prospect visits pricing page",
        conditions_json=json.dumps([
            {"field": "visited_pricing_page", "operator": "is_true", "value": True}
        ]),
        action="increase_score",
        score_value=15,
        set_priority="HIGH",
        create_task=True,
        task_title="Pricing & Enterprise License Discussion",
        priority=4,
        is_active=True
    )
    rule5 = ScoringRule(
        name="Proposal Download Signal",
        description="Awards points when prospect downloads solution architecture PDF",
        conditions_json=json.dumps([
            {"field": "downloaded_proposal", "operator": "is_true", "value": True}
        ]),
        action="increase_score",
        score_value=10,
        priority=5,
        is_active=True
    )
    rules_list = [rule1, rule2, rule3, rule4, rule5]
    db.add_all(rules_list)
    db.commit()

    # 4. Companies
    companies_data = [
        ("ABC Technologies", "abctech.com", "Software", "50-100", 85, "New York, USA"),
        ("Acme Global Systems", "acmeglobal.io", "SaaS", "100-500", 250, "San Francisco, USA"),
        ("Nexus Digital Ltd", "nexusdigital.co", "Cloud", "10-50", 35, "Toronto, Canada"),
        ("Apex Financial Tech", "apexfin.com", "Fintech", "500+", 1200, "London, UK"),
        ("Vanguard Health AI", "vanguardhealth.org", "Healthcare", "100-500", 320, "Boston, USA"),
        ("Omni Commerce Inc", "omnicommerce.com", "E-commerce", "50-100", 90, "Berlin, Germany"),
        ("Starlight Data Labs", "starlightdata.ai", "SaaS", "10-50", 40, "Austin, USA"),
    ]
    company_objs = []
    for name, domain, ind, size, emp, loc in companies_data:
        c = Company(
            name=name, domain=domain, industry=ind, company_size=size,
            employee_count=emp, location=loc, website=f"https://{domain}"
        )
        db.add(c)
        company_objs.append(c)
    db.commit()

    # 5. Leads (Including requested example John Smith LD-10492)
    sample_leads = [
        {
            "code": "LD-10492", "fn": "John", "ln": "Smith", "email": "john@abc.com",
            "phone": "+1 (212) 555-0192", "country": "USA", "city": "New York",
            "industry": "Software", "size": "50-100", "title": "CTO", "source": "Website",
            "comp_idx": 0, "verified": True, "pricing": True, "proposal": True,
            "stage": "QUALIFIED", "value": 45000.0, "assigned": rep1.id
        },
        {
            "code": "LD-10493", "fn": "John", "ln": "Smith", "email": "john.smith@abc.com", # Duplicate pair!
            "phone": "+1 (212) 555-0192", "country": "USA", "city": "New York",
            "industry": "Software", "size": "50-100", "title": "Chief Technology Officer", "source": "CSV Import",
            "comp_idx": 0, "verified": True, "pricing": True, "proposal": False,
            "stage": "NEW", "value": 45000.0, "assigned": rep1.id
        },
        {
            "code": "LD-10494", "fn": "Emily", "ln": "Watson", "email": "emily@acmeglobal.io",
            "phone": "+1 (415) 890-1122", "country": "USA", "city": "San Francisco",
            "industry": "SaaS", "size": "100-500", "title": "VP of Engineering", "source": "Landing Page",
            "comp_idx": 1, "verified": True, "pricing": True, "proposal": True,
            "stage": "MEETING", "value": 82000.0, "assigned": rep2.id
        },
        {
            "code": "LD-10495", "fn": "Marcus", "ln": "Vance", "email": "marcus@nexusdigital.co",
            "phone": "+1 (416) 778-9900", "country": "Canada", "city": "Toronto",
            "industry": "Cloud", "size": "10-50", "title": "CEO & Founder", "source": "Referral",
            "comp_idx": 2, "verified": True, "pricing": True, "proposal": False,
            "stage": "PROPOSAL", "value": 28000.0, "assigned": rep1.id
        },
        {
            "code": "LD-10496", "fn": "Sophia", "ln": "Chen", "email": "sophia.chen@apexfin.com",
            "phone": "+44 20 7946 0912", "country": "UK", "city": "London",
            "industry": "Fintech", "size": "500+", "title": "Head of Enterprise IT", "source": "Campaign",
            "comp_idx": 3, "verified": True, "pricing": True, "proposal": True,
            "stage": "NEGOTIATION", "value": 140000.0, "assigned": rep2.id
        },
        {
            "code": "LD-10497", "fn": "David", "ln": "Miller", "email": "dmiller@vanguardhealth.org",
            "phone": "+1 (617) 443-8821", "country": "USA", "city": "Boston",
            "industry": "Healthcare", "size": "100-500", "title": "Director of Operations", "source": "Website",
            "comp_idx": 4, "verified": True, "pricing": False, "proposal": False,
            "stage": "CONTACTED", "value": 35000.0, "assigned": rep1.id
        },
        {
            "code": "LD-10498", "fn": "Clara", "ln": "Schulz", "email": "clara@omnicommerce.de",
            "phone": "+49 30 1234567", "country": "Germany", "city": "Berlin",
            "industry": "E-commerce", "size": "50-100", "title": "Procurement Manager", "source": "API",
            "comp_idx": 5, "verified": True, "pricing": False, "proposal": False,
            "stage": "NEW", "value": 18000.0, "assigned": rep2.id
        },
        {
            "code": "LD-10499", "fn": "Alex", "ln": "Rivera", "email": "arivera@starlightdata.ai",
            "phone": "+1 (512) 667-4433", "country": "USA", "city": "Austin",
            "industry": "SaaS", "size": "10-50", "title": "CTO", "source": "Website",
            "comp_idx": 6, "verified": True, "pricing": True, "proposal": True,
            "stage": "WON", "value": 95000.0, "assigned": rep1.id
        },
    ]

    for lead_data in sample_leads:
        company_obj = company_objs[lead_data["comp_idx"]]
        lead = Lead(
            lead_code=lead_data["code"],
            first_name=lead_data["fn"],
            last_name=lead_data["ln"],
            email=lead_data["email"],
            phone=lead_data["phone"],
            country=lead_data["country"],
            city=lead_data["city"],
            industry=lead_data["industry"],
            company_size=lead_data["size"],
            job_title=lead_data["title"],
            source=lead_data["source"],
            company_id=company_obj.id,
            email_verified=lead_data["verified"],
            visited_pricing_page=lead_data["pricing"],
            downloaded_proposal=lead_data["proposal"],
            stage=lead_data["stage"],
            deal_value=lead_data["value"],
            assigned_to_id=lead_data["assigned"]
        )
        db.add(lead)
        db.flush()

        # Score lead using rule engine
        score, status, conv_prob, applied = calculate_lead_score(lead, rules_list, db)
        lead.score = score
        lead.status = status
        lead.conversion_probability = conv_prob

        # Add Activity Timeline items (Exact sample matching user request for John Smith LD-10492)
        if lead.lead_code == "LD-10492":
            activities = [
                ("Lead Created", "Lead created via Website Form"),
                ("Email Verified", "Email address verified via MX domain check"),
                ("Lead Scored", f"Lead scored automatically → {score}/100 ({status})"),
                ("Sales Assigned", "Sales representative Ali Khan assigned to lead"),
                ("Email Sent", "Initial introductory product deck emailed to john@abc.com"),
                ("Follow-up Scheduled", "Follow-up meeting scheduled for tomorrow 10:00 AM")
            ]
            for act_type, desc in activities:
                db.add(LeadActivity(lead_id=lead.id, activity_type=act_type, description=desc))
            
            # Add Task
            db.add(Task(
                lead_id=lead.id,
                title="Follow-up Call with CTO John Smith",
                description="Discuss enterprise pricing details and custom deployment timeline",
                due_date="Tomorrow 10:00 AM",
                status="PENDING",
                priority="HIGH",
                assigned_to_id=rep1.id
            ))
        else:
            db.add(LeadActivity(lead_id=lead.id, activity_type="Lead Created", description=f"Lead created via {lead.source}"))
            db.add(LeadActivity(lead_id=lead.id, activity_type="Lead Scored", description=f"Lead scored → {score}/100 ({status})"))

    db.commit()

    # 6. Duplicate Group (John Smith duplicates)
    l1 = db.query(Lead).filter(Lead.lead_code == "LD-10492").first()
    l2 = db.query(Lead).filter(Lead.lead_code == "LD-10493").first()
    if l1 and l2:
        dup = DuplicateGroup(
            lead_id_1=l1.id,
            lead_id_2=l2.id,
            match_reason="Exact Email Match (john@abc.com vs john.smith@abc.com)",
            similarity_score=0.98,
            status="PENDING"
        )
        db.add(dup)
        db.commit()

    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
