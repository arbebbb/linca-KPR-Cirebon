<?php
/**
 * LINCA Dashboard - Admin API
 * Handles admin authentication and management
 * 
 * Endpoints:
 * POST /admin.php?action=login    - Login and get token
 * POST /admin.php?action=register - Create new admin (auth required)
 * PUT  /admin.php?action=password - Change password (auth required)
 * GET  /admin.php?action=verify   - Verify token validity
 */

require_once 'db.php';

class AdminApi {
    private $conn;
    private $table = 'admins';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Login admin
     */
    public function login($username, $password) {
        $query = "SELECT id, username, password_hash, role FROM " . $this->table . " WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        $admin = $stmt->fetch();

        if (!$admin) {
            return ['success' => false, 'message' => 'Invalid username or password.'];
        }

        if (!password_verify($password, $admin['password_hash'])) {
            return ['success' => false, 'message' => 'Invalid username or password.'];
        }

        $role = $admin['role'] ?? 'admin';
        $token = generate_token($admin['id'], $admin['username'], $role);

        return [
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $admin['id'],
                'username' => $admin['username'],
                'role' => $role
            ]
        ];
    }

    /**
     * Create new admin
     */
    public function create($username, $password, $role = 'admin') {
        // Check if username already exists
        $query = "SELECT id FROM " . $this->table . " WHERE username = :username LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        if ($stmt->fetch()) {
            return ['success' => false, 'message' => 'Username already exists.'];
        }

        // Create admin
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $query = "INSERT INTO " . $this->table . " (username, password_hash, role) VALUES (:username, :password_hash, :role)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password_hash', $passwordHash);
        $stmt->bindParam(':role', $role);

        if ($stmt->execute()) {
            return [
                'success' => true,
                'message' => 'Admin created successfully.',
                'id' => $this->conn->lastInsertId()
            ];
        }

        return ['success' => false, 'message' => 'Failed to create admin.'];
    }

    /**
     * Change admin password
     */
    public function changePassword($adminId, $oldPassword, $newPassword) {
        // Get current password
        $query = "SELECT password_hash FROM " . $this->table . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $adminId, PDO::PARAM_INT);
        $stmt->execute();

        $admin = $stmt->fetch();

        if (!$admin) {
            return ['success' => false, 'message' => 'Admin not found.'];
        }

        if (!password_verify($oldPassword, $admin['password_hash'])) {
            return ['success' => false, 'message' => 'Current password is incorrect.'];
        }

        // Update password
        $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $query = "UPDATE " . $this->table . " SET password_hash = :password_hash WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':password_hash', $newPasswordHash);
        $stmt->bindParam(':id', $adminId, PDO::PARAM_INT);

        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Password changed successfully.'];
        }

        return ['success' => false, 'message' => 'Failed to change password.'];
    }
}

// ============================================
// API ROUTING
// ============================================

$database = new Database();
$db = $database->getConnection();
$api = new AdminApi($db);

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($method) {
        case 'GET':
            // Verify token
            if ($action === 'verify') {
                $payload = require_auth();
                json_response([
                    'valid' => true,
                    'user' => [
                        'id' => $payload['sub'],
                        'username' => $payload['username'],
                        'role' => $payload['role'] ?? 'admin'
                    ]
                ]);
            }
            
            json_response(['message' => 'Invalid action.'], 400);
            break;

        case 'POST':
            $data = get_json_input();

            // Login
            if ($action === 'login') {
                if (empty($data['username']) || empty($data['password'])) {
                    json_response(['message' => 'Username and password are required.'], 400);
                }

                $result = $api->login($data['username'], $data['password']);
                
                if ($result['success']) {
                    json_response([
                        'token' => $result['token'],
                        'user' => $result['user']
                    ]);
                } else {
                    json_response(['message' => $result['message']], 401);
                }
            }

            // Register new admin
            if ($action === 'register') {
                $payload = require_auth();

                if (empty($data['username']) || empty($data['password'])) {
                    json_response(['message' => 'Username and password are required.'], 400);
                }

                if (strlen($data['password']) < 6) {
                    json_response(['message' => 'Password must be at least 6 characters.'], 400);
                }

                $role = $data['role'] ?? 'admin';
                if (!in_array($role, ['admin', 'view'], true)) {
                    json_response(['message' => 'Invalid role.'], 400);
                }
                if (($payload['role'] ?? 'admin') !== 'admin') {
                    json_response(['message' => 'Insufficient permissions.'], 403);
                }

                $result = $api->create($data['username'], $data['password'], $role);
                
                if ($result['success']) {
                    json_response([
                        'message' => $result['message'],
                        'id' => $result['id']
                    ], 201);
                } else {
                    json_response(['message' => $result['message']], 400);
                }
            }

            json_response(['message' => 'Invalid action.'], 400);
            break;

        case 'PUT':
            require_auth();
            $data = get_json_input();

            // Change password
            if ($action === 'password') {
                $payload = require_auth();

                if (empty($data['old_password']) || empty($data['new_password'])) {
                    json_response(['message' => 'Old password and new password are required.'], 400);
                }

                if (strlen($data['new_password']) < 6) {
                    json_response(['message' => 'New password must be at least 6 characters.'], 400);
                }

                $result = $api->changePassword($payload['sub'], $data['old_password'], $data['new_password']);
                
                if ($result['success']) {
                    json_response(['message' => $result['message']]);
                } else {
                    json_response(['message' => $result['message']], 400);
                }
            }

            json_response(['message' => 'Invalid action.'], 400);
            break;

        default:
            json_response(['message' => 'Method not allowed.'], 405);
    }
} catch (Exception $e) {
    json_response(['message' => 'Server error: ' . $e->getMessage()], 500);
}
