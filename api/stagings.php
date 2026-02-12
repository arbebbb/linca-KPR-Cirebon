<?php
/**
 * LINCA Dashboard - Stagings API
 * CRUD for staging master data (admin only)
 * 
 * Endpoints:
 * GET    /stagings.php          - Get all stagings
 * POST   /stagings.php          - Create staging
 * PUT    /stagings.php?id={id}  - Update staging
 * DELETE /stagings.php?id={id}  - Delete staging
 */

require_once 'db.php';

class StagingsApi {
    private $conn;
    private $table = 'stagings';

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT id, name, description, created_at FROM " . $this->table . " ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function readOne($id) {
        $query = "SELECT id, name, description, created_at FROM " . $this->table . " WHERE id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . " (name, description) VALUES (:name, :description)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $data['description']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table . " SET name = :name, description = :description WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $data['name']);
        $stmt->bindParam(':description', $data['description']);
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}

// ============================================
// API ROUTING
// ============================================

$database = new Database();
$db = $database->getConnection();
$api = new StagingsApi($db);

$method = $_SERVER['REQUEST_METHOD'];

$authPayload = null;
if ($method !== 'OPTIONS') {
    $authPayload = require_auth();
}

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $result = $api->readOne($_GET['id']);
                if ($result) {
                    json_response($result);
                } else {
                    json_response(['message' => 'Staging not found.'], 404);
                }
            }
            
            json_response($api->read());
            break;

        case 'POST':
            if (($authPayload['role'] ?? 'admin') === 'view') {
                json_response(['message' => 'Insufficient permissions.'], 403);
            }
            $data = get_json_input();

            if (empty($data['name'])) {
                json_response(['message' => 'Name is required.'], 400);
            }

            $data['description'] = $data['description'] ?? null;

            $id = $api->create($data);
            if ($id) {
                $created = $api->readOne($id);
                json_response($created, 201);
            } else {
                json_response(['message' => 'Failed to create staging.'], 500);
            }
            break;

        case 'PUT':
            if (($authPayload['role'] ?? 'admin') === 'view') {
                json_response(['message' => 'Insufficient permissions.'], 403);
            }
            if (!isset($_GET['id'])) {
                json_response(['message' => 'Staging ID is required.'], 400);
            }

            $data = get_json_input();

            if (empty($data['name'])) {
                json_response(['message' => 'Name is required.'], 400);
            }

            $data['description'] = $data['description'] ?? null;

            if (!$api->readOne($_GET['id'])) {
                json_response(['message' => 'Staging not found.'], 404);
            }

            if ($api->update($_GET['id'], $data)) {
                $updated = $api->readOne($_GET['id']);
                json_response($updated);
            } else {
                json_response(['message' => 'Failed to update staging.'], 500);
            }
            break;

        case 'DELETE':
            if (($authPayload['role'] ?? 'admin') === 'view') {
                json_response(['message' => 'Insufficient permissions.'], 403);
            }
            if (!isset($_GET['id'])) {
                json_response(['message' => 'Staging ID is required.'], 400);
            }

            if (!$api->readOne($_GET['id'])) {
                json_response(['message' => 'Staging not found.'], 404);
            }

            if ($api->delete($_GET['id'])) {
                json_response(['message' => 'Staging deleted successfully.']);
            } else {
                json_response(['message' => 'Failed to delete staging.'], 500);
            }
            break;

        default:
            json_response(['message' => 'Method not allowed.'], 405);
    }
} catch (Exception $e) {
    json_response(['message' => 'Server error: ' . $e->getMessage()], 500);
}
