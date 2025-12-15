# LinkedIn AutoMarketer AI

## Project Overview

LinkedIn AutoMarketer AI is an advanced automation tool designed to streamline your LinkedIn marketing efforts. This application combines AI-powered content generation with intelligent scheduling to maximize your reach and engagement on the platform.

## Features

- **AI-Powered Content Generation**: Create engaging LinkedIn posts tailored to your audience using multiple free AI models (OpenRouter, Together AI, or Hugging Face)
- **Smart Scheduling**: Automatically post content at optimal times for maximum engagement
- **Analytics Dashboard**: Track performance metrics and gain insights into your content strategy
- **Responsive Design**: Works seamlessly across all devices

## Prerequisites

Before you begin, ensure you have the following installed:
- Python 3.8 or higher
- MongoDB
- Redis
- LinkedIn Developer Account

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-linkedin-accelerator-main
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Navigate to the backend directory and set up the Python environment:
   ```bash
   cd ../backend
   python -m venv venv
   ```

4. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

5. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

6. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

7. Configure environment variables in the `.env` file:
   - MongoDB connection string
   - Redis connection string
   - LinkedIn OAuth credentials
   - AI API key (OpenRouter, Together AI, or Hugging Face for AI models, or none for free sample posts)
   - JWT secret (generate a secure random string)
   - Encryption key (minimum 32 characters)

## Running the Application

### Development Mode

```bash
# In the frontend directory, start the frontend
cd frontend
npm run dev

# In a separate terminal, navigate to backend and start the FastAPI server
cd ../backend
python main.py

# Or use the provided start scripts:
# On Windows: start-fastapi.bat
# On macOS/Linux: ./start-fastapi.sh
```

### Production Mode

#### Option 1: Manual Deployment

```bash
# Build the frontend
cd frontend
npm run build

# In the backend directory, start the FastAPI server with production settings
cd ../backend
./start-production.sh  # On Linux/macOS
# or
start-production.bat    # On Windows
```

#### Option 2: Docker Deployment (Recommended)

```bash
# Build and start all services with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The Docker deployment will automatically:
- Start MongoDB and Redis containers
- Build and deploy the backend service
- Build and deploy the frontend service
- Set up proper networking between services
- Configure security headers and reverse proxy

**Important**: Before deploying to production, make sure to:
1. Update the `.env` file with secure secrets
2. Change the default MongoDB credentials
3. Configure your domain and SSL certificates
4. Review and adjust resource limits as needed

## Configuration

### AI Content Generation

The application supports multiple free AI models for content generation with the following priority:

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

### LinkedIn Integration

1. Create a LinkedIn App in the [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Configure the OAuth redirect URLs to match your deployment
3. Add your LinkedIn Client ID and Secret to the `.env` file
4. Use the CLI tool (`cli.py`) to authenticate with LinkedIn and get your access token and member URN
5. Add the `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_MEMBER_URN` to your `.env` file

Alternatively, you can connect your LinkedIn account through the web interface:

1. Navigate to the Settings page in the web app
2. Click "Connect LinkedIn" to start the OAuth flow
3. After authentication, your credentials will be stored securely

## Usage

1. Start the application using the instructions above
2. Navigate to the frontend URL (typically http://localhost:8080)
3. Connect your LinkedIn account through the settings page
4. Use the AI Content Generator to create posts
5. Schedule posts using the scheduling feature
6. Monitor performance through the analytics dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.