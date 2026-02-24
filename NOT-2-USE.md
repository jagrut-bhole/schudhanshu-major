# 🚀 Complete Beginner's Guide: Building Your AI Content Creation Platform

## Tech Stack Overview
- **Frontend**: React (with Vite)
- **Backend**: Python (FastAPI)
- **Database**: PostgreSQL (hosted on Neon DB)
- **AI/Animations**: Manim (Python) for 2D animations
- **Styling**: Tailwind CSS

---

# PHASE 1: ENVIRONMENT SETUP (Week 1)

## Step 1: Install Required Tools

### 1.1 Install Node.js (for React)
1. Go to https://nodejs.org
2. Download "LTS" version
3. Run the installer, click Next → Next → Install
4. Open terminal and verify: `node --version` (should show v18+)

### 1.2 Install Python
1. Go to https://python.org/downloads
2. Download Python 3.11+
3. ⚠️ IMPORTANT: Check "Add Python to PATH" during install
4. Verify: `python --version`

### 1.3 Install VS Code (Code Editor)
1. Go to https://code.visualstudio.com
2. Download and install
3. Install these extensions inside VS Code:
   - Python
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense
   - Prettier - Code formatter

### 1.4 Install Git
1. Go to https://git-scm.com
2. Download and install with default settings
3. Verify: `git --version`

---

## Step 2: Set Up Neon DB (Free PostgreSQL)

1. Go to https://neon.tech and create a free account
2. Click "New Project" → name it `content-platform`
3. Select region closest to you
4. After creation, copy your **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb
   ```
5. Keep this safe — you'll need it in Step 7

---

## Step 3: Create Project Folder Structure

Open terminal and run these commands one by one:

```bash
# Create main project folder
mkdir content-platform
cd content-platform

# Create frontend and backend folders
mkdir frontend backend

# You should now have:
# content-platform/
# ├── frontend/
# └── backend/
```

---

# PHASE 2: BACKEND SETUP (Week 1-2)

## Step 4: Set Up Python Backend (FastAPI)

```bash
cd backend

# Create virtual environment (isolates your Python packages)
python -m venv venv

# Activate it (Windows):
venv\Scripts\activate

# Activate it (Mac/Linux):
source venv/bin/activate

# Install required packages
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv alembic
pip install anthropic httpx python-multipart pillow
pip install manim  # For 2D animations
```

### 4.1 Create the file structure inside `/backend`:

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              ← App entry point
│   ├── database.py          ← DB connection
│   ├── models.py            ← Database tables
│   ├── schemas.py           ← Data validation
│   └── routers/
│       ├── __init__.py
│       ├── scripts.py       ← Script Generator API
│       ├── trends.py        ← Trending Topics API
│       ├── thumbnails.py    ← Thumbnail Generator API
│       ├── animations.py    ← 2D Animation API
│       ├── blog.py          ← Blog Generator API
│       └── podcast.py       ← Podcast Script API
├── .env                     ← Secret keys
└── requirements.txt
```

### 4.2 Create `.env` file in `/backend`:
```
DATABASE_URL=postgresql://your_neon_connection_string_here
ANTHROPIC_API_KEY=your_anthropic_key_here
SECRET_KEY=any_random_long_string_here
```

---

## Step 5: Database Setup (database.py)

Create `backend/app/database.py`:

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# This function gives us a DB session for each request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Step 6: Define Database Tables (models.py)

Create `backend/app/models.py`:

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=func.now())

class Script(Base):
    __tablename__ = "scripts"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    script_type = Column(String)     # youtube, short_film, etc.
    content = Column(Text)           # Full script text
    duration = Column(Integer)       # Estimated minutes
    language = Column(String)
    created_at = Column(DateTime, default=func.now())

class BlogPost(Base):
    __tablename__ = "blog_posts"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    content = Column(Text)
    keywords = Column(JSON)          # List of SEO keywords
    word_count = Column(Integer)
    created_at = Column(DateTime, default=func.now())

class PodcastScript(Base):
    __tablename__ = "podcast_scripts"
    id = Column(Integer, primary_key=True)
    episode_name = Column(String)
    episode_number = Column(Integer)
    content = Column(Text)
    format = Column(String)          # solo, interview, co-hosted
    created_at = Column(DateTime, default=func.now())

class SavedTopic(Base):
    __tablename__ = "saved_topics"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    niche = Column(String)
    platform = Column(String)
    trend_score = Column(String)
    search_volume = Column(String)
    created_at = Column(DateTime, default=func.now())

class AnimationProject(Base):
    __tablename__ = "animation_projects"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    animation_type = Column(String)
    status = Column(String, default="pending")   # pending, rendering, done
    output_path = Column(String)
    created_at = Column(DateTime, default=func.now())
```

---

## Step 7: Main App Entry Point (main.py)

Create `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import scripts, trends, thumbnails, animations, blog, podcast

# Create all tables in database
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Content Creation Platform API")

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all feature routers
app.include_router(scripts.router, prefix="/api/scripts", tags=["Scripts"])
app.include_router(trends.router, prefix="/api/trends", tags=["Trends"])
app.include_router(thumbnails.router, prefix="/api/thumbnails", tags=["Thumbnails"])
app.include_router(animations.router, prefix="/api/animations", tags=["Animations"])
app.include_router(blog.router, prefix="/api/blog", tags=["Blog"])
app.include_router(podcast.router, prefix="/api/podcast", tags=["Podcast"])

@app.get("/")
def root():
    return {"message": "Content Platform API is running!"}
```

---

# PHASE 3: BUILD EACH FEATURE BACKEND (Week 2-4)

## Step 8: Script Generator API

Create `backend/app/routers/scripts.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Script
from pydantic import BaseModel
import anthropic
import os

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class ScriptRequest(BaseModel):
    title: str
    script_type: str      # youtube, short_film, promotional, educational, podcast
    target_audience: str
    tone: str             # funny, serious, dramatic
    duration: int         # minutes
    language: str

@router.post("/generate")
def generate_script(request: ScriptRequest, db: Session = Depends(get_db)):
    prompt = f"""
    Write a professional {request.script_type} script with these details:
    - Title: {request.title}
    - Target Audience: {request.target_audience}
    - Tone: {request.tone}
    - Duration: {request.duration} minutes
    - Language: {request.language}
    
    Format the script with:
    SCENE 1:
    [Stage Direction]
    CHARACTER NAME: Dialogue
    
    Include an intro, main content scenes, and outro.
    """
    
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    script_content = message.content[0].text
    
    # Save to database
    db_script = Script(
        title=request.title,
        script_type=request.script_type,
        content=script_content,
        duration=request.duration,
        language=request.language
    )
    db.add(db_script)
    db.commit()
    db.refresh(db_script)
    
    return {"id": db_script.id, "content": script_content}

@router.get("/list")
def get_scripts(db: Session = Depends(get_db)):
    scripts = db.query(Script).order_by(Script.created_at.desc()).all()
    return scripts

@router.delete("/{script_id}")
def delete_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    db.delete(script)
    db.commit()
    return {"message": "Deleted"}
```

---

## Step 9: Trending Topics API

Create `backend/app/routers/trends.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import SavedTopic
from pydantic import BaseModel
import anthropic
import os

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class TrendRequest(BaseModel):
    niche: str
    platform: str

@router.post("/fetch")
def fetch_trends(request: TrendRequest, db: Session = Depends(get_db)):
    # Use Claude to generate realistic trending topics
    prompt = f"""
    Generate 10 currently trending topics for the {request.niche} niche 
    optimized for {request.platform}.
    
    For each topic return JSON format:
    {{
        "title": "Topic Title",
        "trend_score": "Hot/Rising/New",
        "search_volume": "150K/month",
        "competition": "Low/Medium/High",
        "angles": ["Angle 1", "Angle 2", "Angle 3"],
        "why_trending": "Brief reason"
    }}
    
    Return as a JSON array of 10 topics.
    """
    
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}]
    )
    
    import json
    content = message.content[0].text
    # Extract JSON from response
    start = content.find('[')
    end = content.rfind(']') + 1
    topics = json.loads(content[start:end])
    
    return {"topics": topics}

@router.post("/save")
def save_topic(niche: str, platform: str, title: str, trend_score: str,
               db: Session = Depends(get_db)):
    topic = SavedTopic(
        title=title, niche=niche,
        platform=platform, trend_score=trend_score
    )
    db.add(topic)
    db.commit()
    return {"message": "Saved"}

@router.get("/saved")
def get_saved_topics(db: Session = Depends(get_db)):
    return db.query(SavedTopic).all()
```

---

## Step 10: Blog Post Generator API

Create `backend/app/routers/blog.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import BlogPost
from pydantic import BaseModel
from typing import List
import anthropic, os

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class BlogRequest(BaseModel):
    topic: str
    keywords: List[str]
    word_count: int        # 500, 1000, 2000, 3000
    tone: str              # formal, casual, persuasive
    target_audience: str
    structure: str         # how-to, listicle, opinion, case-study, review

@router.post("/outline")
def generate_outline(request: BlogRequest):
    prompt = f"""
    Create a blog post outline for:
    Topic: {request.topic}
    Structure: {request.structure}
    Keywords: {', '.join(request.keywords)}
    
    Return 3 title options (H1), then H2 headings with bullet point key points.
    """
    message = client.messages.create(
        model="claude-opus-4-6", max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )
    return {"outline": message.content[0].text}

@router.post("/generate")
def generate_blog(request: BlogRequest, db: Session = Depends(get_db)):
    prompt = f"""
    Write a complete {request.word_count}-word blog post about: {request.topic}
    Structure: {request.structure}
    Tone: {request.tone}
    Target Audience: {request.target_audience}
    Keywords to include naturally: {', '.join(request.keywords)}
    
    Include:
    - Attention-grabbing introduction
    - Well-structured body with H2 headings
    - Bullet points where relevant
    - Conclusion with clear call-to-action
    
    Also at the end provide:
    META_TITLE: (60 chars max)
    META_DESCRIPTION: (160 chars max)
    """
    message = client.messages.create(
        model="claude-opus-4-6", max_tokens=6000,
        messages=[{"role": "user", "content": prompt}]
    )
    content = message.content[0].text
    
    db_post = BlogPost(
        title=request.topic, content=content,
        keywords=request.keywords, word_count=request.word_count
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    
    return {"id": db_post.id, "content": content}
```

---

## Step 11: Podcast Script Generator API

Create `backend/app/routers/podcast.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PodcastScript
from pydantic import BaseModel
import anthropic, os

router = APIRouter()
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class PodcastRequest(BaseModel):
    podcast_name: str
    episode_number: int
    topic: str
    duration: int          # 15, 30, 45, 60 minutes
    format: str            # solo, interview, co-hosted, storytelling
    tone: str              # educational, conversational, investigative, entertaining

@router.post("/generate")
def generate_podcast(request: PodcastRequest, db: Session = Depends(get_db)):
    word_count = request.duration * 130  # ~130 words per minute speaking pace
    
    prompt = f"""
    Write a complete podcast script for:
    Podcast: {request.podcast_name}
    Episode {request.episode_number}: {request.topic}
    Format: {request.format}
    Tone: {request.tone}
    Target word count: {word_count} words
    
    Structure it as:
    🎙️ INTRO HOOK (30 seconds)
    🎵 [MUSIC CUE]
    👋 HOST INTRODUCTION
    📌 SEGMENT 1 - Main Topic
    📌 SEGMENT 2 - Deep Dive  
    📌 SEGMENT 3 - Tips & Takeaways
    💰 [AD BREAK]
    🎤 OUTRO + CTA
    
    For {request.format} format, label speakers clearly.
    After the script, add SHOW NOTES section with timestamps and summary.
    """
    
    message = client.messages.create(
        model="claude-opus-4-6", max_tokens=8000,
        messages=[{"role": "user", "content": prompt}]
    )
    content = message.content[0].text
    
    db_podcast = PodcastScript(
        episode_name=request.topic,
        episode_number=request.episode_number,
        content=content,
        format=request.format
    )
    db.add(db_podcast)
    db.commit()
    db.refresh(db_podcast)
    
    return {"id": db_podcast.id, "content": content}
```

---

## Step 12: 2D Animation with Manim (No API Key!)

Manim is a free Python library used by 3Blue1Brown to create mathematical animations. You use it by writing Python code that describes your animation.

### How Manim Works:
1. You write a Python class describing scenes
2. Manim renders it into an MP4 video
3. Your backend serves the video to the frontend

### Install Manim:
```bash
pip install manim
# Also install these dependencies:
# Windows: Install MiKTeX (for LaTeX) and FFmpeg
# Download FFmpeg from https://ffmpeg.org and add to PATH
```

Create `backend/app/routers/animations.py`:

```python
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import AnimationProject
from pydantic import BaseModel
import subprocess, os, uuid

router = APIRouter()
ANIMATIONS_DIR = "static/animations"
os.makedirs(ANIMATIONS_DIR, exist_ok=True)

class AnimationRequest(BaseModel):
    title: str
    animation_type: str    # explainer, whiteboard, logo, social_reel
    style: str             # flat, cartoon, whiteboard, motion_graphics
    scenes: list           # List of scene descriptions
    text_color: str = "#FFFFFF"
    background_color: str = "#000000"

def create_manim_script(request: AnimationRequest, output_id: str) -> str:
    """Generates a Manim Python file from the request"""
    
    scenes_code = ""
    for i, scene_desc in enumerate(request.scenes):
        scenes_code += f"""
        # Scene {i+1}: {scene_desc}
        text_{i} = Text("{scene_desc}", color=WHITE).scale(0.8)
        self.play(Write(text_{i}))
        self.wait(2)
        self.play(FadeOut(text_{i}))
        """
    
    if request.style == "whiteboard":
        bg_color = "WHITE"
        text_color = "BLACK"
    else:
        bg_color = "BLACK"
        text_color = "WHITE"
    
    manim_code = f"""
from manim import *

class ContentAnimation_{output_id}(Scene):
    def construct(self):
        self.camera.background_color = {bg_color}
        
        # Title
        title = Text("{request.title}", color={text_color}).scale(1.2)
        self.play(Write(title), run_time=1.5)
        self.wait(1)
        self.play(title.animate.to_edge(UP))
        
        {scenes_code}
        
        # Outro
        outro = Text("Thank You!", color={text_color})
        self.play(Write(outro))
        self.wait(2)
        self.play(FadeOut(outro))
"""
    return manim_code

def render_animation(script_path: str, output_id: str, db: Session, project_id: int):
    """Runs Manim in background to render the video"""
    try:
        result = subprocess.run(
            ["manim", "-qm", script_path, f"ContentAnimation_{output_id}",
             "--output_file", output_id],
            capture_output=True, text=True, timeout=300
        )
        
        # Update database with output path
        output_path = f"media/videos/{output_id}.mp4"
        db.query(AnimationProject).filter(AnimationProject.id == project_id).update({
            "status": "completed",
            "output_path": output_path
        })
        db.commit()
    except Exception as e:
        db.query(AnimationProject).filter(AnimationProject.id == project_id).update({
            "status": "failed"
        })
        db.commit()

@router.post("/create")
def create_animation(request: AnimationRequest, background_tasks: BackgroundTasks,
                     db: Session = Depends(get_db)):
    output_id = str(uuid.uuid4()).replace("-", "")[:12]
    
    # Save project to DB
    project = AnimationProject(
        title=request.title,
        animation_type=request.animation_type,
        status="rendering"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Create Manim script file
    script_content = create_manim_script(request, output_id)
    script_path = f"temp_scripts/{output_id}.py"
    os.makedirs("temp_scripts", exist_ok=True)
    
    with open(script_path, "w") as f:
        f.write(script_content)
    
    # Render in background (takes time!)
    background_tasks.add_task(render_animation, script_path, output_id, db, project.id)
    
    return {"project_id": project.id, "status": "rendering", 
            "message": "Animation is being rendered. Check status endpoint."}

@router.get("/status/{project_id}")
def check_status(project_id: int, db: Session = Depends(get_db)):
    project = db.query(AnimationProject).filter(AnimationProject.id == project_id).first()
    return {"status": project.status, "output_path": project.output_path}
```

### Advanced Manim Animations (add these to your script):

```python
# These are Manim animation examples you can use as templates:

# 1. Text appearing with typewriter effect
text = Text("Hello World")
self.play(Write(text))

# 2. Objects morphing
circle = Circle()
square = Square()
self.play(Transform(circle, square))

# 3. Drawing arrows and diagrams
arrow = Arrow(LEFT, RIGHT)
self.play(GrowArrow(arrow))

# 4. Number line and math
number_line = NumberLine()
self.play(Create(number_line))

# 5. Graphs
axes = Axes(x_range=[0, 5], y_range=[0, 10])
graph = axes.plot(lambda x: x**2)
self.play(Create(axes), Create(graph))
```

---

## Step 13: Thumbnail Generator API

Create `backend/app/routers/thumbnails.py`:

```python
from fastapi import APIRouter, UploadFile, File
from PIL import Image, ImageDraw, ImageFont
import io, base64, os

router = APIRouter()

@router.post("/generate")
async def generate_thumbnail(
    title: str,
    style: str,         # bold_text, minimal, dramatic
    primary_color: str = "#FF0000",
    text_color: str = "#FFFFFF"
):
    # Create 1280x720 image (YouTube size)
    width, height = 1280, 720
    img = Image.new('RGB', (width, height), color=primary_color)
    draw = ImageDraw.Draw(img)
    
    if style == "bold_text":
        # Big centered text
        try:
            font = ImageFont.truetype("arial.ttf", 100)
        except:
            font = ImageFont.load_default()
        
        # Add gradient background
        for y in range(height):
            alpha = int(255 * (1 - y/height * 0.7))
            draw.line([(0, y), (width, y)], fill=primary_color)
        
        # Add text with shadow
        shadow_offset = 5
        draw.text((width//2 + shadow_offset, height//2 + shadow_offset),
                  title, font=font, fill="black", anchor="mm")
        draw.text((width//2, height//2), title, font=font,
                  fill=text_color, anchor="mm")
    
    elif style == "minimal":
        draw.rectangle([0, 0, width, height], fill="#FFFFFF")
        draw.text((width//2, height//2), title, fill="#000000", anchor="mm")
    
    elif style == "dramatic":
        # Dark dramatic style
        draw.rectangle([0, 0, width, height], fill="#0a0a0a")
        # Add red accent bar
        draw.rectangle([0, height-20, width, height], fill="#FF0000")
        draw.text((width//2, height//2), title, fill="#FFFFFF", anchor="mm")
    
    # Convert to base64 to send to frontend
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {"image": f"data:image/png;base64,{img_base64}",
            "dimensions": "1280x720"}

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    contents = await file.read()
    img = Image.open(io.BytesIO(contents))
    
    # Remove background using simple threshold (upgrade later with rembg library)
    img = img.convert("RGBA")
    
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {"image": f"data:image/png;base64,{img_base64}"}
```

---

## Step 14: Run the Backend

```bash
# From /backend folder with venv activated:
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` — you'll see an **interactive API documentation** page where you can test every endpoint!

---

# PHASE 4: FRONTEND SETUP (Week 3-4)

## Step 15: Create React App

```bash
# From /frontend folder:
cd ../frontend
npm create vite@latest . -- --template react
npm install

# Install dependencies
npm install axios react-router-dom tailwindcss @tailwindcss/vite
npm install react-quill react-dropzone react-hot-toast
npm install @headlessui/react lucide-react
```

### Setup Tailwind in `vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

## Step 16: Frontend File Structure

```
frontend/src/
├── App.jsx                    ← Main app with routing
├── main.jsx                   ← Entry point
├── api/
│   └── api.js                 ← All API calls to backend
├── components/
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Card.jsx
│       └── LoadingSpinner.jsx
└── pages/
    ├── Dashboard.jsx
    ├── ScriptGenerator.jsx
    ├── TrendingTopics.jsx
    ├── ThumbnailGenerator.jsx
    ├── AnimationStudio.jsx
    ├── BlogGenerator.jsx
    └── PodcastGenerator.jsx
```

---

## Step 17: API Connection (api.js)

Create `frontend/src/api/api.js`:

```js
import axios from 'axios'

const BASE_URL = 'http://localhost:8000/api'

const api = axios.create({ baseURL: BASE_URL })

// Script APIs
export const generateScript = (data) => api.post('/scripts/generate', data)
export const getScripts = () => api.get('/scripts/list')
export const deleteScript = (id) => api.delete(`/scripts/${id}`)

// Trending Topics APIs
export const fetchTrends = (data) => api.post('/trends/fetch', data)
export const saveTopic = (data) => api.post('/trends/save', data)
export const getSavedTopics = () => api.get('/trends/saved')

// Blog APIs
export const generateOutline = (data) => api.post('/blog/outline', data)
export const generateBlog = (data) => api.post('/blog/generate', data)

// Podcast APIs
export const generatePodcast = (data) => api.post('/podcast/generate', data)

// Thumbnail APIs
export const generateThumbnail = (params) => api.post('/thumbnails/generate', null, { params })

// Animation APIs
export const createAnimation = (data) => api.post('/animations/create', data)
export const checkAnimationStatus = (id) => api.get(`/animations/status/${id}`)
```

---

## Step 18: Main App Routing (App.jsx)

Create `frontend/src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import ScriptGenerator from './pages/ScriptGenerator'
import TrendingTopics from './pages/TrendingTopics'
import ThumbnailGenerator from './pages/ThumbnailGenerator'
import AnimationStudio from './pages/AnimationStudio'
import BlogGenerator from './pages/BlogGenerator'
import PodcastGenerator from './pages/PodcastGenerator'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-950 text-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scripts" element={<ScriptGenerator />} />
            <Route path="/trends" element={<TrendingTopics />} />
            <Route path="/thumbnails" element={<ThumbnailGenerator />} />
            <Route path="/animations" element={<AnimationStudio />} />
            <Route path="/blog" element={<BlogGenerator />} />
            <Route path="/podcast" element={<PodcastGenerator />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
```

---

## Step 19: Sidebar Component

Create `frontend/src/components/Sidebar.jsx`:

```jsx
import { Link, useLocation } from 'react-router-dom'
import { Film, TrendingUp, Image, Play, BookOpen, Mic, LayoutDashboard } from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Film, label: 'Script Generator', path: '/scripts' },
  { icon: TrendingUp, label: 'Trending Topics', path: '/trends' },
  { icon: Image, label: 'Thumbnail Generator', path: '/thumbnails' },
  { icon: Play, label: '2D Animation Studio', path: '/animations' },
  { icon: BookOpen, label: 'Blog Generator', path: '/blog' },
  { icon: Mic, label: 'Podcast Script', path: '/podcast' },
]

export default function Sidebar() {
  const location = useLocation()
  
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-purple-400">ContentAI</h1>
        <p className="text-xs text-gray-500 mt-1">Your Creation Platform</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ icon: Icon, label, path }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${location.pathname === path
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

---

## Step 20: Script Generator Page

Create `frontend/src/pages/ScriptGenerator.jsx`:

```jsx
import { useState } from 'react'
import { generateScript } from '../api/api'
import toast from 'react-hot-toast'

export default function ScriptGenerator() {
  const [form, setForm] = useState({
    title: '', script_type: 'youtube', target_audience: '',
    tone: 'professional', duration: 10, language: 'English'
  })
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await generateScript(form)
      setScript(res.data.content)
      toast.success('Script generated!')
    } catch (err) {
      toast.error('Failed to generate script')
    }
    setLoading(false)
  }

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.title}_script.txt`
    a.click()
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">🎬 Script Generator</h2>
      <p className="text-gray-400 mb-8">Generate professional scripts for any format</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Script Title</label>
            <input
              className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-700 focus:border-purple-500 outline-none"
              placeholder="Enter your video title..."
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Script Type</label>
            <select
              className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-700"
              value={form.script_type}
              onChange={e => setForm({...form, script_type: e.target.value})}
            >
              <option value="youtube">YouTube Video</option>
              <option value="short_film">Short Film</option>
              <option value="promotional">Promotional / Ad</option>
              <option value="educational">Educational</option>
              <option value="podcast">Podcast Episode</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">Target Audience</label>
            <input
              className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-700 focus:border-purple-500 outline-none"
              placeholder="e.g. beginners, professionals, teens..."
              value={form.target_audience}
              onChange={e => setForm({...form, target_audience: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tone</label>
              <select
                className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-700"
                value={form.tone}
                onChange={e => setForm({...form, tone: e.target.value})}
              >
                <option value="funny">Funny</option>
                <option value="serious">Serious</option>
                <option value="dramatic">Dramatic</option>
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Duration (min)</label>
              <select
                className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white border border-gray-700"
                value={form.duration}
                onChange={e => setForm({...form, duration: Number(e.target.value)})}
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={loading || !form.title}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 
                       rounded-xl py-4 font-semibold transition-all"
          >
            {loading ? '⏳ Generating...' : '✨ Generate Script'}
          </button>
        </div>
        
        {/* Output */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-300">Generated Script</h3>
            {script && (
              <button onClick={handleDownload}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg">
                ⬇️ Download
              </button>
            )}
          </div>
          <textarea
            className="w-full h-96 bg-gray-800 rounded-xl p-4 text-gray-300 text-sm 
                       border border-gray-700 resize-none outline-none font-mono"
            value={script}
            onChange={e => setScript(e.target.value)}
            placeholder="Your generated script will appear here..."
          />
        </div>
      </div>
    </div>
  )
}
```

---

## Step 21: Start the Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` — your app is running!

---

# PHASE 5: EXPORT FEATURES (Week 4-5)

## Step 22: Add PDF Export to Backend

```bash
pip install reportlab weasyprint
```

Add to any router:

```python
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from fastapi.responses import FileResponse
import io

@router.post("/export/pdf/{script_id}")
def export_pdf(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    
    filename = f"script_{script_id}.pdf"
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, script.title)
    
    c.setFont("Helvetica", 11)
    y = height - 80
    for line in script.content.split('\n'):
        if y < 50:
            c.showPage()
            y = height - 50
        c.drawString(50, y, line[:95])  # Limit line length
        y -= 15
    
    c.save()
    return FileResponse(filename, media_type='application/pdf',
                       filename=filename)
```

---

# PHASE 6: DEPLOYMENT (Week 6)

## Step 23: Deploy Backend (Railway)

1. Go to https://railway.app — create account
2. New Project → Deploy from GitHub
3. Connect your repo
4. Add environment variables (DATABASE_URL, ANTHROPIC_API_KEY)
5. Railway auto-detects Python and deploys

## Step 24: Deploy Frontend (Vercel)

1. Go to https://vercel.com — create account
2. Import your GitHub repo
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `VITE_API_URL=your_railway_backend_url`

Update `api.js`:
```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
```

---

# LEARNING RESOURCES

## Free Resources to Learn As You Build:

| Topic | Resource |
|-------|----------|
| React Basics | https://react.dev/learn |
| FastAPI | https://fastapi.tiangolo.com/tutorial |
| SQLAlchemy (DB) | https://docs.sqlalchemy.org |
| Manim | https://docs.manim.community |
| Tailwind CSS | https://tailwindcss.com/docs |
| PostgreSQL Basics | https://neon.tech/docs |

---

# BUILD ORDER TIMELINE

| Week | What to Build |
|------|--------------|
| Week 1 | Setup all tools, Neon DB, backend structure |
| Week 2 | Script Generator + Blog Generator (backend + frontend) |
| Week 3 | Podcast + Trending Topics (backend + frontend) |
| Week 4 | Thumbnail Generator + basic Manim animation |
| Week 5 | Export features (PDF, TXT) + polish UI |
| Week 6 | Deploy to Railway + Vercel |

---

# IMPORTANT TIPS FOR BEGINNERS

1. **Build one feature at a time** — don't try to build everything at once
2. **Test each API endpoint** at `localhost:8000/docs` before building frontend
3. **Use `print()` statements** when debugging Python
4. **Use `console.log()`** when debugging React
5. **Commit to Git often**: `git add . && git commit -m "your message"`
6. **The Manim rendering takes time** — always show a loading spinner in UI
7. **For Anthropic API key**: get one free at https://console.anthropic.com

---

*You now have everything you need to build this complete platform from scratch!*
