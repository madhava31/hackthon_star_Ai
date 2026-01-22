# 📑 PDF Insight - AI-Powered Document Q&A & Quiz Platform

A modern, full-stack web application that enables intelligent document interaction through AI-powered chat and automated quiz generation using RAG (Retrieval-Augmented Generation). Features an industry-ready, responsive UI with a landing page experience.

## ✨ Features

### Core Functionality
- **📤 Smart PDF Upload**: Drag-and-drop or click-to-browse file upload with visual feedback
- **💬 AI Chatbot**: Ask questions about your documents and get intelligent, context-aware answers
- **🎯 Auto Quiz Generation**: Generate 10 multiple-choice questions from your PDF with explanations
- **📊 Performance Analytics**: Track quiz performance with topic-wise insights and weakness detection
- **💡 Learning Insights**: Get detailed explanations for incorrect answers and personalized recommendations

### Modern UI/UX
- **🎨 Industry-Ready Design**: Professional dark theme with modern typography and spacing
- **🖼️ Full-Page Hero Section**: Showcase features and benefits before uploading
- **🎭 Smooth Scroll Navigation**: Seamless transition from landing to upload section
- **✨ Interactive Components**: Hover effects, animations, and visual feedback
- **📱 Responsive Layout**: Clean, spacious design optimized for all screen sizes
- **🎨 Beautiful File Upload**: Modern drag-and-drop zone with instant visual feedback

## 🏗️ Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **LangChain**: Framework for building LLM applications
- **HuggingFace**: Embeddings and LLM inference (Mistral-7B)
- **FAISS**: Vector database for semantic search
- **Sentence Transformers**: For document embeddings (all-MiniLM-L6-v2)

### Frontend
- **Next.js 16**: React framework with Turbopack
- **TypeScript**: Type-safe JavaScript
- **CSS Modules**: Component-scoped styling with modern dark theme
- **React Hooks**: State management and side effects

## 📋 Prerequisites

- **Python 3.11** or higher
- **Node.js 18** or higher
- **npm** or **yarn**
- **HuggingFace API Token** (for LLM access)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd PDF_Insight_Using_RAG
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv311

# Activate virtual environment
# On Windows:
.\venv311\Scripts\activate
# On macOS/Linux:
source venv311/bin/activate

# Install dependencies
pip install -r req.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
HUGGINGFACE_TOKEN_API="your_huggingface_api_token_here"
```

**Get your HuggingFace API token:**
1. Sign up at [HuggingFace](https://huggingface.co/)
2. Go to Settings → Access Tokens
3. Create a new token
4. Copy and paste it in the `.env` file

### 4. Frontend Setup

```bash
cd ../fornt  # Note: folder name is 'fornt'

# Install dependencies
npm install
```

### 5. Run the Application

**Start Backend (Terminal 1):**
```bash
cd backend
.\venv311\Scripts\python.exe -m uvicorn app:app --host 127.0.0.1 --port 8001
```

**Start Frontend (Terminal 2):**
```bash
cd fornt  # Note: folder name is 'fornt'
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 🎯 User Experience Flow

### Landing Page
1. **Hero Section**: See the full-page introduction with:
   - Industry-ready RAG solution badge
   - Large, compelling headline
   - Core features grid (Auto Quiz, Natural Conversations, Knowledge Analytics, Weakness Detection)
   - Proven metrics (3x Faster Review, 98% Coverage, Zero Setup)
   - Technology stack showcase (FastAPI, LangChain, HuggingFace, FAISS)

2. **Call-to-Action**: Click "Start Free Now" to smoothly scroll to upload section

### Upload Section (Second Page)
1. **Why PDF Insight?**: Learn about the platform's benefits:
   - Lightning-fast document processing with vector embeddings
   - Context-aware answers powered by LangChain & HuggingFace
   - Track your learning progress with detailed analytics
   - Generate unlimited quizzes tailored to your document
   - Identify knowledge gaps and get targeted recommendations

2. **Smart File Upload**:
   - **Drag and Drop**: Drag PDF files directly into the drop zone
   - **Click to Browse**: Click the zone to open file picker
   - **Visual Feedback**: See file icon, name, and size instantly
   - **Max 25 MB**: Support for documents up to 25 MB

### After Upload

#### Chat Mode
1. Modern, spacious card layout with clean design
2. Type questions in the bottom input field
3. See AI responses in conversation bubbles
4. User messages appear in blue, AI responses in gray
5. Click card to expand to fullscreen mode

#### Quiz Mode
1. Auto-generated questions with topic categorization
2. Clean, readable question cards with rounded corners
3. Four options per question with hover effects
4. Color-coded feedback (blue=selected, green=correct, red=incorrect)
5. Submit to see:
   - **Overall Score**: Large percentage display with message
   - **Areas to Improve**: Visual breakdown by topic with:
     - Difficulty badges (Critical/High/Medium)
     - Progress bars showing error percentage
     - Personalized recommendations
   - **Learn from Mistakes**: Detailed explanations for wrong answers

## 🔧 Configuration

### Backend Configuration

Edit `backend/rag.py` to customize:
- **Embedding Model**: Change `model_name` in `HuggingFaceEmbeddings`
- **LLM Model**: Change `repo_id` in `HuggingFaceEndpoint`
- **Chunk Size**: Modify `chunk_size` and `chunk_overlap` in `RecursiveCharacterTextSplitter`
- **Temperature**: Adjust `temperature` for response creativity

### Frontend Configuration

Edit `fornt/app/page.tsx` to customize:
- **API Endpoint**: Change `API_BASE` constant (default: `http://127.0.0.1:8001`)
- **Styling**: Modify CSS in `page.module.css`

## 🎨 UI Design Features

### Modern Dark Theme
- **Color Palette**: 
  - Primary Background: #0f172a to #1e293b gradients
  - Accent Blue: #3b82f6 to #2563eb
  - Success Green: #86efac
  - Alert Red: #ef4444
  - Text: #e2e8f0 (bright) and #cbd5e1 (muted)

### Typography
- **Headings**: 42px hero title with 900 weight
- **Body**: 15-16px for optimal readability
- **Spacing**: Generous padding (32-48px) for modern feel

### Interactive Elements
- **Hover Effects**: Smooth transitions on all interactive components
- **Animations**: Float, slide-up, and message slide-in animations
- **Loading States**: Spinner for async operations
- **Visual Feedback**: Color changes, shadows, and transforms

### Components
- **Hero Section**: Full viewport height with centered content
- **Feature Cards**: Modern cards with backdrop blur and subtle borders
- **Drag-and-Drop Upload**: Visual feedback with icons and file info
- **Chat Bubbles**: Rounded corners with proper alignment
- **Quiz Options**: Clean design with color-coded states
- **Metrics Display**: Large numbers with descriptions
- **Progress Bars**: Animated bars showing performance

## 📁 Project Structure

```
PDF_Insight_Using_RAG/
├── backend/
│   ├── app.py              # FastAPI application with routes
│   ├── rag.py              # RAG implementation (chat & quiz)
│   ├── req.txt             # Python dependencies
│   ├── .env                # Environment variables (create this)
│   └── venv311/            # Python virtual environment
│
├── fornt/                  # Frontend directory
│   ├── app/
│   │   ├── page.tsx        # Main application component with hero & upload
│   │   ├── page.module.css # Modern dark theme styles
│   │   ├── layout.tsx      # App layout with metadata
│   │   └── globals.css     # Global styles and animations
│   ├── package.json        # Node dependencies
│   └── next.config.ts      # Next.js configuration
│
├── render.yaml             # Deployment configuration
└── README.md               # This file
```

## 🔍 API Endpoints

### POST `/upload-pdf`
Upload a PDF file for processing
- **Body**: `multipart/form-data` with `file` field
- **Response**: `{"status": "PDF uploaded and indexed"}`

### POST `/ask`
Ask a question about the uploaded PDF
- **Body**: `{"question": "your question here"}`
- **Response**: `{"answer": "AI-generated answer"}`

### GET `/generate-quiz`
Generate a quiz from the uploaded PDF
- **Response**: `{"quiz": [array of 10 questions]}`

### POST `/submit-quiz`
Submit quiz answers for grading
- **Body**: `{"answers": [0, 2, 1, 3, ...]}`
- **Response**: `{"score": 8, "total": 10, "quiz": [...]}`

## 🎯 Features in Detail

### Landing Page Experience
- **Full-Page Hero**: Viewport-height introduction section
- **Smooth Scrolling**: Native scroll behavior to upload section
- **Value Proposition**: Clear messaging about features and benefits
- **Social Proof**: Display metrics (3x faster, 98% coverage)
- **Technology Badge**: Show tech stack credibility

### RAG (Retrieval-Augmented Generation)
- Uses **FAISS** for efficient similarity search
- **Sentence Transformers** create document embeddings
- **Semantic retrieval** finds relevant context for questions
- **Context-aware responses** using retrieved passages
- **Fallback mechanism** when LLM is unavailable

### Smart File Upload
- **Drag-and-Drop Interface**: Drop files directly into upload zone
- **Click to Browse**: Traditional file picker as alternative
- **Visual States**: 
  - Default: Blue border with upload icon
  - Drag Over: Highlighted border and background
  - File Selected: Green theme with checkmark and file info
- **File Validation**: Check file type and size (max 25 MB)
- **Instant Feedback**: Show filename and file size immediately

### Quiz Generation
- Automatically extracts key concepts from documents
- Generates 10 realistic multiple-choice questions
- 4 options per question with 1 correct answer
- **Topic Categorization**: Groups questions by subject
- **Difficulty Analysis**: Identifies critical, high, and medium priority areas
- **Performance Tracking**: Shows wrong/total per topic
- **Personalized Recommendations**: Suggests study focus areas
- **Detailed Explanations**: Provides learning context for wrong answers
- **Fallback mode** using document text when LLM fails

### Chatbot
- **Modern Layout**: Spacious cards with clean design
- **Fullscreen Mode**: Expandable chat interface
- Context-aware responses based on document content
- Conversation history tracking with message bubbles
- **Visual Design**: 
  - User messages: Blue gradient bubbles (right-aligned)
  - AI responses: Gray subtle bubbles (left-aligned)
- **Empty States**: Helpful prompts when no messages
- **Fallback** to document retrieval when LLM unavailable
- Answers only from document content (no hallucination)

### Weakness Detection & Learning
- **Areas to Improve Section**: Visual breakdown after quiz
- **Progress Bars**: Animated bars showing error percentage
- **Difficulty Badges**: Color-coded (red/orange/yellow) priority levels
- **Recommendations**: Specific study suggestions per topic
- **Explanation System**: Detailed answers for incorrect questions
- **Comparison View**: Shows your answer vs correct answer side-by-side

## 🐛 Troubleshooting

### Backend won't start
- Ensure virtual environment is activated
- Check Python version: `python --version` (must be 3.11+)
- Verify all dependencies: `pip install -r req.txt`
- Check `.env` file exists with valid HuggingFace token

### Frontend won't start
- Check Node.js version: `node --version` (must be 18+)
- Make sure you're in the `fornt` directory (not `frontend`)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

### "Failed to fetch" error
- Ensure backend is running on port 8001
- Check `API_BASE` in `fornt/app/page.tsx` matches backend URL
- Verify CORS is enabled in backend (already configured)

### File upload not working
- Check file size (must be under 25 MB)
- Ensure file is a valid PDF
- Try drag-and-drop if click-to-browse doesn't work
- Check browser console for errors
- Verify backend is running and accessible

### Quiz not generating
- Wait a few seconds for processing
- Check backend logs for errors
- Fallback quiz will be used if LLM fails
- Ensure PDF has sufficient text content

### Chatbot returning "LLM unavailable"
- Verify HuggingFace token is valid
- Check internet connection
- Fallback retrieval mode will be used automatically
- Check backend logs for detailed error messages

## 🚀 Deployment

### Deploy to Render

1. Push code to GitHub
2. Connect Render to your repository
3. Use `render.yaml` for configuration
4. Set environment variable: `HUGGINGFACE_TOKEN_API`
5. Deploy!

### Environment Variables for Production
```env
HUGGINGFACE_TOKEN_API=your_token_here
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **LangChain** for the RAG framework
- **HuggingFace** for embeddings and LLM access (Mistral-7B)
- **FastAPI** for the backend framework
- **Next.js** for the frontend framework with Turbopack
- **FAISS** for vector similarity search
- **Sentence Transformers** for document embeddings

## 🌟 Key Highlights

- **Industry-Ready UI**: Professional design that looks production-ready
- **Modern UX Patterns**: Landing page, scroll-to-action, drag-and-drop
- **Educational Focus**: Not just answers, but learning with explanations
- **Performance Analytics**: Track and improve your knowledge
- **Responsive Design**: Works beautifully on all screen sizes
- **Fast & Efficient**: Turbopack for lightning-fast dev experience
- **Type-Safe**: Full TypeScript implementation on frontend

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section above

---

**Built with ❤️ using RAG technology**
