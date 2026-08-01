# Ethiopia Travel Super App

This repository contains a single Express backend that serves a static single-file frontend (backend/index.html) and a full REST API under `/api`.

This branch (finalize/app-fixes) contains repository housekeeping and deployment instructions so you can run the app locally or deploy on Railway.

Important: before running in production, rotate any credentials that were previously embedded in server.js and set the environment variables listed below.

Required environment variables

- MONGODB_URI — MongoDB connection string (mongodb+srv://...)
- JWT_SECRET — JWT signing secret
- JWT_REFRESH_SECRET — JWT refresh signing secret
- CLOUDINARY_CLOUD_NAME — Cloudinary cloud name
- CLOUDINARY_API_KEY — Cloudinary API key
- CLOUDINARY_API_SECRET — Cloudinary API secret
- EMAIL_USER — SMTP user / Gmail account
- EMAIL_PASSWORD — SMTP password or Gmail app password
- PORT — (optional) port to run the server (default: 5000)
- NODE_ENV — set to `production` in production

Running locally

1. Install dependencies:

   cd backend
   npm install

2. Create a `.env` file in `backend/` or set environment variables in your shell. You can copy the `.env.example` file as a starting point.

3. Start the server:

   npm run dev

4. Open http://localhost:5000 in your browser. OTP codes are logged to the server console for testing.

Deploying to Railway

- Create a Railway project and connect the GitHub repo or push from this repository.
- Ensure the environment variables above are set in Railway Environment variables.
- Railway will use the root `package.json` start script to run `node backend/server.js`.

Security notes

- Do NOT leave real secrets in source files. Rotate any credentials that were visible in code.
- Use environment variables for production credentials and restrict access to them.

If you want, I can now:

- Make targeted code changes (remove hardcoded defaults, improve error messages),
- Wire up CI or tests,
- Test flows end-to-end given production env values (you'll need to provide them in Railway),
- Open a pull request with the changes in this branch.

Reply and I will continue with the next changes you want.
