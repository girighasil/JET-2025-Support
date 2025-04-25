-- Create site_config table
CREATE TABLE IF NOT EXISTS "site_config" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" JSONB,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create promo_banners table
CREATE TABLE IF NOT EXISTS "promo_banners" (
  "id" SERIAL PRIMARY KEY,
  "text" TEXT NOT NULL,
  "url" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "order" INTEGER NOT NULL DEFAULT 1,
  "start_date" TIMESTAMP,
  "end_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial site configuration for basic site settings
INSERT INTO "site_config" ("key", "value")
VALUES ('siteSettings', '{"siteTitle": "JET 2025", "tagline": "Prepare for JET Entrance Exam", "instituteName": "Paras Education"}')
ON CONFLICT ("key") DO NOTHING;

-- Initial site configuration for exam info
INSERT INTO "site_config" ("key", "value")
VALUES ('examInfo', '{"name": "JET", "fullName": "Joint Entrance Test", "year": "2025", "applicationStartDate": "February 20, 2025", "applicationEndDate": "March 30, 2025", "examDate": "May 14, 2025", "universityName": "Swami Keshwanand Rajasthan Agricultural University, Bikaner"}')
ON CONFLICT ("key") DO NOTHING;

-- Initial site configuration for contact and social info
INSERT INTO "site_config" ("key", "value")
VALUES ('contactAndSocial', '{"footer": {"phone": "9072345678, 6372345678", "email": "contact@example.com", "address": "123 Main St, City"}, "social": {"whatsapp": "https://whatsapp.com/channel/0029VbAudzTHbFV5ppcj0b07"}}')
ON CONFLICT ("key") DO NOTHING;

-- Sample promotional banners
INSERT INTO "promo_banners" ("text", "is_active", "order")
VALUES 
  ('📢 JET 2025 Applications starting soon - Get ready with your documents', TRUE, 1),
  ('📚 Before filling the application form, read all instructions in the JET Booklet-2025', TRUE, 2),
  ('📞 Helpdesk available from 10am to 5pm - Contact for application assistance', TRUE, 3)
ON CONFLICT DO NOTHING;