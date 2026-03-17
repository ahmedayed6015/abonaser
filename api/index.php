<?php
// api/index.php
// المحرك الأساسي للبيانات (API)

require_once __DIR__ . '/config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$pdo = get_db_connection();
$action = $_GET['action'] ?? '';

// إذا لم تكن القاعدة مربوطة، اسمح فقط بعملية الـ Setup
if (!$pdo && $action !== 'setup') {
    send_json(['error' => 'Database not configured'], 500);
}

switch ($action) {
    case 'setup':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) send_json(['error' => 'Invalid data'], 400);

        try {
            $dsn = "mysql:host={$data['host']};charset=utf8mb4";
            $temp_pdo = new PDO($dsn, $data['user'], $data['password']);
            
            // إنشاء القاعدة إذا لم توجد
            $temp_pdo->exec("CREATE DATABASE IF NOT EXISTS `{$data['database']}`");
            $temp_pdo->exec("USE `{$data['database']}`");

            // إنشاء الجداول
            $temp_pdo->exec("
                CREATE TABLE IF NOT EXISTS pages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    slug VARCHAR(255) UNIQUE NOT NULL,
                    target_url TEXT NOT NULL,
                    title VARCHAR(255),
                    description TEXT,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS visits (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    page_id INT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    referer TEXT,
                    country VARCHAR(100),
                    city VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS settings (
                    `key` VARCHAR(50) PRIMARY KEY,
                    `value` TEXT
                );
                INSERT IGNORE INTO settings (`key`, `value`) VALUES ('admin_password', 'admin123');
            ");

            // حفظ الإعدادات
            file_put_contents(__DIR__ . '/../db-config.json', json_encode($data));
            send_json(['success' => true]);
        } catch (PDOException $e) {
            send_json(['error' => $e->getMessage()], 500);
        }
        break;

    case 'get_pages':
        $stmt = $pdo->query("SELECT p.*, COUNT(v.id) as visits_count FROM pages p LEFT JOIN visits v ON p.id = v.page_id GROUP BY p.id ORDER BY p.created_at DESC");
        send_json($stmt->fetchAll());
        break;

    case 'create_page':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO pages (slug, target_url, title, description) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['slug'], $data['target_url'], $data['title'] ?? '', $data['description'] ?? '']);
        send_json(['success' => true]);
        break;

    case 'delete_page':
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM pages WHERE id = ?");
        $stmt->execute([$id]);
        send_json(['success' => true]);
        break;

    case 'get_stats':
        $total_pages = $pdo->query("SELECT COUNT(*) FROM pages")->fetchColumn();
        $total_visits = $pdo->query("SELECT COUNT(*) FROM visits")->fetchColumn();
        $recent_visits = $pdo->query("SELECT v.*, p.slug FROM visits v JOIN pages p ON v.page_id = p.id ORDER BY v.created_at DESC LIMIT 10")->fetchAll();
        send_json([
            'total_pages' => (int)$total_pages,
            'total_visits' => (int)$total_visits,
            'recent_visits' => $recent_visits
        ]);
        break;

    default:
        send_json(['error' => 'Action not found'], 404);
}
?>
