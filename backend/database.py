from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
client = AsyncIOMotorClient(MONGODB_URL)
database = client.edusummarizer

# Collections
users_collection = database.users
summaries_collection = database.summaries
quizzes_collection = database.quizzes
