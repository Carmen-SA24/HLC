CREATE TABLE "User" (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    uid INTEGER,
    gid INTEGER
);

INSERT INTO "User" (username, password, uid, gid) VALUES
('juan', 'secreto123', 10001, 10001),
('maria', 'clave456', 10002, 10002),
('luis', 'pass789', NULL, NULL);