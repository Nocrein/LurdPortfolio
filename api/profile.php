<?php
ini_set('display_errors', 0); error_reporting(0);
require_once 'config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $profile = $db->query("SELECT * FROM profile LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $skills  = $db->query("SELECT * FROM skills ORDER BY category, sort_order, name")->fetchAll(PDO::FETCH_ASSOC);
    jsonResponse(['profile' => $profile, 'skills' => $skills]);
}

if ($method === 'POST') {
    requireAuth();

    $current = $db->query("SELECT * FROM profile LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    $avatar  = $current['avatar'] ?? '';

    if (!empty($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $saved = saveUpload($_FILES['avatar'], UPLOAD_AVATAR, 'avatar');
        if ($saved) {
            if ($avatar && file_exists(UPLOAD_AVATAR . $avatar)) unlink(UPLOAD_AVATAR . $avatar);
            $avatar = $saved;
        }
    }

    $fields = ['name','tagline','bio','location','resume_url','github','linkedin','twitter','website'];
    $vals   = [];
    foreach ($fields as $f) {
        $vals[$f] = trim($_POST[$f] ?? $current[$f] ?? '');
    }
    $vals['avatar'] = $avatar;

    if ($current) {
        $db->prepare("UPDATE profile SET name=?,tagline=?,bio=?,location=?,avatar=?,resume_url=?,github=?,linkedin=?,twitter=?,website=?,updated_at=CURRENT_TIMESTAMP WHERE id=?")
           ->execute([$vals['name'],$vals['tagline'],$vals['bio'],$vals['location'],$vals['avatar'],$vals['resume_url'],$vals['github'],$vals['linkedin'],$vals['twitter'],$vals['website'],$current['id']]);
    }

    jsonResponse(['message' => 'Profile updated', 'avatar' => $avatar]);
}

errorResponse('Method not allowed', 405);
