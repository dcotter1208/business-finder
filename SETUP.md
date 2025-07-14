# Business Finder Setup Guide

## Prerequisites

1. Sign up for a SerpAPI account at https://serpapi.com/
2. Get your API key from the SerpAPI dashboard

## Environment Variables

Create a `.env.local` file in the root directory with the following content:

```
SERPAPI_API_KEY=your_actual_serpapi_api_key_here
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

## Business Types Supported

- Roofing
- HVAC
- Moving Companies
- Construction Labor
- Security Services
- Home Care
- Warehouse Staffing
- Delivery Services
- Janitorial
- Restaurant Staff
