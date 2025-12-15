# LinkedIn AutoMarketer AI - Backend

## Overview

This is the backend service for the LinkedIn AutoMarketer AI application. It provides RESTful APIs for content generation, scheduling, and LinkedIn integration.

## Features

- **AI Content Generation Service**: Generates LinkedIn posts using multiple free AI models (OpenRouter, Together AI, or Hugging Face)
- **Scheduling Engine**: Manages post scheduling and automated publishing
- **LinkedIn Integration**: Handles OAuth authentication and API interactions
- **Database Management**: MongoDB integration for storing posts and user data
- **Background Processing**: Redis-based queue system for handling scheduled tasks

## Prerequisites

- Python 3.8 or higher
- MongoDB
- Redis

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

6. Configure environment variables in the `.env` file

## Configuration

### AI Content Generation

The backend supports multiple free AI models for content generation with the following priority:

#### Option 1: OpenRouter (Unified API with Free Credits)
1. Sign up at [OpenRouter](https://openrouter.ai/) for an API key
2. Get free credits for various models including Mistral, Gemma, and others
3. Add your API key to the `.env` file as `OPENROUTER_API_KEY`
4. The system will automatically try multiple free models until one works

#### Option 2: Together AI (Free Tier)
1. Sign up at [Together AI](https://api.together.xyz/) for an API key
2. Get $25 free credits for new users
3. Add your API key to the `.env` file as `TOGETHER_API_KEY`
4. The system will automatically try Llama 3 70B, then Llama 3 8B, then Mixtral as fallbacks

#### Option 3: Hugging Face (Free Tier)
1. Sign up at [Hugging Face](https://huggingface.co/) for an API key
2. Add your API key to the `.env` file as `HUGGING_FACE_API_KEY`
3. Note: Many models have deprecated their public inference API

#### Option 4: Free Sample Posts (No API Key Required)
If no API key is provided, the application will generate sample posts automatically.

### Database Configuration

Configure your MongoDB connection string in the `.env` file:
- For local MongoDB: `mongodb://localhost:27017/linkedin-auto-marketer`
- For MongoDB Atlas: Use your cluster connection string

### Redis Configuration

Configure your Redis connection string in the `.env` file:
- For local Redis: `redis://localhost:6379`
- For cloud Redis: Use your provider's connection string

### LinkedIn Integration

1. Create a LinkedIn App in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Configure the OAuth redirect URLs to match your deployment
3. Add your LinkedIn Client ID and Secret to the `.env` file

## Running the Application

### Development Mode

```bash
# Start the FastAPI server
python main.py

# Or use the provided start scripts:
# On Windows: start-fastapi.bat
# On macOS/Linux: ./start-fastapi.sh
```

### Production Mode

```bash
# Start the FastAPI server with uvicorn
uvicorn main:app --host 0.0.0.0 --port 3001
```

## API Endpoints

### Content Generation
- `POST /api/content/generate` - Generate LinkedIn posts based on provided parameters

### Scheduling
- `GET /api/schedule` - Get all scheduled posts
- `POST /api/schedule` - Create a new scheduled post
- `PUT /api/schedule/:id` - Update a scheduled post
- `DELETE /api/schedule/:id` - Delete a scheduled post
- `PUT /api/schedule/:id/content` - Update content of a scheduled post

### LinkedIn Integration
- `GET /api/linkedin/auth` - Initiate LinkedIn OAuth flow
- `GET /api/linkedin/callback` - Handle LinkedIn OAuth callback
- `GET /api/linkedin/profile` - Get LinkedIn profile information
- `POST /api/linkedin/post` - Publish a post to LinkedIn

## Architecture

The backend follows a modular architecture with the following components:

- **Main Application**: FastAPI application with route definitions
- **Services**: Implement business logic for AI content generation and LinkedIn integration
- **Models**: Define data schemas and database interactions
- **Utils**: Helper functions for file handling and other utilities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.