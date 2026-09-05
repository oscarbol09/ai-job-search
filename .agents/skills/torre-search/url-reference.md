# Torre API & URL Reference

This document records the endpoint contracts and schema definitions used by the `torre-search` CLI.

## Endpoints

### 1. Search Endpoint (Public REST API)
- **Method:** `POST`
- **URL:** `https://search.torre.co/opportunities/_search/?size={limit}&offset={offset}`
- **Headers:**
  - `Content-Type: application/json`
  - `User-Agent: Mozilla/5.0 (compatible; torre-search-cli/1.0; +https://github.com/oscarbol09/ai-job-search)`
- **Body Schema:**
  ```json
  {
    "and": [
      { "skill/role": { "text": "python", "experience": "potential-to-develop" } },
      { "status": { "code": "open" } }
    ]
  }
  ```

### 2. Detail Endpoint (Public REST API)
- **Method:** `GET`
- **URL:** `https://torre.co/api/suite/opportunities/{id}`
- **Headers:**
  - `Accept: application/json`
  - `User-Agent: Mozilla/5.0 (compatible; torre-search-cli/1.0; +https://github.com/oscarbol09/ai-job-search)`

## Canonical Post URLs
- Format: `https://torre.ai/post/{id}` or `https://torre.co/post/{id}`
