-- MySQL Remote Access Setup for Multi-Machine POS
-- Run this on SERVER MySQL as root@localhost

CREATE DATABASE IF NOT EXISTS restaurant_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated POS user for remote access (safer than root)
CREATE USER IF NOT EXISTS 'pos_user'@'%' IDENTIFIED BY 'PosSecurePass2024!';
GRANT ALL PRIVILEGES ON restaurant_db.* TO 'pos_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurant_db.* TO 'pos_user'@'%';
FLUSH PRIVILEGES;

-- Verify user created
SELECT User, Host FROM mysql.user WHERE User='pos_user';
SHOW GRANTS FOR 'pos_user'@'%';

-- MySQL Config: Edit my.cnf / my.ini
-- [mysqld]
-- bind-address = 0.0.0.0
-- Restart MySQL service

-- Test remote connection (from client machine)
-- mysql -h SERVER_IP -u pos_user -p restaurant_db

PRINT '✅ Remote MySQL setup complete. Use DB_USER=pos_user DB_PASS=PosSecurePass2024! in .env'

