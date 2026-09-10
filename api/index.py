import sys
import os

# Add root project directory to sys.path so server, db, backend modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import app

