<?php
ini_set('display_errors', 0); error_reporting(0);
require_once 'config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// POST /api/auth.php — login
if ($method === 'POST') {
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $email    = trim($body['email']    ?? '');
    $password = trim($body['password'] ?? '');

    if (!$email || !$password) errorResponse('Email and password required');

    $stmt = $db->prepare("SELECT * FROM admin WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password'])) {
        errorResponse('Invalid credentials', 401);
    }

    jsonResponse(['token' => generateToken($user['id']), 'email' => $user['email']]);
}

// PUT /api/auth.php — change email and/or password (admin only)
if ($method === 'PUT') {
    requireAuth();
    $body        = json_decode(file_get_contents('php://input'), true) ?? [];
    $newEmail    = trim($body['email']        ?? '');
    $newPassword = trim($body['new_password'] ?? '');
    $current     = trim($body['current_password'] ?? '');

    $admin = $db->query("SELECT * FROM admin LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if (!$admin) errorResponse('Admin not found', 404);

    if (!password_verify($current, $admin['password'])) {
        errorResponse('Current password is incorrect', 403);
    }

    $fields = [];
    $params = [];

    if ($newEmail) {
        $fields[] = 'email = ?';
        $params[]  = $newEmail;
    }
    if ($newPassword) {
        if (strlen($newPassword) < 6) errorResponse('New password must be at least 6 characters');
        $fields[] = 'password = ?';
        $params[]  = password_hash($newPassword, PASSWORD_BCRYPT);
    }

    if (!$fields) errorResponse('Nothing to update');

    $fields[]  = 'updated_at = CURRENT_TIMESTAMP';
    $params[]  = $admin['id'];
    $db->prepare("UPDATE admin SET " . implode(', ', $fields) . " WHERE id = ?")
       ->execute($params);

    jsonResponse(['message' => 'Credentials updated successfully']);
}

errorResponse('Method not allowed', 405);
