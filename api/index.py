"""
Vercel Serverless Handler for FastAPI Backend
WARNING: This has significant limitations - see README for details
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import the FastAPI app from backend
from app import app as fastapi_app

# Vercel serverless handler
app = fastapi_app
