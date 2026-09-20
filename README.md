# Library Management System

Node/Express + raw PostgreSQL (`pg`, no ORM) backend with a React (Vite) frontend.

## Structure
```
server/   Express API (raw SQL via pg)
client/   React frontend (Vite)
```

## Prerequisites
- Node.js 18+
- PostgreSQL 13+ running locally (or via Docker)

You don't currently have `psql`/Postgres installed on this machine. Options:
- Install via Homebrew: `brew install postgresql@16 && brew services start postgresql@16`
- Or run via Docker: `docker run --name library-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=library_db -p 5432:5432 -d postgres:16`

## Backend setup
```bash
cd server
cp .env.example .env   # edit DB credentials / JWT_SECRET as needed
npm run migrate         # creates tables from db/schema.sql
npm run seed             # inserts a couple of real sample books + admin user
npm run seed:bulk        # optional: generates 1000 additional random books for testing
npm run dev               # starts API on http://localhost:5001
```

Default seeded admin login: `admin@library.com` / `Admin@123` (change immediately in production).

Note: port 5000 is commonly taken by macOS's AirPlay Receiver, so this project defaults to **5001**.

## Frontend setup
```bash
cd client
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5001/api
npm run dev
```
Visit http://localhost:5173

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/books` (supports `search`, `category`, `page`, `limit`; returns `{ data, total, page, limit, totalPages }`)
- `GET /api/books/categories`, `GET /api/books/:id`
- `POST/PUT/DELETE /api/books/:id` (admin/librarian)
- `POST /api/borrow` (borrow a book), `GET /api/borrow/me` (my loans)
- `POST /api/borrow/:id/return`, `GET /api/borrow` (admin/librarian)
- `GET/PUT/DELETE /api/users/:id` (admin)

## Notes
- All SQL is hand-written (`server/db`, `server/controllers`) — no ORM.
- Borrow/return operations run inside DB transactions to keep `available_copies` consistent.
- Overdue fines are calculated at return time (`FINE_PER_DAY` in `borrowController.js`).
- **Book covers**: the `books.cover_image_url` column holds a direct image URL. For real books, [Open Library Covers](https://openlibrary.org/dev/docs/api/covers) is free and keyless — `https://covers.openlibrary.org/b/isbn/<ISBN>-L.jpg`. When a book has no `cover_image_url` set (e.g. the 1000 randomly generated demo books), the frontend falls back to a deterministic [Picsum Photos](https://picsum.photos/) placeholder seeded by the book's id, so the UI always shows an image.
