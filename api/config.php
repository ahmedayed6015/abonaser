<?php
// api/config.php
// ملف إعدادات قاعدة البيانات

$config_file = __DIR__ . '/../db-config.json';

function get_db_connection() {
    global $config_file;
    if (!file_exists($config_file)) {
        return null;
    }

    $config = json_decode(file_get_contents($config_file), true);
    if (!$config) return null;

    try {
        $dsn = "mysql:host={$config['host']};dbname={$config['database']};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, $config['user'], $config['password'], $options);
    } catch (PDOException $e) {
        return null;
    }
}

function send_json($data, $status = 200) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit;
}
?>
