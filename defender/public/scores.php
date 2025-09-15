<?php
// public/scores.php — JSON API met SQLite: GET (laatste/top 3), POST (nieuwe score)
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$dbPath = __DIR__ . '/../storage/scores.sqlite';
$dsn = 'sqlite:' . $dbPath;

try {
  $pdo = new PDO($dsn, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  $pdo->exec('PRAGMA journal_mode = WAL;');
  $pdo->exec('PRAGMA foreign_keys = ON;');
  $pdo->exec("
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  ");
  $pdo->exec("CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at);");
  $pdo->exec("CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score);");
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'DB init failed', 'detail' => $e->getMessage()]);
  exit;
}

function jsonOut($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}
function readJson(): array {
  $raw = file_get_contents('php://input');
  $json = json_decode($raw ?? '', true);
  return is_array($json) ? $json : [];
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $limit = 3;
  if (isset($_GET['limit'])) {
    $lim = (int)$_GET['limit'];
    if ($lim > 0 && $lim <= 50) { $limit = $lim; }
  }
  $sort = $_GET['sort'] ?? 'latest'; // 'latest' of 'top'
  if ($sort === 'top') {
    $stmt = $pdo->prepare("
      SELECT name, score, created_at
      FROM scores
      ORDER BY score DESC, datetime(created_at) DESC
      LIMIT :limit
    ");
  } else {
    $stmt = $pdo->prepare("
      SELECT name, score, created_at
      FROM scores
      ORDER BY datetime(created_at) DESC
      LIMIT :limit
    ");
  }
  $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
  $stmt->execute();
  jsonOut(['ok' => true, 'rows' => $stmt->fetchAll()]);
}

if ($method === 'POST') {
  $b = readJson();
  $name  = isset($b['name']) ? trim((string)$b['name']) : '';
  $score = isset($b['score']) ? (int)$b['score'] : -1;

  if ($name === '' || mb_strlen($name) > 24) jsonOut(['ok' => false, 'error' => 'Invalid name'], 400);
  if ($score < 0 || $score > 100000000) jsonOut(['ok' => false, 'error' => 'Invalid score'], 400);

  try {
    $stmt = $pdo->prepare("INSERT INTO scores (name, score) VALUES (:name, :score)");
    $stmt->execute([':name' => $name, ':score' => $score]);
    jsonOut(['ok' => true]);
  } catch (Throwable $e) {
    jsonOut(['ok' => false, 'error' => 'Insert failed', 'detail' => $e->getMessage()], 500);
  }
}

jsonOut(['ok' => false, 'error' => 'Method not allowed'], 405);
