# EduSummarizer Hub

An AI-powered educational platform that helps students summarize, translate, and quiz on uploaded lecture notes or articles. Built as a portfolio project demonstrating full-stack development with AI integration.

## Features
- Upload text files or articles
- AI-powered summarization using HuggingFace models
- Multilingual translation support
- Interactive quizzes generated from summaries
- Progress tracking dashboard
- Responsive web interface

## Tech Stack
- **Frontend**: HTML5, CSS, TailwindCSS, JavaScript
- **Backend**: Python, FastAPI
- **Database**: MongoDB
- **AI**: HuggingFace Inference API (Summarization, Translation, Question Answering)
- **Hosting**: Vercel (frontend), Railway (backend)
- **Auth**: Supabase (optional for user management)

## Setup Instructions

### Prerequisites
- Python 3.8+
- MongoDB (local or Atlas)
- HuggingFace account with API token
- Git

### Backend Setup
1. Navigate to backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables in `.env` (copy from root)
4. Run the server: `uvicorn main:app --reload`

### Frontend Setup
1. Navigate to frontend directory: `cd frontend`
2. Open index.html in a browser or use a local server

### Deployment
- Backend: Deploy to Railway
- Frontend: Deploy to Vercel

## Usage
1. Upload a text file or paste content
2. Get AI summary
3. Translate to desired language
4. Take quiz to test knowledge
5. Track progress in dashboard

## API Endpoints
- POST /upload: Upload file
- POST /summarize: Generate summary
- POST /translate: Translate text
- POST /quiz: Generate quiz questions

## Contributing
Feel free to fork and contribute. This is a portfolio project for demonstration purposes.

## License
MIT License
