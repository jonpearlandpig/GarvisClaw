from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
from enum import Enum
from services import service_manager

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="GARVIS OpenClaw API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================
# ENUMS & CONSTANTS
# ============================================

class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class OperatorType(str, Enum):
    BROWSER = "browser"
    FILE = "file"
    SYSTEM = "system"
    API = "api"
    AI = "ai"

class AuditEventType(str, Enum):
    USER_LOGIN = "user_login"
    USER_CREATED = "user_created"
    USER_ROLE_CHANGED = "user_role_changed"
    OPERATOR_CREATED = "operator_created"
    OPERATOR_UPDATED = "operator_updated"
    OPERATOR_DELETED = "operator_deleted"
    CHAT_MESSAGE = "chat_message"
    SYSTEM_CONFIG = "system_config"
    TASK_CREATED = "task_created"
    TASK_EXECUTED = "task_executed"
    EXECUTION_COMPLETED = "execution_completed"
    EXECUTION_FAILED = "execution_failed"

class TaskStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"

class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

AUTHORITY_HIERARCHY = [
    {"level": 1, "name": "SOVEREIGN", "description": "Ultimate authority and decision maker"},
    {"level": 2, "name": "TELAUTHORIUM", "description": "Rights and authorization registry"},
    {"level": 3, "name": "GARVIS", "description": "Governance and intelligence layer"},
    {"level": 4, "name": "FLIGHTPATH", "description": "Phase and workflow control"},
    {"level": 5, "name": "MOSE", "description": "Operator routing and orchestration"},
    {"level": 6, "name": "PIG PEN", "description": "AI operator registry and execution"},
    {"level": 7, "name": "TELA", "description": "Task execution layer"},
    {"level": 8, "name": "AUDIT", "description": "Immutable event ledger"}
]

# ============================================
# MODELS
# ============================================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: UserRole = UserRole.VIEWER
    avatar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    role: Optional[UserRole] = UserRole.VIEWER

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[UserRole] = None

class Operator(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: OperatorType
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    status: str = "active"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class OperatorCreate(BaseModel):
    name: str
    type: OperatorType
    description: str
    metadata: Optional[Dict[str, Any]] = None

class OperatorUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class AuditLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: AuditEventType
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action: str
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    timestamp: datetime

class DashboardStats(BaseModel):
    total_users: int
    total_operators: int
    total_audit_events: int
    recent_activity: List[Dict[str, Any]]
    operators_by_type: Dict[str, int]

class Task(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    operator_id: str
    operator_type: OperatorType
    action: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    status: TaskStatus = TaskStatus.ACTIVE
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class TaskCreate(BaseModel):
    name: str
    description: str
    operator_id: str
    action: str
    parameters: Optional[Dict[str, Any]] = None

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    action: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    status: Optional[TaskStatus] = None

class Execution(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    task_name: str
    operator_type: OperatorType
    status: ExecutionStatus = ExecutionStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    started_by: str
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

class ExecutionCreate(BaseModel):
    task_id: str

# ============================================
# AUTHENTICATION & AUTHORIZATION
# ============================================

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Get current user from bearer token (user_id)"""
    if not credentials:
        return None
    
    user_id = credentials.credentials
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(user: Optional[User] = Depends(get_current_user)) -> User:
    """Require authenticated user"""
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

def require_role(required_role: UserRole):
    """Require specific role or higher"""
    role_hierarchy = {UserRole.VIEWER: 1, UserRole.EDITOR: 2, UserRole.ADMIN: 3}
    
    async def check_role(user: User = Depends(require_auth)) -> User:
        user_level = role_hierarchy.get(user.role, 0)
        required_level = role_hierarchy.get(required_role, 999)
        
        if user_level < required_level:
            raise HTTPException(status_code=403, detail=f"Requires {required_role} role or higher")
        return user
    
    return check_role

# ============================================
# AUDIT LOGGING
# ============================================

async def create_audit_log(event_type: AuditEventType, action: str, user: Optional[User] = None, details: Dict[str, Any] = None):
    """Create immutable audit log entry"""
    audit = AuditLog(
        event_type=event_type,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        action=action,
        details=details or {}
    )
    
    doc = audit.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    await db.audit_log.insert_one(doc)
    logger.info(f"Audit: {event_type} - {action} by {user.email if user else 'system'}")

# ============================================
# SYSTEM ROUTES
# ============================================

@api_router.get("/")
async def root():
    return {
        "message": "GARVIS OpenClaw API",
        "version": "1.0.0",
        "status": "operational"
    }

@api_router.get("/hierarchy")
async def get_hierarchy():
    """Get authority hierarchy structure"""
    return {"hierarchy": AUTHORITY_HIERARCHY}

# ============================================
# USER ROUTES
# ============================================

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(require_role(UserRole.ADMIN))):
    """Create new user (Admin only)"""
    # Check if user already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    user = User(**user_data.model_dump())
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    await create_audit_log(AuditEventType.USER_CREATED, f"Created user {user.email}", current_user, {"user_id": user.id})
    
    return user

@api_router.get("/users", response_model=List[User])
async def list_users(current_user: User = Depends(require_auth)):
    """List all users"""
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('last_login'), str):
            user['last_login'] = datetime.fromisoformat(user['last_login'])
    
    return users

@api_router.get("/users/me", response_model=User)
async def get_current_user_info(user: User = Depends(require_auth)):
    """Get current user info"""
    return user

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_data: UserUpdate, current_user: User = Depends(require_role(UserRole.ADMIN))):
    """Update user (Admin only)"""
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_data.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        
        if 'role' in update_data:
            await create_audit_log(
                AuditEventType.USER_ROLE_CHANGED,
                f"Changed role to {update_data['role']}",
                current_user,
                {"user_id": user_id, "new_role": update_data['role']}
            )
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    
    if isinstance(updated_user.get('created_at'), str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    if isinstance(updated_user.get('last_login'), str):
        updated_user['last_login'] = datetime.fromisoformat(updated_user['last_login'])
    
    return User(**updated_user)

class LoginRequest(BaseModel):
    email: EmailStr
    name: str

@api_router.post("/auth/login")
async def login(login_data: LoginRequest):
    """Simple login - creates user if doesn't exist, returns user_id as token"""
    user_doc = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    
    if user_doc:
        # Update last login
        await db.users.update_one(
            {"email": login_data.email},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
        
        if isinstance(user_doc.get('created_at'), str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        if isinstance(user_doc.get('last_login'), str):
            user_doc['last_login'] = datetime.fromisoformat(user_doc['last_login'])
        
        user = User(**user_doc)
    else:
        # Check if this is the first user - make them admin
        user_count = await db.users.count_documents({})
        role = UserRole.ADMIN if user_count == 0 else UserRole.VIEWER
        
        user = User(email=login_data.email, name=login_data.name, role=role, last_login=datetime.now(timezone.utc))
        
        doc = user.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        doc['last_login'] = doc['last_login'].isoformat()
        
        await db.users.insert_one(doc)
    
    await create_audit_log(AuditEventType.USER_LOGIN, f"User logged in: {login_data.email}", user)
    
    return {"token": user.id, "user": user}

# ============================================
# OPERATOR ROUTES (PIG PEN)
# ============================================

@api_router.post("/operators", response_model=Operator)
async def create_operator(operator_data: OperatorCreate, user: User = Depends(require_role(UserRole.EDITOR))):
    """Create new operator (Editor+ only)"""
    operator = Operator(**operator_data.model_dump(), created_by=user.id)
    
    doc = operator.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.operators.insert_one(doc)
    await create_audit_log(AuditEventType.OPERATOR_CREATED, f"Created operator {operator.name}", user, {"operator_id": operator.id})
    
    return operator

@api_router.get("/operators", response_model=List[Operator])
async def list_operators(user: User = Depends(require_auth)):
    """List all operators"""
    operators = await db.operators.find({}, {"_id": 0}).to_list(1000)
    
    for op in operators:
        if isinstance(op.get('created_at'), str):
            op['created_at'] = datetime.fromisoformat(op['created_at'])
        if op.get('updated_at') and isinstance(op['updated_at'], str):
            op['updated_at'] = datetime.fromisoformat(op['updated_at'])
    
    return operators

@api_router.get("/operators/{operator_id}", response_model=Operator)
async def get_operator(operator_id: str, user: User = Depends(require_auth)):
    """Get operator by ID"""
    operator = await db.operators.find_one({"id": operator_id}, {"_id": 0})
    
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    if isinstance(operator.get('created_at'), str):
        operator['created_at'] = datetime.fromisoformat(operator['created_at'])
    if operator.get('updated_at') and isinstance(operator['updated_at'], str):
        operator['updated_at'] = datetime.fromisoformat(operator['updated_at'])
    
    return Operator(**operator)

@api_router.put("/operators/{operator_id}", response_model=Operator)
async def update_operator(operator_id: str, operator_data: OperatorUpdate, user: User = Depends(require_role(UserRole.EDITOR))):
    """Update operator (Editor+ only)"""
    existing = await db.operators.find_one({"id": operator_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    update_data = {k: v for k, v in operator_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.operators.update_one({"id": operator_id}, {"$set": update_data})
        await create_audit_log(AuditEventType.OPERATOR_UPDATED, f"Updated operator {operator_id}", user, {"operator_id": operator_id})
    
    updated_op = await db.operators.find_one({"id": operator_id}, {"_id": 0})
    
    if isinstance(updated_op.get('created_at'), str):
        updated_op['created_at'] = datetime.fromisoformat(updated_op['created_at'])
    if updated_op.get('updated_at') and isinstance(updated_op['updated_at'], str):
        updated_op['updated_at'] = datetime.fromisoformat(updated_op['updated_at'])
    
    return Operator(**updated_op)

@api_router.delete("/operators/{operator_id}")
async def delete_operator(operator_id: str, user: User = Depends(require_role(UserRole.EDITOR))):
    """Delete operator (Editor+ only)"""
    result = await db.operators.delete_one({"id": operator_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    await create_audit_log(AuditEventType.OPERATOR_DELETED, f"Deleted operator {operator_id}", user, {"operator_id": operator_id})
    
    return {"message": "Operator deleted successfully"}

# ============================================
# AUDIT LOG ROUTES
# ============================================

@api_router.get("/audit", response_model=List[AuditLog])
async def get_audit_logs(limit: int = 100, user: User = Depends(require_auth)):
    """Get audit logs"""
    logs = await db.audit_log.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    for log in logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    return logs

# ============================================
# DASHBOARD ROUTES
# ============================================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: User = Depends(require_auth)):
    """Get dashboard statistics"""
    total_users = await db.users.count_documents({})
    total_operators = await db.operators.count_documents({})
    total_audit_events = await db.audit_log.count_documents({})
    
    # Get recent activity
    recent_logs = await db.audit_log.find({}, {"_id": 0}).sort("timestamp", -1).limit(5).to_list(5)
    for log in recent_logs:
        if isinstance(log.get('timestamp'), str):
            log['timestamp'] = datetime.fromisoformat(log['timestamp'])
    
    # Get operators by type
    operators = await db.operators.find({}, {"_id": 0, "type": 1}).to_list(1000)
    operators_by_type = {}
    for op in operators:
        op_type = op.get('type', 'unknown')
        operators_by_type[op_type] = operators_by_type.get(op_type, 0) + 1
    
    return DashboardStats(
        total_users=total_users,
        total_operators=total_operators,
        total_audit_events=total_audit_events,
        recent_activity=[{
            "event_type": log.get('event_type'),
            "action": log.get('action'),
            "user_email": log.get('user_email'),
            "timestamp": log.get('timestamp').isoformat() if isinstance(log.get('timestamp'), datetime) else log.get('timestamp')
        } for log in recent_logs],
        operators_by_type=operators_by_type
    )

# ============================================
# CHAT / LLM ROUTES
# ============================================

@api_router.post("/chat", response_model=ChatResponse)
async def chat(message: ChatMessage, user: User = Depends(require_auth)):
    """Chat with GARVIS AI assistant"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.environ.get('EMERGENT_LLM_KEY')}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are GARVIS, an AI governance and automation assistant. You help users understand the GARVIS OpenClaw system, which combines governance (authority hierarchy, audit logging, role-based access) with automation (browser automation, file operations, AI operators). Be helpful, concise, and focus on governance and automation topics."
                        },
                        {
                            "role": "user",
                            "content": message.message
                        }
                    ],
                    "max_tokens": 500
                }
            )
            
            response.raise_for_status()
            data = response.json()
            
            ai_response = data['choices'][0]['message']['content']
            
            await create_audit_log(
                AuditEventType.CHAT_MESSAGE,
                f"Chat message: {message.message[:50]}...",
                user,
                {"message_length": len(message.message), "response_length": len(ai_response)}
            )
            
            return ChatResponse(
                response=ai_response,
                timestamp=datetime.now(timezone.utc)
            )
    
    except httpx.HTTPStatusError as e:
        logger.error(f"LLM API error: {e}")
        raise HTTPException(status_code=502, detail="AI service unavailable")
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat service error")

# ============================================
# TASK ROUTES
# ============================================

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, user: User = Depends(require_role(UserRole.EDITOR))):
    """Create new task (Editor+ only)"""
    # Verify operator exists
    operator = await db.operators.find_one({"id": task_data.operator_id})
    if not operator:
        raise HTTPException(status_code=404, detail="Operator not found")
    
    task = Task(
        **task_data.model_dump(),
        operator_type=operator["type"],
        created_by=user.id
    )
    
    doc = task.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.tasks.insert_one(doc)
    await create_audit_log(AuditEventType.TASK_CREATED, f"Created task {task.name}", user, {"task_id": task.id})
    
    return task

@api_router.get("/tasks", response_model=List[Task])
async def list_tasks(user: User = Depends(require_auth)):
    """List all tasks"""
    tasks = await db.tasks.find({}, {"_id": 0}).to_list(1000)
    
    for task in tasks:
        if isinstance(task.get('created_at'), str):
            task['created_at'] = datetime.fromisoformat(task['created_at'])
        if task.get('updated_at') and isinstance(task['updated_at'], str):
            task['updated_at'] = datetime.fromisoformat(task['updated_at'])
    
    return tasks

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, user: User = Depends(require_auth)):
    """Get task by ID"""
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if isinstance(task.get('created_at'), str):
        task['created_at'] = datetime.fromisoformat(task['created_at'])
    if task.get('updated_at') and isinstance(task['updated_at'], str):
        task['updated_at'] = datetime.fromisoformat(task['updated_at'])
    
    return Task(**task)

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, user: User = Depends(require_role(UserRole.EDITOR))):
    """Update task (Editor+ only)"""
    existing = await db.tasks.find_one({"id": task_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    
    if isinstance(updated_task.get('created_at'), str):
        updated_task['created_at'] = datetime.fromisoformat(updated_task['created_at'])
    if updated_task.get('updated_at') and isinstance(updated_task['updated_at'], str):
        updated_task['updated_at'] = datetime.fromisoformat(updated_task['updated_at'])
    
    return Task(**updated_task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(require_role(UserRole.EDITOR))):
    """Delete task (Editor+ only)"""
    result = await db.tasks.delete_one({"id": task_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"message": "Task deleted successfully"}

# ============================================
# EXECUTION ROUTES
# ============================================

@api_router.post("/executions", response_model=Execution)
async def create_execution(exec_data: ExecutionCreate, user: User = Depends(require_auth)):
    """Execute a task"""
    # Get task
    task = await db.tasks.find_one({"id": exec_data.task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if task is active
    if task.get('status') != 'active':
        raise HTTPException(status_code=400, detail="Task is not active")
    
    # Create execution record
    execution = Execution(
        task_id=task['id'],
        task_name=task['name'],
        operator_type=task['operator_type'],
        started_by=user.id
    )
    
    doc = execution.model_dump()
    doc['started_at'] = doc['started_at'].isoformat()
    doc['logs'] = []
    
    await db.executions.insert_one(doc)
    await create_audit_log(AuditEventType.TASK_EXECUTED, f"Started execution of task {task['name']}", user, {"execution_id": execution.id})
    
    # Execute task asynchronously
    asyncio.create_task(execute_task_async(execution.id, task, user))
    
    return execution

async def execute_task_async(execution_id: str, task: Dict[str, Any], user: User):
    """Execute task asynchronously"""
    start_time = datetime.now(timezone.utc)
    logs = []
    
    try:
        logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Starting execution")
        logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Operator type: {task['operator_type']}")
        logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Action: {task['action']}")
        
        # Update status to running
        await db.executions.update_one(
            {"id": execution_id},
            {"$set": {"status": "running", "logs": logs}}
        )
        
        # Execute based on operator type
        result = None
        
        if task['operator_type'] == 'browser':
            logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Executing browser automation")
            result = await service_manager.browser_service.execute(task['action'], task.get('parameters', {}))
        
        elif task['operator_type'] == 'file':
            logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Executing file operation")
            result = await service_manager.file_service.execute(task['action'], task.get('parameters', {}))
        
        elif task['operator_type'] == 'system':
            # Check if user is admin
            if user.role != UserRole.ADMIN:
                raise PermissionError("System operations require Admin role")
            
            logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Executing system operation (Admin only)")
            result = await service_manager.system_service.execute(task['action'], task.get('parameters', {}))
        
        else:
            logs.append(f"[{datetime.now(timezone.utc).isoformat()}] Operator type not implemented for execution: {task['operator_type']}")
            result = {"success": False, "error": f"Operator type {task['operator_type']} not implemented"}
        
        # Calculate duration
        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        
        logs.append(f"[{end_time.isoformat()}] Execution completed in {duration:.2f}s")
        
        # Update execution with result
        await db.executions.update_one(
            {"id": execution_id},
            {
                "$set": {
                    "status": "completed",
                    "result": result,
                    "logs": logs,
                    "completed_at": end_time.isoformat(),
                    "duration_seconds": duration
                }
            }
        )
        
        await create_audit_log(
            AuditEventType.EXECUTION_COMPLETED,
            f"Execution {execution_id} completed successfully",
            user,
            {"execution_id": execution_id, "duration": duration}
        )
        
    except Exception as e:
        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        
        logs.append(f"[{end_time.isoformat()}] Execution failed: {str(e)}")
        
        await db.executions.update_one(
            {"id": execution_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(e),
                    "logs": logs,
                    "completed_at": end_time.isoformat(),
                    "duration_seconds": duration
                }
            }
        )
        
        await create_audit_log(
            AuditEventType.EXECUTION_FAILED,
            f"Execution {execution_id} failed: {str(e)}",
            user,
            {"execution_id": execution_id, "error": str(e)}
        )

@api_router.get("/executions", response_model=List[Execution])
async def list_executions(limit: int = 50, user: User = Depends(require_auth)):
    """List recent executions"""
    executions = await db.executions.find({}, {"_id": 0}).sort("started_at", -1).limit(limit).to_list(limit)
    
    for execution in executions:
        if isinstance(execution.get('started_at'), str):
            execution['started_at'] = datetime.fromisoformat(execution['started_at'])
        if execution.get('completed_at') and isinstance(execution['completed_at'], str):
            execution['completed_at'] = datetime.fromisoformat(execution['completed_at'])
    
    return executions

@api_router.get("/executions/{execution_id}", response_model=Execution)
async def get_execution(execution_id: str, user: User = Depends(require_auth)):
    """Get execution by ID"""
    execution = await db.executions.find_one({"id": execution_id}, {"_id": 0})
    
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    
    if isinstance(execution.get('started_at'), str):
        execution['started_at'] = datetime.fromisoformat(execution['started_at'])
    if execution.get('completed_at') and isinstance(execution['completed_at'], str):
        execution['completed_at'] = datetime.fromisoformat(execution['completed_at'])
    
    return Execution(**execution)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    await service_manager.cleanup()
    client.close()
