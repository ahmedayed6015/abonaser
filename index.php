<?php
// index.php
// المحرك المسؤول عن التحويل (Redirection)

require_once __DIR__ . '/api/config.php';

$pdo = get_db_connection();
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']);
$path = str_replace($base_path, '', $request_uri);
$path = trim($path, '/');

// إذا كان المسار فارغاً أو يطلب صفحة التسطيب/الأدمن، اترك الأمر للـ React (سيتم تحميله لاحقاً)
if (empty($path) || $path === 'setup' || strpos($path, 'adminahmed') === 0) {
    // تحميل واجهة الـ React (ملف index.html الذي سينتج من الـ build)
    if (file_exists(__DIR__ . '/dist/index.html')) {
        echo file_get_contents(__DIR__ . '/dist/index.html');
    } else {
        echo "<h1>Welcome to Redirection System</h1><p>Please upload the 'dist' folder.</p>";
    }
    exit;
}

// البحث عن الرابط المختصر في القاعدة
if ($pdo) {
    $stmt = $pdo->prepare("SELECT * FROM pages WHERE slug = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$path]);
    $page = $stmt->fetch();

    if ($page) {
        // تسجيل الزيارة
        $stmt = $pdo->prepare("INSERT INTO visits (page_id, ip_address, user_agent, referer) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $page['id'],
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_USER_AGENT'] ?? '',
            $_SERVER['HTTP_REFERER'] ?? ''
        ]);

        // التحويل
        header("Location: " . $page['target_url']);
        exit;
    }
}

// إذا لم يجد الرابط، حول للرئيسية أو اظهر 404
header("HTTP/1.0 404 Not Found");
echo "<h1>404 - Page Not Found</h1>";
?>
