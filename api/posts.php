<?php
ini_set('display_errors', 0); error_reporting(0);
require_once __DIR__ . '/config.php';

try {


$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// GET — public
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
        $stmt->execute([$id]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$post) errorResponse('Not found', 404);
        jsonResponse($post);
    }
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = 10;
    $offset = ($page - 1) * $limit;
    $total  = $db->query("SELECT COUNT(*) FROM posts")->fetchColumn();
    $stmt   = $db->prepare("SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute([$limit, $offset]);
    jsonResponse([
        'posts' => $stmt->fetchAll(PDO::FETCH_ASSOC),
        'total' => (int)$total,
        'page'  => $page,
        'pages' => (int)ceil($total / $limit)
    ]);
}

// POST — admin only
if ($method === 'POST') {
    requireAuth();
    $content = trim($_POST['content'] ?? '');
    if (!$content) errorResponse('Content is required');

    $image = '';
    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $saved = saveUpload($_FILES['image'], UPLOAD_POSTS, 'post');
        if ($saved) $image = $saved;
    }

    $db->prepare("INSERT INTO posts (content, image) VALUES (?, ?)")
       ->execute([$content, $image]);
    $newId = $db->lastInsertId();

    $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$newId]);
    jsonResponse($stmt->fetch(PDO::FETCH_ASSOC), 201);
}

// PUT — admin only (edit post)
if ($method === 'PUT') {
    requireAuth();
    if (!$id) errorResponse('ID required');

    $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$id]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$post) errorResponse('Not found', 404);

    $content = trim($_POST['content'] ?? $post['content']);
    $image   = $post['image'];

    if (!empty($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $saved = saveUpload($_FILES['image'], UPLOAD_POSTS, 'post');
        if ($saved) {
            if ($image && file_exists(UPLOAD_POSTS . $image)) unlink(UPLOAD_POSTS . $image);
            $image = $saved;
        }
    }

    $db->prepare("UPDATE posts SET content=?, image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
       ->execute([$content, $image, $id]);

    $stmt->execute([$id]);
    jsonResponse($stmt->fetch(PDO::FETCH_ASSOC));
}

// DELETE — admin only
if ($method === 'DELETE') {
    requireAuth();
    if (!$id) errorResponse('ID required');
    $stmt = $db->prepare("SELECT image FROM posts WHERE id = ?");
    $stmt->execute([$id]);
    $post = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$post) errorResponse('Not found', 404);
    if ($post['image'] && file_exists(UPLOAD_POSTS . $post['image'])) unlink(UPLOAD_POSTS . $post['image']);
    $db->prepare("DELETE FROM posts WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Deleted']);
}

errorResponse('Method not allowed', 405);

} catch (Throwable $e) {
    errorResponse('Server error: ' . $e->getMessage(), 500);
}
