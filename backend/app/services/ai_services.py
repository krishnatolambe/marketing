import random
from typing import Dict, Any, List
import asyncio
import os
import aiohttp

# Import logging
from ..logging_config import get_logger

logger = get_logger(__name__)

# Llama imports (optional - for local inference)
try:
    from transformers import AutoTokenizer, AutoModelForCausalLM
    import torch
    LLAMA_LOCAL_AVAILABLE = True
except ImportError:
    LLAMA_LOCAL_AVAILABLE = False
    logger.warning("Local Llama dependencies not installed. Will use API-based approach if available.")

# Global variables for Llama model (loaded once)
llama_tokenizer = None
llama_model = None
llama_loaded = False

# API keys from environment variables
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
together_api_key = os.getenv("TOGETHER_API_KEY")
hugging_face_api_key = os.getenv("HUGGING_FACE_API_KEY")

async def initialize_llama_model():
    """
    Initialize the Llama model (run once at startup)
    """
    global llama_tokenizer, llama_model, llama_loaded
    
    # Always skip model loading for testing purposes
    logger.info("Skipping Llama model loading for testing")
    return False


async def generate_linkedin_post_with_llama(topic: str, tone: str = "professional", audience: str = None) -> str:
    """
    Generate LinkedIn post content using Llama model (either API or local).
    
    Args:
        topic: Topic for the post
        tone: Tone of the post (professional, casual, inspirational, etc.)
        audience: Target audience for the post
    
    Returns:
        Generated post content as string
    """
    
    global openrouter_api_key, together_api_key, hugging_face_api_key, llama_loaded
    
    # Try OpenRouter API first if API key is available
    if openrouter_api_key:
        try:
            # Add timeout for API-based generation
            return await asyncio.wait_for(_generate_with_openrouter(topic, tone, audience), timeout=30.0)
        except asyncio.TimeoutError:
            logger.warning("OpenRouter API generation timed out")
        except Exception as e:
            logger.error(f"OpenRouter API generation failed: {e}")
    
    # Try Together AI API if API key is available
    if together_api_key:
        try:
            # Add timeout for API-based generation
            return await asyncio.wait_for(_generate_with_together_ai(topic, tone, audience), timeout=30.0)
        except asyncio.TimeoutError:
            logger.warning("Together AI API generation timed out")
        except Exception as e:
            logger.error(f"Together AI API generation failed: {e}")
    
    # Try Hugging Face API if API key is available
    if hugging_face_api_key:
        try:
            # Add timeout for API-based generation
            return await asyncio.wait_for(_generate_with_hugging_face(topic, tone, audience), timeout=30.0)
        except asyncio.TimeoutError:
            logger.warning("Hugging Face API generation timed out")
        except Exception as e:
            logger.error(f"Hugging Face API generation failed: {e}")
    
    # Try local model if available
    if LLAMA_LOCAL_AVAILABLE and llama_loaded:
        try:
            # Add timeout for local model generation
            return await asyncio.wait_for(_generate_with_local_model(topic, tone, audience), timeout=20.0)
        except asyncio.TimeoutError:
            logger.warning("Local model generation timed out")
        except Exception as e:
            logger.error(f"Local model generation failed: {e}")
    
    # Fallback to sample posts
    return _get_sample_post(topic, tone, audience)


async def _generate_with_openrouter(topic: str, tone: str, audience: str = None) -> str:
    """
    Generate content using OpenRouter API.
    """
    global openrouter_api_key
    
    # Create prompt
    prompt = _create_llama_prompt(topic, tone, audience)
    
    # OpenRouter API endpoint
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "HTTP-Referer": "http://localhost:8080",  # Optional, for including your app on openrouter.ai rankings
        "X-Title": "LinkedIn AutoMarketer AI",  # Optional, shown in rankings
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "mistralai/mistral-7b-instruct:free",  # Using free model
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                generated_text = result['choices'][0]['message']['content']
                # Clean up the post content
                return _clean_generated_post(generated_text)
            else:
                logger.error(f"OpenRouter API error: {response.status}")
                raise Exception(f"OpenRouter API error: {response.status}")


async def _generate_with_together_ai(topic: str, tone: str, audience: str = None) -> str:
    """
    Generate content using Together AI API.
    """
    global together_api_key
    
    # Create prompt
    prompt = _create_llama_prompt(topic, tone, audience)
    
    # Together AI API endpoint
    url = "https://api.together.xyz/inference"
    
    headers = {
        "Authorization": f"Bearer {together_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "mistralai/Mixtral-8x7B-Instruct-v0.1",  # Using Mixtral model
        "prompt": prompt,
        "temperature": 0.7,
        "max_tokens": 500,
        "top_p": 0.7,
        "top_k": 50,
        "repetition_penalty": 1
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                generated_text = result['output']['choices'][0]['text']
                # Clean up the post content
                return _clean_generated_post(generated_text)
            else:
                logger.error(f"Together AI API error: {response.status}")
                raise Exception(f"Together AI API error: {response.status}")


async def _generate_with_hugging_face(topic: str, tone: str, audience: str = None) -> str:
    """
    Generate content using Hugging Face API.
    """
    global hugging_face_api_key
    
    # Create prompt
    prompt = _create_llama_prompt(topic, tone, audience)
    
    # Hugging Face API endpoint for a popular model
    model = "mistralai/Mistral-7B-v0.1"
    url = f"https://api-inference.huggingface.co/models/{model}"
    
    headers = {
        "Authorization": f"Bearer {hugging_face_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "inputs": prompt,
        "parameters": {
            "temperature": 0.7,
            "max_new_tokens": 500,
            "return_full_text": False
        }
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, headers=headers, json=data) as response:
            if response.status == 200:
                result = await response.json()
                generated_text = result[0]['generated_text']
                # Clean up the post content
                return _clean_generated_post(generated_text)
            else:
                logger.error(f"Hugging Face API error: {response.status}")
                raise Exception(f"Hugging Face API error: {response.status}")


async def _generate_with_local_model(topic: str, tone: str, audience: str = None) -> str:
    """
    Generate content using local Llama model.
    """
    global llama_tokenizer, llama_model
    
    # Create prompt for Llama model
    prompt = _create_llama_prompt(topic, tone, audience)
    
    # Tokenize input
    inputs = llama_tokenizer.encode(prompt, return_tensors="pt")
    
    # Move inputs to GPU if available
    if torch.cuda.is_available():
        inputs = inputs.to("cuda")
    
    # Generate text with optimized parameters for speed
    with torch.no_grad():
        outputs = llama_model.generate(
            inputs,
            max_length=200,  # Reduced length for faster generation
            num_return_sequences=1,
            temperature=0.7,
            do_sample=True,
            pad_token_id=llama_tokenizer.eos_token_id,
            max_time=10.0  # Limit generation time to 10 seconds
        )
    
    # Decode generated text
    generated_text = llama_tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract just the post content (remove the prompt)
    post_content = generated_text[len(prompt):].strip()
    
    # Ensure we have a reasonable length post
    if len(post_content) < 50:
        return _get_sample_post(topic, tone, audience)
    
    # Clean up the post content
    post_content = _clean_generated_post(post_content)
    
    return post_content


def _create_llama_prompt(topic: str, tone: str, audience: str = None) -> str:
    """
    Create a prompt for the Llama model to generate a LinkedIn post in proper format.
    
    Args:
        topic: Topic for the post
        tone: Tone of the post
        audience: Target audience
        
    Returns:
        Formatted prompt string
    """
    tone_descriptions = {
        "professional": "a professional tone suitable for business networking",
        "casual": "a friendly, conversational tone",
        "inspirational": "an uplifting and motivational tone",
        "educational": "an informative and educational tone"
    }
    
    audience_text = f" for {audience}" if audience else ""
    tone_text = tone_descriptions.get(tone, tone_descriptions["professional"])
    
    prompt = f"""Write a LinkedIn post{audience_text} in {tone_text} about "{topic}".

Format the post with the following structure:
1. An engaging opening line with an emoji
2. 2-3 paragraphs of valuable content with clear line breaks between paragraphs
3. A thought-provoking question to encourage engagement
4. 3-5 relevant hashtags at the end

Guidelines:
- Use clear paragraph breaks (double newlines) for readability
- Include emojis sparingly for visual appeal
- Make it actionable and valuable for professionals
- End with a question that invites comments
- Use 3-5 relevant hashtags

Example format:
🚀 Opening line about the topic

Main content paragraph 1 explaining the value...

Main content paragraph 2 with examples or insights...

Thought-provoking question to encourage discussion?

#Hashtag1 #Hashtag2 #Hashtag3

Post:"""
    
    return prompt


def _clean_generated_post(post_content: str) -> str:
    """
    Clean up the generated post content to ensure proper LinkedIn formatting.
    
    Args:
        post_content: Raw generated content
        
    Returns:
        Cleaned post content in proper LinkedIn format
    """
    # Split into lines and clean whitespace
    lines = post_content.split('\n')
    cleaned_lines = []
    
    # Process lines to ensure proper spacing and formatting
    for i, line in enumerate(lines):
        stripped_line = line.strip()
        if stripped_line:
            # Add line with proper formatting
            cleaned_lines.append(stripped_line)
        elif cleaned_lines and i < len(lines) - 1:
            # Only add empty lines if not at the beginning or end
            # And avoid multiple consecutive empty lines
            if cleaned_lines[-1] != '':
                cleaned_lines.append('')
    
    # Join lines with proper paragraph spacing
    cleaned_content = '\n'.join(cleaned_lines)
    
    # Ensure we have proper line breaks for readability
    # Replace multiple newlines with double newlines for paragraph separation
    import re
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)
    
    # Limit to reasonable length for LinkedIn (1300 characters is optimal)
    if len(cleaned_content) > 1300:
        # Find a good breaking point
        last_period = cleaned_content.rfind('.', 1000, 1300)
        if last_period != -1:
            cleaned_content = cleaned_content[:last_period + 1]
        else:
            # Fallback to hard cut-off with ellipsis
            cleaned_content = cleaned_content[:1297] + '...'
    
    # Ensure hashtags are properly formatted at the end
    if '#' in cleaned_content:
        # Move all hashtags to the end if they're scattered
        content_parts = cleaned_content.split('\n\n')
        hashtags = []
        main_content = []
        
        for part in content_parts:
            if part.strip().startswith('#'):
                hashtags.extend(part.strip().split())
            elif '#' in part:
                # Extract hashtags from within content
                words = part.split()
                clean_words = []
                for word in words:
                    if word.startswith('#'):
                        hashtags.append(word)
                    else:
                        clean_words.append(word)
                if clean_words:
                    main_content.append(' '.join(clean_words))
            else:
                main_content.append(part)
        
        # Reconstruct with hashtags at the end
        if hashtags:
            hashtag_string = ' '.join(list(dict.fromkeys(hashtags)))  # Remove duplicates
            cleaned_content = '\n\n'.join(main_content) + '\n\n' + hashtag_string
    
    return cleaned_content.strip()


def _get_sample_post(topic: str, tone: str = "professional", audience: str = None) -> str:
    """
    Get a sample post when Llama is not available or fails.
    
    Args:
        topic: Topic for the post
        tone: Tone of the post
        audience: Target audience
        
    Returns:
        Sample post content in proper LinkedIn format
    """
    # Sample posts for different topics and tones in proper LinkedIn format
    sample_posts = {
        "technology": {
            "professional": [
                "Just explored the latest advancements in AI and machine learning.\n\nThe pace of innovation is truly remarkable! From neural networks to transformer architectures, we're witnessing groundbreaking developments that will reshape industries.\n\nWhat excites you most about the future of AI?\n\n#AI #MachineLearning #TechInnovation #FutureTech",
                "Attended an insightful session on cloud computing trends.\n\nThe future of scalable infrastructure looks promising with edge computing and hybrid cloud solutions becoming mainstream. Organizations are leveraging these technologies to achieve greater agility and cost efficiency.\n\nHow is your company adapting to these changes?\n\n#CloudComputing #Technology #Innovation #DigitalTransformation",
                "Interesting research paper on quantum computing applications in cybersecurity.\n\nThe intersection of these cutting-edge fields is fascinating. Quantum computing promises to revolutionize encryption methods while simultaneously posing new challenges for data protection.\n\nWhat implications do you see for cybersecurity in the quantum era?\n\n#QuantumComputing #Cybersecurity #Research #FutureSecurity"
            ],
            "casual": [
                "Anyone else excited about the new tech releases this week?\n\nI'm particularly interested in the AI improvements in the latest frameworks!\n\nWhat tech news has caught your attention lately?\n\n#TechNews #Innovation #TechUpdates",
                "Just tried out a new productivity app and I'm impressed!\n\nTech really makes life easier sometimes. The seamless integration and intuitive design make it a game-changer for remote work.\n\nWhat's your favorite productivity hack?\n\n#Productivity #Apps #TechLife #WorkSmart",
                "Quick tip: If you're into coding, check out this new framework.\n\nIt's a game-changer for web development with its component-based architecture and lightning-fast rendering. Perfect for building modern user interfaces.\n\nHave you experimented with any new frameworks recently?\n\n#Coding #WebDevelopment #Programming #DevTools"
            ],
            "inspirational": [
                "Technology has the power to solve humanity's greatest challenges.\n\nEvery breakthrough brings us closer to a better future - from healthcare innovations to climate solutions. The potential for positive impact is limitless when we combine creativity with purpose.\n\nWhat problem would you love to see technology solve?\n\n#Innovation #TechForGood #Inspiration #PositiveImpact",
                "Remember that behind every great tech product is a team of passionate individuals who believed in their vision.\n\nFrom concept to deployment, countless hours of collaboration, iteration, and determination bring ideas to life.\n\nWho inspires you in the tech industry?\n\n#Teamwork #Innovation #TechIndustry #PeopleFirst",
                "The future belongs to those who embrace change and leverage technology for positive impact.\n\nBe part of the solution! Whether you're a developer, designer, or business leader, your unique perspective matters in shaping tomorrow's world.\n\nHow are you preparing for the future?\n\n#FutureTech #Leadership #Innovation #ChangeMakers"
            ]
        },
        "business": {
            "professional": [
                "Market analysis shows promising growth in the digital transformation sector.\n\nStrategic investments now could yield significant returns as organizations prioritize automation, data analytics, and customer experience enhancements.\n\nWhat digital initiatives is your company prioritizing?\n\n#BusinessStrategy #DigitalTransformation #Investment #MarketTrends",
                "Effective leadership in the modern workplace requires adaptability and continuous learning.\n\nToday's leaders must navigate remote work dynamics, foster innovation, and develop talent in rapidly changing environments.\n\nHow is your organization evolving its leadership approach?\n\n#Leadership #Management #BusinessGrowth #OrganizationalDevelopment",
                "Customer-centric approaches drive sustainable competitive advantage.\n\nFocus on value creation for long-term success. Companies that prioritize customer needs, gather feedback, and iterate quickly outperform competitors consistently.\n\nHow do you ensure your customer strategy stays ahead?\n\n#CustomerExperience #BusinessStrategy #Marketing #ValueCreation"
            ],
            "casual": [
                "Running a business is like solving puzzles daily.\n\nSome days are more challenging than others, but that's what makes it exciting! Each obstacle overcome brings valuable insights and growth opportunities.\n\nWhat's the most interesting business puzzle you're solving right now?\n\n#Entrepreneurship #SmallBusiness #StartupLife #ProblemSolving",
                "Coffee and strategy meetings - the perfect combination for productive brainstorming sessions.\n\nThere's something magical about whiteboard sessions that spark innovation and alignment.\n\nWhat's your secret to effective meetings?\n\n#BusinessTips #Productivity #Networking #Teamwork",
                "Just closed a deal and feeling accomplished!\n\nCelebrating small wins is important in the journey to bigger goals. Milestones keep momentum and morale high during challenging projects.\n\nWhat recent win are you celebrating?\n\n#BusinessSuccess #Achievement #Entrepreneur #Winning"
            ],
            "inspirational": [
                "Every successful business started with a single idea and the courage to pursue it.\n\nYour vision matters - make it happen! The path may be uncertain, but passion and persistence can overcome any obstacle.\n\nWhat bold idea are you ready to bring to life?\n\n#Entrepreneurship #BusinessIdeas #Inspiration #DreamBig",
                "Challenges are opportunities in disguise.\n\nEmbrace them, learn from them, and grow stronger as a leader. Every setback teaches resilience and reveals hidden strengths.\n\nHow have challenges shaped your leadership journey?\n\n#BusinessLeadership #GrowthMindset #Resilience #LeadershipJourney",
                "Building something meaningful takes time, patience, and persistence.\n\nStay committed to your mission and trust the process. Success is rarely overnight - it's the result of consistent effort and unwavering dedication.\n\nWhat keeps you motivated during tough times?\n\n#BusinessGrowth #Perseverance #Vision #Entrepreneurship"
            ]
        },
        "marketing": {
            "professional": [
                "Data-driven marketing strategies deliver measurable ROI.\n\nLeverage analytics to optimize campaign performance and customer engagement. By understanding audience behavior and preferences, marketers can create personalized experiences that drive conversions.\n\nHow do you use data to inform your marketing decisions?\n\n#DigitalMarketing #DataAnalytics #ROI #MarketingStrategy",
                "Content marketing builds trust and establishes thought leadership.\n\nConsistent, valuable content drives organic growth by positioning brands as industry experts. Quality storytelling resonates with audiences and fosters long-term relationships.\n\nWhat's your content marketing philosophy?\n\n#ContentMarketing #ThoughtLeadership #BrandBuilding #Storytelling",
                "Social media platforms offer unprecedented reach for brand awareness.\n\nDevelop platform-specific strategies for maximum impact. Each channel requires tailored content formats and engagement approaches to connect authentically with diverse audiences.\n\nWhich social platform delivers the best ROI for your brand?\n\n#SocialMediaMarketing #BrandAwareness #DigitalStrategy #PlatformOptimization"
            ],
            "casual": [
                "Love seeing creative marketing campaigns that stand out!\n\nWhat's the most memorable ad you've seen recently? I'd love to hear your thoughts on what makes marketing truly impactful.\n\n#Marketing #Creativity #Advertising #CampaignIdeas",
                "Quick marketing tip: Personalization goes a long way in connecting with your audience.\n\nSmall touches like using someone's name or referencing their interests can dramatically improve engagement rates.\n\nWhat personalization tactics work best for you?\n\n#MarketingTips #Personalization #CustomerExperience #Engagement",
                "Just analyzed our latest campaign metrics and the results are encouraging.\n\nData really tells a story! These insights will guide our next round of optimizations and creative directions.\n\nHow do you measure marketing success?\n\n#MarketingAnalytics #DataDriven #CampaignResults #PerformanceMarketing"
            ],
            "inspirational": [
                "Great marketing isn't about selling - it's about solving problems and adding value to people's lives.\n\nFocus on genuine impact. When brands prioritize customer needs over sales targets, authentic relationships flourish naturally.\n\nHow does your marketing create value for customers?\n\n#MarketingPhilosophy #ValueCreation #CustomerFirst #PurposeDriven",
                "Behind every successful brand is a story worth telling.\n\nWhat's your brand's story and how does it resonate with your audience? Authentic narratives build emotional connections that transcend transactions.\n\nWhat makes your brand story unique?\n\n#BrandStorytelling #Authenticity #Marketing #NarrativePower",
                "Marketing excellence comes from understanding your audience deeply and delivering experiences that matter to them.\n\nWhen strategy meets empathy, campaigns transform into movements that inspire action and loyalty.\n\nHow do you ensure your marketing resonates with your audience?\n\n#CustomerCentric #MarketingStrategy #AudienceEngagement #ExperienceDesign"
            ]
        },
        "default": {
            "professional": [
                "Continuous learning is essential in today's rapidly evolving landscape.\n\nStay curious and keep growing professionally. The most successful professionals are those who embrace lifelong learning and adapt to new challenges.\n\nWhat's the most valuable skill you've developed recently?\n\n#ProfessionalDevelopment #LifelongLearning #Growth #CareerAdvancement",
                "Collaboration drives innovation.\n\nWhen diverse perspectives come together, amazing things happen. Cross-functional teamwork breaks down silos and unlocks creative solutions.\n\nHow do you foster collaboration in your workplace?\n\n#Collaboration #Innovation #Teamwork #CrossFunctional",
                "Setting clear goals provides direction and motivation.\n\nWhat are your key objectives for this quarter? Well-defined targets help prioritize efforts and measure progress effectively.\n\n#GoalSetting #Productivity #Planning #QuarterlyGoals"
            ],
            "casual": [
                "Sometimes the best ideas come from unexpected conversations.\n\nKeep an open mind and listen actively! The most innovative solutions often emerge from diverse viewpoints and spontaneous discussions.\n\nWhen did you last have a conversation that sparked a new idea?\n\n#Ideas #Conversation #Creativity #Innovation",
                "Working on something exciting and can't wait to share more details soon.\n\nStay tuned! The anticipation of unveiling new projects keeps energy high and motivation strong.\n\n#ComingSoon #ExcitingProjects #WorkInProgress #Innovation",
                "Quick reminder: Take breaks and recharge.\n\nYour mental well-being is just as important as your productivity. Regular rest prevents burnout and maintains peak performance.\n\nHow do you prioritize self-care in your routine?\n\n#Wellness #WorkLifeBalance #SelfCare #MentalHealth"
            ],
            "inspirational": [
                "Every expert was once a beginner.\n\nEmbrace the learning journey and celebrate progress along the way. Growth happens through practice, persistence, and learning from failures.\n\nWhat skill are you currently developing?\n\n#GrowthMindset #Learning #PersonalDevelopment #Journey",
                "Your potential is limitless.\n\nBelieve in yourself and take action toward your dreams today. Confidence combined with effort creates extraordinary outcomes.\n\nWhat dream are you pursuing?\n\n#Motivation #BelieveInYourself #DreamBig #Potential",
                "Success is not final, failure is not fatal: it is the courage to continue that counts.\n\nKeep moving forward! Resilience and determination are the hallmarks of lasting achievement.\n\nWhat motivates you to persevere through challenges?\n\n#Resilience #Perseverance #Courage #KeepGoing"
            ],
            "educational": [
                "Knowledge sharing strengthens communities and accelerates collective growth.\n\nWhat did you learn today? Teaching others reinforces your own understanding while helping peers advance.\n\n#KnowledgeSharing #Community #Learning #ContinuousImprovement",
                "Understanding the fundamentals is crucial before diving into advanced concepts.\n\nMaster the basics first. Strong foundational knowledge provides the framework for tackling complex challenges confidently.\n\n#Education #Fundamentals #LearningProcess #SkillBuilding",
                "Critical thinking skills are invaluable in navigating complex information.\n\nQuestion, analyze, and form your own conclusions. Don't accept information at face value - dig deeper to uncover insights.\n\n#CriticalThinking #Analysis #Education #InformationLiteracy"
            ]
        }
    }
    
    # Select appropriate category
    category = "default"
    if any(keyword in topic.lower() for keyword in ["tech", "ai", "software", "programming"]):
        category = "technology"
    elif any(keyword in topic.lower() for keyword in ["business", "startup", "entrepreneur", "finance"]):
        category = "business"
    elif any(keyword in topic.lower() for keyword in ["marketing", "advertising", "brand", "campaign"]):
        category = "marketing"
    
    # Get posts for the category and tone
    posts = sample_posts.get(category, sample_posts["default"]).get(tone, sample_posts["default"]["professional"])
    
    # Return a random post from the list
    return random.choice(posts)