<?php
/**
 * LINCA Dashboard - Database Connection
 * Database: vade3664_linca
 */

// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', '');
define('DB_USER', '');
define('DB_PASS', '');

// JWT Secret (change this to a secure random string)
define('JWT_SECRET', '');
define('JWT_TTL', 86400); // 24 hours

/**
 * Database Connection Class
 */
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8mb4");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            http_response_code(503);
            echo json_encode(["message" => "Database connection failed."]);
            exit();
        }
        return $this->conn;
    }
}

/**
 * Generate JWT Token
 */
function generate_token($userId, $username, $role = 'admin', $ttlSeconds = JWT_TTL) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    $payload = base64_encode(json_encode([
        'sub' => $userId,
        'username' => $username,
        'role' => $role,
        'iat' => time(),
        'exp' => time() + $ttlSeconds
    ]));
    $signature = hash_hmac('sha256', "$header.$payload", JWT_SECRET);
    return "$header.$payload.$signature";
}

/**
 * Verify JWT Token
 */
function verify_token($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    $expectedSignature = hash_hmac('sha256', "$header.$payload", JWT_SECRET);
    
    if (!hash_equals($expectedSignature, $signature)) {
        return false;
    }
    
    $payloadData = json_decode(base64_decode($payload), true);
    
    if (!$payloadData || !isset($payloadData['exp'])) {
        return false;
    }
    
    if ($payloadData['exp'] < time()) {
        return false;
    }
    
    return $payloadData;
}

/**
 * Get Bearer Token from Authorization Header
 */
function get_bearer_token() {
    $headers = null;
    
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    if (!empty($headers) && preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
        return $matches[1];
    }
    
    return null;
}

/**
 * Require Authentication Middleware
 * Returns payload if authenticated, sends 401 and exits if not
 */
function require_auth() {
    $token = get_bearer_token();
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(["message" => "Authorization token required."]);
        exit();
    }
    
    $payload = verify_token($token);
    
    if (!$payload) {
        http_response_code(401);
        echo json_encode(["message" => "Invalid or expired token."]);
        exit();
    }
    
    if (empty($payload['role'])) {
        $payload['role'] = 'admin';
    }
    
    return $payload;
}

/**
 * Require write access (non-view role)
 */
function require_write_access() {
    $payload = require_auth();
    
    if (($payload['role'] ?? 'admin') === 'view') {
        http_response_code(403);
        echo json_encode(["message" => "Insufficient permissions."]);
        exit();
    }
    
    return $payload;
}

/**
 * Send JSON Response
 */
function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Get JSON Input
 */
function get_json_input() {
    $input = file_get_contents("php://input");
    return json_decode($input, true) ?? [];
}
