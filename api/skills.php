<?php
ini_set('display_errors', 0); error_reporting(0);
require_once 'config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    $skills = $db->query("SELECT * FROM skills ORDER BY category, sort_order, name")->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse($skills);
}

if ($method === 'POST') {
    requireAuth();
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $name     = trim($body['name']     ?? '');
    $category = trim($body['category'] ?? 'General');
    $level    = max(0, min(100, (int)($body['level'] ?? 80)));
    if (!$name) errorResponse('Name required');
    $db->prepare("INSERT INTO skills (name, category, level) VALUES (?,?,?)")->execute([$name,$category,$level]);
    jsonResponse(['id' => $db->lastInsertId(), 'message' => 'Skill added'], 201);
}

if ($method === 'PUT') {
    requireAuth();
    if (!$id) errorResponse('ID required');
    $body     = json_decode(file_get_contents('php://input'), true) ?? [];
    $name     = trim($body['name']     ?? '');
    $category = trim($body['category'] ?? 'General');
    $level    = max(0, min(100, (int)($body['level'] ?? 80)));
    if (!$name) errorResponse('Name required');
    $db->prepare("UPDATE skills SET name=?,category=?,level=? WHERE id=?")->execute([$name,$category,$level,$id]);
    jsonResponse(['message' => 'Updated']);
}

if ($method === 'DELETE') {
    requireAuth();
    if (!$id) errorResponse('ID required');
    $db->prepare("DELETE FROM skills WHERE id=?")->execute([$id]);
    jsonResponse(['message' => 'Deleted']);
}

errorResponse('Method not allowed', 405);
