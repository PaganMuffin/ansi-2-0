CREATE TABLE IF NOT EXISTS ansi_old (
  id INTEGER PRIMARY KEY AUTOINCREMENT UNIQUE,
  title_romaji TEXT NOT NULL,
  title_english TEXT,
  title_other TEXT,
  date INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  author_nick TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS ansi_old_fts USING fts5(
  title_romaji,
  title_english,
  title_other,
  author_nick,
  content='ansi_old',
  content_rowid='id',
  tokenize="trigram"
);

CREATE TRIGGER IF NOT EXISTS ansi_old_ai AFTER INSERT ON ansi_old BEGIN
  INSERT INTO ansi_old_fts(rowid, title_romaji, title_english, title_other, author_nick)
  VALUES (new.id, new.title_romaji, new.title_english, new.title_other, new.author_nick);
END;

CREATE TRIGGER IF NOT EXISTS ansi_old_ad AFTER DELETE ON ansi_old BEGIN
  INSERT INTO ansi_old_fts(ansi_old_fts, rowid, title_romaji, title_english, title_other, author_nick)
  VALUES('delete', old.id, old.title_romaji, old.title_english, old.title_other, old.author_nick);
END;

CREATE TRIGGER IF NOT EXISTS ansi_old_au AFTER UPDATE ON ansi_old BEGIN
  INSERT INTO ansi_old_fts(ansi_old_fts, rowid, title_romaji, title_english, title_other, author_nick)
  VALUES('delete', old.id, old.title_romaji, old.title_english, old.title_other, old.author_nick);
  INSERT INTO ansi_old_fts(rowid, title_romaji, title_english, title_other, author_nick)
  VALUES (new.id, new.title_romaji, new.title_english, new.title_other, new.author_nick);
END;

CREATE INDEX IF NOT EXISTS idx_date ON ansi_old(date); 