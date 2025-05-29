# Career Code Server

This is the backend server for the Job Portal (Career Code) Full Website project, built with Node.js, Express, and MongoDB.

## Features

- RESTful API for job postings and applications
- MongoDB database integration
- Environment variable support for sensitive data
- CORS enabled for cross-origin requests

## Endpoints

### Jobs

- `GET /jobs?email=hr@example.com` — Get jobs posted by a specific HR email
- `GET /jobs/:id` — Get a single job by ID
- `POST /jobs` — Add a new job
- `GET /jobs/applications?email=hr@example.com` — Get jobs with application counts for a specific HR

### Applications

- `GET /applications?email=applicant@example.com` — Get applications by applicant email
- `GET /applications/job/:job_id` — Get all applications for a specific job
- `POST /applications` — Submit a new application
- `PATCH /applications/:id` — Update application status
- `DELETE /applications/:id` — Delete an application

## Getting Started

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with your MongoDB credentials:
   ```env
   DB_USER=your_db_user
   DB_PASS=your_db_password
   PORT=3000
   ```
3. Start the server:
   ```bash
   node index.js
   ```

## Environment Variables

- `DB_USER`: MongoDB username
- `DB_PASS`: MongoDB password
- `PORT`: Port to run the server (default: 3000)
