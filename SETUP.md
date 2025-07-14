# Business Finder Setup Guide

## Prerequisites

1. Sign up for a SerpAPI account at https://serpapi.com/
2. Get your API key from the SerpAPI dashboard
3. Set up a MongoDB cluster (MongoDB Atlas recommended)
4. Get your MongoDB connection URI

## Environment Variables

Create a `.env.local` file in the root directory with the following content:

```
SERPAPI_API_KEY=your_actual_serpapi_api_key_here
MONGO_URI=your_mongodb_connection_uri_here
```

### MongoDB Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get your connection string and replace `<password>` with your actual password

Example MongoDB URI format:

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up your environment variables (see above)

3. Run the development server:

```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

## Features

- Search for businesses by service type and zip code
- Display business information including name, phone, website, and description
- Responsive design using Material-UI 5
- Clickable phone numbers and website links
- Star ratings and review counts
- **Phone call tracking** - Automatically logs when users call businesses to MongoDB

## Business Types Supported

- Roofing
- HVAC
- Fencing
- Plumbing
- Electrical
- Siding
- Landscaping
- Home cleaning
- Commercial cleaning
- Security services
- Painting
- Janitorial

## Database Schema

The app automatically creates a `business_finder` database with a `phone_calls` collection that tracks:

- Business information
- Call timestamps
- Call counts
- First and last call dates
