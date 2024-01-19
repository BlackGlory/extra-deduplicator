--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

PRAGMA journal_mode = WAL;

CREATE TABLE hash (
  id   INTEGER PRIMARY KEY AUTOINCREMENT
, hash TEXT    UNIQUE  ON CONFLICT REPLACE
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

PRAGMA journal_mode = DELETE;

DROP TABLE hash;