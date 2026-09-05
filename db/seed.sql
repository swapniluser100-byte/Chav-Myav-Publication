-- Sample seed data. Run AFTER schema.sql:
-- wrangler d1 execute chav-mayav-db --remote --file=./db/seed.sql

INSERT INTO categories (name, slug, description) VALUES
  ('कथासंग्रह', 'katha-sangrah', 'लघुकथांचे संग्रह'),
  ('कादंबरी', 'kadambari', 'दीर्घ कथात्मक कादंबऱ्या'),
  ('कविता', 'kavita', 'काव्यसंग्रह'),
  ('चरित्र', 'charitra', 'चरित्र व आत्मचरित्र');

INSERT INTO books (title, slug, author, category_id, description, price_paise, mrp_paise, stock, pages, cover_image_url, is_featured, is_active) VALUES
  ('मातीतील मोती', 'maatitil-moti', 'अनिल जोशी', 2, 'ग्रामीण महाराष्ट्रातील जीवनावर आधारित एक हृदयस्पर्शी कादंबरी.', 24900, 29900, 40, 212, '', 1, 1),
  ('पाऊसवाटा', 'paausvata', 'सुनीता देशपांडे', 3, 'निसर्ग आणि नात्यांवर भाष्य करणारा काव्यसंग्रह.', 14900, 17900, 60, 96, '', 1, 1),
  ('धुक्यातील पावलं', 'dhukyatil-paavlan', 'रमेश कुलकर्णी', 1, 'रहस्यमय व भावनिक लघुकथांचा संग्रह.', 19900, 22900, 35, 168, '', 0, 1),
  ('माझी जडणघडण', 'majhi-jadanghadan', 'शारदा भोसले', 4, 'एका सामान्य स्त्रीच्या असामान्य प्रवासाचे आत्मकथन.', 29900, 34900, 25, 240, '', 1, 1);

-- Default admin login: admin@chavmayav.com / ChangeMe123!
-- (hash generated with PBKDF2, 100000 iterations - replace via admin-create-user script before going live)
