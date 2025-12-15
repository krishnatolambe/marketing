# LinkedIn AutoMarketer API Documentation

## Overview

The LinkedIn AutoMarketer API provides programmatic access to LinkedIn content generation and scheduling features. This documentation covers all available endpoints, authentication methods, and usage guidelines.

## Base URL

```
http://localhost:3001/api
```

For production deployments, replace with your actual domain.

## Authentication

Most API endpoints require authentication using JWT (JSON Web Tokens). To authenticate:

1. Obtain a token by logging in via `/api/auth/login`
2. Include the token in the Authorization header for subsequent requests:

```
Authorization: Bearer <your-token-here>
```

### Token Expiration

Tokens expire after 30 minutes by default. Refresh tokens or re-authenticate as needed.

## Rate Limits

The API implements rate limiting to ensure fair usage:
- 60 requests per minute per IP address
- 1000 requests per hour per IP address

Exceeding these limits will result in a 429 (Too Many Requests) response.

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid request parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource does not exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong on our end |

Error responses include a JSON body with details:

```json
{
  "detail": "Error message describing what went wrong"
}
```

## Endpoints

### Authentication

#### POST `/api/auth/login`

Authenticate a user and receive an access token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string",
  "phone": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": "string",
    "username": "string"
  }
}
```

#### GET `/api/auth/me`

Get information about the currently authenticated user.

**Response:**
```json
{
  "success": true,
  "message": "User information retrieved successfully",
  "data": {
    "user_id": "string",
    "username": "string",
    "email": "string",
    "role": "user",
    "status": "active",
    "created_at": "ISO date string",
    "last_login": "ISO date string"
  }
}
```

### Content Generation

#### POST `/api/content/generate`

Generate LinkedIn posts using AI based on provided parameters.

**Request Body:**
```json
{
  "topic": "string",
  "tone": "professional|casual|inspirational|educational",
  "audience": "string (optional)",
  "url": "string (optional)",
  "length": "short|medium|long",
  "includeHashtags": true,
  "emojis": true
}
```

**Response:**
```json
{
  "success": true,
  "posts": ["Generated post content..."]
}
```

#### POST `/api/content/save`

Save a generated post to the database.

**Request Body:**
```json
{
  "content": "string",
  "hashtags": ["string"] (optional),
  "imageUrl": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "post": {
    "_id": "string",
    "userId": "string",
    "content": "string",
    "hashtags": ["string"],
    "imageUrl": "string",
    "status": "draft",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
}
```

### Scheduling

#### POST `/api/schedule/`

Schedule a post for future publishing.

**Request Body:**
```json
{
  "postId": "string",
  "scheduledAt": "ISO date string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Post scheduled successfully",
  "job": {
    "id": "string",
    "postId": "string",
    "userId": "string",
    "scheduleTime": "ISO date string",
    "status": "pending"
  }
}
```

#### GET `/api/schedule/`

Get all scheduled posts for the current user.

**Response:**
```json
{
  "success": true,
  "scheduledPosts": [
    {
      "id": "string",
      "postId": "string",
      "content": "string",
      "scheduledAt": "ISO date string",
      "status": "string"
    }
  ]
}
```

#### PUT `/api/schedule/{scheduled_post_id}`

Update the scheduled time for a post.

**Request Body:**
```json
{
  "scheduledAt": "ISO date string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled post updated successfully",
  "job": {
    "id": "string",
    "postId": "string",
    "scheduleTime": "ISO date string",
    "status": "pending"
  }
}
```

#### PUT `/api/schedule/{scheduled_post_id}/content`

Update both the scheduled time and content for a post.

**Request Body:**
```json
{
  "scheduledAt": "ISO date string",
  "content": "string",
  "hashtags": ["string"] (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled post and content updated successfully",
  "job": {
    "id": "string",
    "postId": "string",
    "scheduleTime": "ISO date string",
    "status": "pending"
  }
}
```

#### DELETE `/api/schedule/{scheduled_post_id}`

Delete a scheduled post.

**Response:**
```json
{
  "success": true,
  "message": "Scheduled post deleted successfully"
}
```

### Analytics

#### GET `/api/analytics/{post_id}`

Get analytics for a specific post.

**Response:**
```json
{
  "success": true,
  "analytics": {
    "postId": "string",
    "views": 150,
    "likes": 25,
    "comments": 8,
    "shares": 3,
    "impressions": 420,
    "engagementRate": 8.5,
    "createdAt": "ISO date string"
  }
}
```

#### GET `/api/analytics/best-times`

Get the best times to post based on analytics.

**Response:**
```json
{
  "success": true,
  "bestTimes": [
    {
      "day": "Monday",
      "hour": 10,
      "engagement": 85
    }
  ]
}
```

## Health Checks

#### GET `/health`

Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "ISO date string",
  "service": "linkedin-marketing-api"
}
```

#### GET `/api/health/detailed`

Detailed health check including database status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "ISO date string",
  "service": "linkedin-marketing-api",
  "components": {
    "database": "connected"
  }
}
```

## Best Practices

1. **Handle Errors Gracefully**: Always check HTTP status codes and handle errors appropriately in your application.

2. **Cache When Possible**: For frequently accessed data that doesn't change often, implement caching to reduce API calls.

3. **Use HTTPS in Production**: Always use HTTPS in production environments to protect data in transit.

4. **Store Tokens Securely**: Never store JWT tokens in plain text. Use secure storage mechanisms appropriate for your platform.

5. **Implement Retry Logic**: For critical operations, implement exponential backoff retry logic to handle temporary failures.

6. **Monitor Rate Limits**: Implement rate limit tracking in your application to avoid being throttled.

## Support

For issues, questions, or contributions, please visit our [GitHub repository](https://github.com/your-org/linkedin-auto-marketer).

## Changelog

### v1.0.0
- Initial release
- Content generation and scheduling features
- User authentication and management
- Analytics endpoints
- Comprehensive API documentation