print("Importing modules...")
try:
    import fastapi
    print("fastapi imported")
    import uvicorn
    print("uvicorn imported")
    import rag
    print("rag imported")
    from app import app
    print("app imported")
    print("All imports successful")
except Exception as e:
    import traceback
    traceback.print_exc()
