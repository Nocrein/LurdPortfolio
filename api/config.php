<?php
ini_set('display_errors', 0);
error_reporting(0);

$dataDir = getenv('RAILWAY_VOLUME_MOUNT_PATH') ?: __DIR__ . '/..';

define('DB_PATH',       $dataDir . '/database/portfolio.db');
define('UPLOAD_POSTS',  $dataDir . '/uploads/posts/');
define('UPLOAD_AVATAR', $dataDir . '/uploads/avatar/');
define('UPLOAD_PROJ',   $dataDir . '/uploads/projects/');
define('JWT_SECRET',    getenv('JWT_SECRET') ?: 'portfolio_jwt_2024_changeme');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

function getDB() {
    static $db = null;
    if ($db !== null) return $db;

    foreach ([DB_PATH, UPLOAD_POSTS, UPLOAD_AVATAR, UPLOAD_PROJ] as $path) {
        $dir = is_dir($path) ? $path : dirname($path);
        if (!is_dir($dir)) mkdir($dir, 0777, true);
    }

    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec('PRAGMA journal_mode=WAL');
    initDB($db);
    return $db;
}

function initDB($db) {
    $db->exec("
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT DEFAULT 'Your Name',
            tagline TEXT DEFAULT 'Full-Stack Developer',
            bio TEXT DEFAULT '',
            location TEXT DEFAULT '',
            avatar TEXT DEFAULT '',
            resume_url TEXT DEFAULT '',
            github TEXT DEFAULT '',
            linkedin TEXT DEFAULT '',
            twitter TEXT DEFAULT '',
            website TEXT DEFAULT '',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            level INTEGER DEFAULT 80,
            sort_order INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            image TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            tech TEXT DEFAULT '',
            image TEXT DEFAULT '',
            live_url TEXT DEFAULT '',
            github_url TEXT DEFAULT '',
            featured INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ");

    // Seed admin
    $row = $db->query("SELECT id FROM admin LIMIT 1")->fetch();
    if (!$row) {
        $db->prepare("INSERT INTO admin (email, password) VALUES (?, ?)")
           ->execute(['admin@portfolio.dev', password_hash('admin123', PASSWORD_BCRYPT)]);
    }

    // Seed profile
    $row = $db->query("SELECT id FROM profile LIMIT 1")->fetch();
    if (!$row) {
        $db->exec("INSERT INTO profile (name, tagline, bio) VALUES ('Your Name', 'Full-Stack Developer', 'A passionate developer who loves building things.')");
    }
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}
function errorResponse($msg, $code = 400) {
    jsonResponse(['error' => $msg], $code);
}

function generateToken($id) {
    $h = base64_encode(json_encode(['alg'=>'HS256','typ'=>'JWT']));
    $p = base64_encode(json_encode(['sub'=>$id,'iat'=>time(),'exp'=>time()+86400]));
    $s = base64_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    return "$h.$p.$s";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$h, $p, $s] = $parts;
    $expected = base64_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    if (!hash_equals($expected, $s)) return false;
    $data = json_decode(base64_decode($p), true);
    if ($data['exp'] < time()) return false;
    return $data;
}

function requireAuth() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!$auth || !str_starts_with($auth, 'Bearer ')) errorResponse('Unauthorized', 401);
    $data = verifyToken(substr($auth, 7));
    if (!$data) errorResponse('Invalid or expired token', 401);
    return $data;
}

function saveUpload($file, $destDir, $prefix = 'file') {
    if (!$file || $file['error'] !== UPLOAD_ERR_OK) return null;
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg','jpeg','png','webp','gif'])) return null;
    if ($file['size'] > 8 * 1024 * 1024) return null;
    if (!is_dir($destDir)) mkdir($destDir, 0777, true);
    $name = $prefix . '_' . time() . '_' . rand(100,999) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $destDir . $name)) return null;
    return $name;
}
