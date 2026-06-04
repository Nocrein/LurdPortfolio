<?php
ini_set('display_errors', 0);
error_reporting(0);

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// ── API ───────────────────────────────────────────────────
if (str_starts_with($uri, '/api/')) {
    $file = __DIR__ . $uri;
    if (is_file($file)) {
        // Change working dir to api/ so relative requires inside work correctly
        chdir(__DIR__ . '/api');
        require $file;
        return true;
    }
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['error' => 'API endpoint not found: ' . $uri]);
    return true;
}

// ── UPLOADS ───────────────────────────────────────────────
if (str_starts_with($uri, '/uploads/')) {
    $dataDir = getenv('RAILWAY_VOLUME_MOUNT_PATH') ?: __DIR__;
    $file    = $dataDir . $uri;
    if (is_file($file)) {
        $ext  = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        $mime = match($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png'         => 'image/png',
            'webp'        => 'image/webp',
            'gif'         => 'image/gif',
            default       => 'application/octet-stream'
        };
        header('Content-Type: ' . $mime);
        header('Cache-Control: public, max-age=31536000');
        readfile($file);
        return true;
    }
    http_response_code(404);
    echo 'File not found';
    return true;
}

// ── STATIC FILES (css, js, fonts, etc.) ──────────────────
if ($uri !== '/' && is_file(__DIR__ . $uri)) {
    return false; // let PHP built-in server handle it
}

// ── ADMIN PAGES ───────────────────────────────────────────
if (str_starts_with($uri, '/admin/')) {
    $file = __DIR__ . $uri;
    if (is_file($file)) return false;
    // fallback to dashboard
    require __DIR__ . '/admin/dashboard.html';
    return true;
}

// ── SPA FALLBACK ──────────────────────────────────────────
require __DIR__ . '/index.html';
return true;
