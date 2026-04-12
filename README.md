# Book Buddies

## Running the project

### A) Docker (easier, closer to production)

Requires Docker and Docker Compose.

Create a `.env` file in `backend/` with your MongoDB connection string:
```
ATLAS_URI=mongodb+srv://...
```

Then from the project root:
```
docker compose up --build
```

Frontend runs on http://localhost:4173
Backend runs on http://localhost:8800

Note: Docker builds a production bundle of the frontend (`vite build` + `vite preview`). Hot reload does not work — you need to rebuild after any change.

### B) Manual (better for development)

Requires Node 20+ and a running MongoDB instance (local or Atlas).

**Backend:**
```
cd backend
npm install
# create backend/.env with ATLAS_URI=...
npm start
```

**Frontend** (separate terminal):
```
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:5173
Backend runs on http://localhost:8800

Option B is better for development. The frontend runs with Vite's dev server so changes hot-reload instantly in the browser. With Docker you have to rebuild the container on every change which takes 30+ seconds.

---

## Running tests

frontend (vitest):
```
cd frontend
npm install
npm test
```

backend (jest):
```
cd backend
npm install
npm test
```
