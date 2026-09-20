-- Library Management System — PostgreSQL schema (raw SQL, no ORM)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================
-- ENUM TYPES
-- ============================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'librarian', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE borrow_status AS ENUM ('borrowed', 'returned', 'overdue', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('pending', 'fulfilled', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================
-- USERS
-- ============================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'member',
    phone           VARCHAR(20),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- CATEGORIES
-- ============================
CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE
);

-- ============================
-- AUTHORS
-- ============================
CREATE TABLE IF NOT EXISTS authors (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    bio             TEXT
);

-- ============================
-- BOOKS
-- ============================
CREATE TABLE IF NOT EXISTS books (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(255) NOT NULL,
    isbn                VARCHAR(20) UNIQUE,
    category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    publisher           VARCHAR(150),
    published_year      SMALLINT,
    total_copies        INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies    INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    shelf_location      VARCHAR(50),
    cover_image_url     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (available_copies <= total_copies)
);

CREATE TABLE IF NOT EXISTS book_authors (
    book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id   INTEGER NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

-- ============================
-- BORROW RECORDS
-- ============================
CREATE TABLE IF NOT EXISTS borrow_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    borrowed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_at          TIMESTAMPTZ NOT NULL,
    returned_at     TIMESTAMPTZ,
    status          borrow_status NOT NULL DEFAULT 'borrowed',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_borrow_user ON borrow_records(user_id);
CREATE INDEX IF NOT EXISTS idx_borrow_book ON borrow_records(book_id);
CREATE INDEX IF NOT EXISTS idx_borrow_status ON borrow_records(status);

-- ============================
-- FINES
-- ============================
CREATE TABLE IF NOT EXISTS fines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    borrow_record_id    UUID NOT NULL REFERENCES borrow_records(id) ON DELETE CASCADE,
    amount              NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    reason              VARCHAR(255) DEFAULT 'Overdue return',
    is_paid             BOOLEAN NOT NULL DEFAULT false,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================
-- RESERVATIONS
-- ============================
CREATE TABLE IF NOT EXISTS reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    reserved_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    status          reservation_status NOT NULL DEFAULT 'pending',
    expires_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reservations_book ON reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);

-- ============================
-- updated_at auto-update trigger
-- ============================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_books_updated_at ON books;
CREATE TRIGGER trg_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
