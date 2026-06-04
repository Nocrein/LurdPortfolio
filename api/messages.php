<?php
ini_set('display_errors', 0); error_reporting(0);
require_once 'config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $name    = trim($body['name']    ?? '');
    $email   = trim($body['email']   ?? '');
    $message = trim($body['message'] ?? '');

    if (!$name || !$email || !$message) errorResponse('All fields required');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) errorResponse('Invalid email');

    $db->prepare("INSERT INTO messages (name, email, message) VALUES (?,?,?)")
       ->execute([$name, $email, $message]);
    jsonResponse(['message' => 'Message sent!'], 201);
}

if ($method === 'GET') {
    requireAuth();
    $msgs = $db->query("SELECT * FROM messages ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    $unread = $db->query("SELECT COUNT(*) FROM messages WHERE is_read=0")->fetchColumn();
    jsonResponse(['messages' => $msgs, 'unread' => (int)$unread]);
}

if ($method === 'PATCH') {
    requireAuth();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) errorResponse('ID required');
    $db->prepare("UPDATE messages SET is_read=1 WHERE id=?")->execute([$id]);
    jsonResponse(['message' => 'Marked read']);
}

if ($method === 'DELETE') {
    requireAuth();
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) errorResponse('ID required');
    $db->prepare("DELETE FROM messages WHERE id=?")->execute([$id]);
    jsonResponse(['message' => 'Deleted']);
}

errorResponse('Method not allowed', 405);
