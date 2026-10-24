-- Sample seed data for local development

INSERT INTO categories (name) VALUES
    ('Fiction'), ('Non-Fiction'), ('Science'), ('History'), ('Technology')
ON CONFLICT (name) DO NOTHING;

INSERT INTO authors (name) VALUES
    ('George Orwell'), ('Isaac Asimov'), ('Yuval Noah Harari')
ON CONFLICT DO NOTHING;

-- Default admin user — password: "Admin@123" (bcrypt hash below, change after first login)
INSERT INTO users (name, email, password_hash, role)
VALUES ('System Admin', 'admin@library.com', '$2b$10$kTEhuIKFHdObW16WYdWx8.ZYjaGpFSdIONCvc5bfhMLsncvGa/I82', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO books (title, isbn, category_id, publisher, published_year, total_copies, available_copies, cover_image_url)
SELECT '1984', '9780451524935', id, 'Secker & Warburg', 1949, 3, 3, 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg' FROM categories WHERE name = 'Fiction'
ON CONFLICT (isbn) DO NOTHING;

INSERT INTO books (title, isbn, category_id, publisher, published_year, total_copies, available_copies, cover_image_url)
SELECT 'Sapiens', '9780062316097', id, 'Harper', 2011, 2, 2, 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg' FROM categories WHERE name = 'Non-Fiction'
ON CONFLICT (isbn) DO NOTHING;
