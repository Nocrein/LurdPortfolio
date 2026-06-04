<?php
ini_set('display_errors', 0);
error_reporting(0);
header('Content-Type: application/json');

$root   = getenv('RAILWAY_VOLUME_MOUNT_PATH') ?: dirname(__DIR__);
$dbPath = $root . '/database/portfolio.db';
$dbDir  = dirname($dbPath);

$checks = [
    'php_version'  => PHP_VERSION,
    'db_dir'       => $dbDir,
    'db_dir_exists'   => is_dir($dbDir),
    'db_dir_writable' => is_writable($dbDir) || (!is_dir($dbDir) && @mkdir($dbDir, 0777, true)),
    'db_exists'    => file_exists($dbPath),
    'pdo_sqlite'   => extension_loaded('pdo_sqlite'),
    'uploads_ok'   => is_dir($root . '/uploads') || @mkdir($root . '/uploads/posts', 0777, true),
];

// Try connecting
try {
    if (!is_dir($dbDir)) mkdir($dbDir, 0777, true);
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $checks['db_connect'] = 'OK';
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
    $checks['tables'] = $tables;
} catch (Throwable $e) {
    $checks['db_connect'] = 'FAILED: ' . $e->getMessage();
}

http_response_code(200);
echo json_encode($checks, JSON_PRETTY_PRINT);
