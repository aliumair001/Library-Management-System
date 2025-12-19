from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.routers import auth, users, books, lending


@asynccontextmanager
async def lifespan(app: FastAPI):
    
    # Startup
    print("Starting Library Management System with JWT...")
    await connect_to_mongo()
    print("Application ready!")
    print(f"Static OTP for testing: {settings.STATIC_OTP}")
    print(f"Access Token Expiry: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"Refresh Token Expiry: {settings.REFRESH_TOKEN_EXPIRE_DAYS} days")
    
    yield
    
    # Shutdown
    print(" Shutting down...")
    await close_mongo_connection()
    print("Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME + " (JWT)",
    description="""
     Library Management System 
    
    """,
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS Configuration - Allow frontend access
print("🌐 CORS Configuration:")
print("   Allowed Origins: http://localhost:5173, http://localhost:5174")
print("   Allow Credentials: False (for debugging)")
print()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=False,  # Changed to False to match frontend
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - health check."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "auth": "JWT with OTP",
        "message": "Library Management System API is running"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "auth_type": "JWT",
        "otp_type": "Static (123456)",
        "version": "2.0.0"
    }

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(lending.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    
    print(f"""
          LIBRARY MANAGEMENT SYSTEM (JWT)
    
    """)
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )