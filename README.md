# Study Sphere 🎓

**Study Sphere** is a next-generation academic resource discovery platform designed to solve the "exam week chaos." Exam week arrives, and suddenly everyone needs the same things: notes, PPTs, textbooks, past papers, and quick explanations. But these resources are scattered everywhere. 

Study Sphere brings everything into one unified, AI-powered platform. Built for the MVGR Hackathon.

## 🚀 Key Features

*   **🔍 AI Discovery Engine:** Stop searching Google blindly. Our engine queries 6+ academic sources in parallel (arXiv, OpenAlex, OpenStax, YouTube, SearXNG) to find high-quality, verified academic resources instantly.
*   **🧠 Unified Study Bot:** A single, intelligent chatbot interface.
    *   **Chat & Learn:** Ask questions and get instant AI explanations.
    *   **Generate Quizzes:** Turn any conversation topic into a 5-question MCQ test with scoring and feedback.
    *   **Make Flashcards:** Instantly generate tap-to-flip flashcards from your chat context for active recall.
*   **🎯 Exam Mode (Perplexity-Style Analysis):**
    *   Paste your course syllabus.
    *   AI extracts key topics and ranks them by exam importance (HIGH / MEDIUM / LOW).
    *   Instantly fetches real Previous Year Question (PYQ) links for each topic.
    *   Expand any topic for an AI explanation or tap "Deep AI Explanation" for a comprehensive breakdown with formulas, examples, and citations.
*   **📚 Local Resource Bank:** Upload and share notes and PPTs with your college. Features an admin review system to ensure quality.
*   **🔖 Bookmarks & WhatsApp Sharing:** Save resources to your profile for exam week, or share them instantly with study groups via WhatsApp.

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Framer Motion
*   **Backend & Database:** Supabase (Auth, Postgres, Realtime, Storage)
*   **AI Models:** Groq / Gemini for fast, accurate generation (Explanations, Quizzes, Flashcards)
*   **Search Infrastructure:** SearXNG, DuckDuckGo APIs, YouTube Data API

## 💻 Getting Started

### Prerequisites

*   Node.js & npm (or Bun)
*   A Supabase project (for authentication and database)
*   A Groq or Google Gemini API key
*   *(Optional)* YouTube Data API key for video search

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/srinu-hackathon/mvgr-hackathon.git
    cd mvgr-hackathon
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory (do not commit this file) and configure your keys:
    ```env
    # Supabase (Required)
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

    # AI Models (Required)
    VITE_GROQ_API_KEY=your_groq_api_key
    # OR
    VITE_GEMINI_API_KEY=your_gemini_api_key

    # External APIs (Optional)
    VITE_YOUTUBE_API_KEY=your_youtube_api_key
    ```

4.  **Database Setup**
    Execute the SQL located in `supabase/schema.sql` in your Supabase SQL Editor to set up the requires tables (users, resources, etc.).

5.  **Run the development server**
    ```bash
    npm run dev
    # or
    bun dev
    ```

## 🏆 Hackathon Details

Built by the MVGR College team. The platform is designed to be highly demoable, featuring a premium white and blue aesthetic, smooth Framer Motion animations, and instant AI utility that directly addresses student pain points during exam preparation.
