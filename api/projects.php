<?php
ini_set('display_errors', 0); error_reporting(0);
require_once 'config.php';

try {


$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM projects WHERE id=?");
        $stmt->execute([$id]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$p) errorResponse('Not found', 404);
        jsonResponse($p);
    }
    $projects = $db->query("SELECT * FROM projects ORDER BY featured DESC, sort_order, created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse($projects);
}

if ($method === 'POST') {
    requireAuth();
    $title    = trim($_POST['title']       ?? '');
    $desc     = trim($_POST['description'] ?? '');
    $tech     = trim($_POST['tech']        ?? '');
    $live     = trim($_POST['live_url']    ?? '');
    $gh       = trim($_POST['github_url']  ?? '');
    $featured = (int)($_POST['featured']   ?? 0);
    if (!$title) errorResponse('Title required');

    $image = '';
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $saved = saveUpload($_FILES['image'], UPLOAD_PROJ, 'proj');
        if ($saved) $image = $saved;
    }

    $db->prepare("INSERT INTO projects (title,description,tech,image,live_url,github_url,featured) VALUES (?,?,?,?,?,?,?)")
       ->execute([$title,$desc,$tech,$image,$live,$gh,$featured]);
    jsonResponse(['id' => $db->lastInsertId(), 'message' => 'Project added'], 201);
}

if ($method === 'PUT') {
    requireAuth();
    if (!$id) errorResponse('ID required');
    $stmt = $db->prepare("SELECT * FROM projects WHERE id=?");
    $stmt->execute([$id]);
    $proj = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$proj) errorResponse('Not found', 404);

    $title    = trim($_POST['title']       ?? $proj['title']);
    $desc     = trim($_POST['description'] ?? $proj['description']);
    $tech     = trim($_POST['tech']        ?? $proj['tech']);
    $live     = trim($_POST['live_url']    ?? $proj['live_url']);
    $gh       = trim($_POST['github_url']  ?? $proj['github_url']);
    $featured = isset($_POST['featured']) ? (int)$_POST['featured'] : $proj['featured'];
    $image    = $proj['image'];

    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $saved = saveUpload($_FILES['image'], UPLOAD_PROJ, 'proj');
        if ($saved) {
            if ($image && file_exists(UPLOAD_PROJ . $image)) unlink(UPLOAD_PROJ . $image);
            $image = $saved;
        }
    }

    $db->prepare("UPDATE projects SET title=?,description=?,tech=?,image=?,live_url=?,github_url=?,featured=? WHERE id=?")
       ->execute([$title,$desc,$tech,$image,$live,$gh,$featured,$id]);
    jsonResponse(['message' => 'Updated']);
}

if ($method === 'DELETE') {
    requireAuth();
    if (!$id) errorResponse('ID required');
    $stmt = $db->prepare("SELECT image FROM projects WHERE id=?");
    $stmt->execute([$id]);
    $proj = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($proj && $proj['image'] && file_exists(UPLOAD_PROJ . $proj['image'])) unlink(UPLOAD_PROJ . $proj['image']);
    $db->prepare("DELETE FROM projects WHERE id=?")->execute([$id]);
    jsonResponse(['message' => 'Deleted']);
}

errorResponse('Method not allowed', 405);

} catch (Throwable $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
