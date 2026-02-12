<?php
/**
 * LINCA Dashboard - Applications API
 * Handles CRUD operations for loan applications
 * 
 * Endpoints:
 * GET    /applications.php              - Get all applications (with filters)
 * GET    /applications.php?id={id}      - Get single application
 * GET    /applications.php?search={name} - Search by debtor name
 * GET    /applications.php?export=csv   - Export to CSV
 * POST   /applications.php              - Create new application (auth required)
 * PUT    /applications.php?id={id}      - Update application (auth required)
 * DELETE /applications.php?id={id}      - Delete application (auth required)
 */

require_once 'db.php';

class ApplicationsApi {
    private $conn;
    private $table = 'applications';
    private $stagingTable = 'stagings';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Get all applications with optional filters
     */
    public function read($filters = []) {
        $query = "SELECT a.*, s.name AS staging FROM " . $this->table . " a 
                  LEFT JOIN " . $this->stagingTable . " s ON a.staging_id = s.id 
                  WHERE 1=1";
        $params = [];

        // Filter by staging (id or name)
        if (!empty($filters['staging_id'])) {
            $query .= " AND a.staging_id = :staging_id";
            $params[':staging_id'] = $filters['staging_id'];
        } elseif (!empty($filters['staging'])) {
            $query .= " AND s.name = :staging";
            $params[':staging'] = $filters['staging'];
        }

        // Filter by cabang
        if (!empty($filters['cabang'])) {
            $query .= " AND cabang LIKE :cabang";
            $params[':cabang'] = '%' . $filters['cabang'] . '%';
        }

        // Filter by sales
        if (!empty($filters['sales'])) {
            $query .= " AND sales LIKE :sales";
            $params[':sales'] = '%' . $filters['sales'] . '%';
        }

        // Filter by produk
        if (!empty($filters['produk'])) {
            $query .= " AND produk = :produk";
            $params[':produk'] = $filters['produk'];
        }

        // Filter by proyeksi_booking
        if (!empty($filters['proyeksi_booking'])) {
            $query .= " AND proyeksi_booking = :proyeksi_booking";
            $params[':proyeksi_booking'] = $filters['proyeksi_booking'];
        }

        // Filter by date range
        if (!empty($filters['date_from'])) {
            $query .= " AND proses_sistem >= :date_from";
            $params[':date_from'] = $filters['date_from'];
        }
        if (!empty($filters['date_to'])) {
            $query .= " AND proses_sistem <= :date_to";
            $params[':date_to'] = $filters['date_to'];
        }

        // Search by name
        if (!empty($filters['search'])) {
            $query .= " AND (nama_debitur LIKE :search OR no_aplikasi LIKE :search2)";
            $params[':search'] = '%' . $filters['search'] . '%';
            $params[':search2'] = '%' . $filters['search'] . '%';
        }

        $query .= " ORDER BY id DESC";

        // Pagination
        if (!empty($filters['limit'])) {
            $limit = (int)$filters['limit'];
            $offset = !empty($filters['offset']) ? (int)$filters['offset'] : 0;
            $query .= " LIMIT $limit OFFSET $offset";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    /**
     * Get single application by ID
     */
    public function readOne($id) {
        $query = "SELECT a.*, s.name AS staging FROM " . $this->table . " a 
                  LEFT JOIN " . $this->stagingTable . " s ON a.staging_id = s.id 
                  WHERE a.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch();
    }

    /**
     * Search applications by debtor name (public)
     */
    public function searchByName($name) {
        $query = "SELECT a.*, s.name AS staging FROM " . $this->table . " a 
                  LEFT JOIN " . $this->stagingTable . " s ON a.staging_id = s.id 
                  WHERE a.nama_debitur LIKE :name ORDER BY a.id DESC";
        $stmt = $this->conn->prepare($query);
        $searchTerm = '%' . $name . '%';
        $stmt->bindParam(':name', $searchTerm, PDO::PARAM_STR);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get statistics by staging
     */
    public function getStats() {
        $query = "SELECT 
            s.name AS staging,
            COUNT(*) as count,
            SUM(a.limit_apl) as total_limit_apl,
            SUM(a.limit_app) as total_limit_app
        FROM " . $this->table . " a 
        LEFT JOIN " . $this->stagingTable . " s ON a.staging_id = s.id
        GROUP BY s.name";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    /**
     * Get unique values for filters
     */
    public function getFilterOptions() {
        $options = [];
        
        // Get staging values
        $stmt = $this->conn->query("SELECT id, name FROM " . $this->stagingTable . " ORDER BY name");
        $options['staging'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get unique produk values
        $stmt = $this->conn->query("SELECT DISTINCT produk FROM " . $this->table . " WHERE produk IS NOT NULL ORDER BY produk");
        $options['produk'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get unique cabang values
        $stmt = $this->conn->query("SELECT DISTINCT cabang FROM " . $this->table . " WHERE cabang IS NOT NULL ORDER BY cabang");
        $options['cabang'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Get unique proyeksi_booking values
        $stmt = $this->conn->query("SELECT DISTINCT proyeksi_booking FROM " . $this->table . " WHERE proyeksi_booking IS NOT NULL ORDER BY proyeksi_booking");
        $options['proyeksi_booking'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        return $options;
    }

    /**
     * Get total count
     */
    public function getCount($filters = []) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table . " a 
                  LEFT JOIN " . $this->stagingTable . " s ON a.staging_id = s.id 
                  WHERE 1=1";
        $params = [];

        if (!empty($filters['staging_id'])) {
            $query .= " AND a.staging_id = :staging_id";
            $params[':staging_id'] = $filters['staging_id'];
        } elseif (!empty($filters['staging'])) {
            $query .= " AND s.name = :staging";
            $params[':staging'] = $filters['staging'];
        }
        if (!empty($filters['search'])) {
            $query .= " AND (a.nama_debitur LIKE :search OR a.no_aplikasi LIKE :search2)";
            $params[':search'] = '%' . $filters['search'] . '%';
            $params[':search2'] = '%' . $filters['search'] . '%';
        }

        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        $row = $stmt->fetch();
        
        return $row['total'];
    }

    /**
     * Create new application
     */
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " 
            (kocab, cabang, sales, no_aplikasi, nama_debitur, nama_perusahaan, 
             job_type, limit_apl, limit_app, staging_id, cek_slik_ideb, produk, program_marketing, proyek, 
             keterangan, proyeksi_booking, proses_sistem, wa_sales) 
            VALUES 
            (:kocab, :cabang, :sales, :no_aplikasi, :nama_debitur, :nama_perusahaan,
             :job_type, :limit_apl, :limit_app, :staging_id, :cek_slik_ideb, :produk, :program_marketing, :proyek,
             :keterangan, :proyeksi_booking, :proses_sistem, :wa_sales)";

        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':kocab', $data['kocab']);
        $stmt->bindParam(':cabang', $data['cabang']);
        $stmt->bindParam(':sales', $data['sales']);
        $stmt->bindParam(':no_aplikasi', $data['no_aplikasi']);
        $stmt->bindParam(':nama_debitur', $data['nama_debitur']);
        $stmt->bindParam(':nama_perusahaan', $data['nama_perusahaan']);
        $stmt->bindParam(':job_type', $data['job_type']);
        $stmt->bindParam(':limit_apl', $data['limit_apl']);
        $stmt->bindParam(':limit_app', $data['limit_app']);
        $stagingId = isset($data['staging_id']) ? $data['staging_id'] : null;
        $stmt->bindParam(':staging_id', $stagingId);
        $cekSlikIdeb = !empty($data['cek_slik_ideb']) ? 1 : 0;
        $stmt->bindParam(':cek_slik_ideb', $cekSlikIdeb, PDO::PARAM_INT);
        $stmt->bindParam(':produk', $data['produk']);
        $stmt->bindParam(':program_marketing', $data['program_marketing']);
        $stmt->bindParam(':proyek', $data['proyek']);
        $stmt->bindParam(':keterangan', $data['keterangan']);
        $stmt->bindParam(':proyeksi_booking', $data['proyeksi_booking']);
        $stmt->bindParam(':proses_sistem', $data['proses_sistem']);
        $stmt->bindParam(':wa_sales', $data['wa_sales']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    /**
     * Update existing application
     */
    public function update($id, $data) {
        $query = "UPDATE " . $this->table . " SET 
            kocab = :kocab, cabang = :cabang, sales = :sales,
            no_aplikasi = :no_aplikasi, nama_debitur = :nama_debitur, nama_perusahaan = :nama_perusahaan,
            job_type = :job_type, limit_apl = :limit_apl, limit_app = :limit_app, staging_id = :staging_id,
            cek_slik_ideb = :cek_slik_ideb, produk = :produk, program_marketing = :program_marketing, proyek = :proyek,
            keterangan = :keterangan, proyeksi_booking = :proyeksi_booking,
            proses_sistem = :proses_sistem, wa_sales = :wa_sales
            WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->bindParam(':kocab', $data['kocab']);
        $stmt->bindParam(':cabang', $data['cabang']);
        $stmt->bindParam(':sales', $data['sales']);
        $stmt->bindParam(':no_aplikasi', $data['no_aplikasi']);
        $stmt->bindParam(':nama_debitur', $data['nama_debitur']);
        $stmt->bindParam(':nama_perusahaan', $data['nama_perusahaan']);
        $stmt->bindParam(':job_type', $data['job_type']);
        $stmt->bindParam(':limit_apl', $data['limit_apl']);
        $stmt->bindParam(':limit_app', $data['limit_app']);
        $stagingId = isset($data['staging_id']) ? $data['staging_id'] : null;
        $stmt->bindParam(':staging_id', $stagingId);
        $cekSlikIdeb = !empty($data['cek_slik_ideb']) ? 1 : 0;
        $stmt->bindParam(':cek_slik_ideb', $cekSlikIdeb, PDO::PARAM_INT);
        $stmt->bindParam(':produk', $data['produk']);
        $stmt->bindParam(':program_marketing', $data['program_marketing']);
        $stmt->bindParam(':proyek', $data['proyek']);
        $stmt->bindParam(':keterangan', $data['keterangan']);
        $stmt->bindParam(':proyeksi_booking', $data['proyeksi_booking']);
        $stmt->bindParam(':proses_sistem', $data['proses_sistem']);
        $stmt->bindParam(':wa_sales', $data['wa_sales']);

        return $stmt->execute();
    }

    /**
     * Delete application
     */
    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    /**
     * Export data to CSV format
     */
    public function exportCSV($filters = []) {
        $data = $this->read($filters);
        
        if (empty($data)) {
            return '';
        }
        
        $output = fopen('php://temp', 'r+');
        
        // Headers
        fputcsv($output, array_keys($data[0]));
        
        // Data rows
        foreach ($data as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }
}

// ============================================
// API ROUTING
// ============================================

$database = new Database();
$db = $database->getConnection();
$api = new ApplicationsApi($db);

$method = $_SERVER['REQUEST_METHOD'];

// Require authentication for all admin endpoints
$authPayload = null;
if ($method !== 'OPTIONS') {
    $authPayload = require_auth();
}

try {
    switch ($method) {
        case 'GET':
            // Export to CSV
            if (isset($_GET['export']) && $_GET['export'] === 'csv') {
                $filters = [
                    'staging' => $_GET['staging'] ?? null,
                    'staging_id' => $_GET['staging_id'] ?? null,
                    'date_from' => $_GET['date_from'] ?? null,
                    'date_to' => $_GET['date_to'] ?? null,
                    'search' => $_GET['search'] ?? null
                ];
                $csv = $api->exportCSV($filters);
                
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="linca_export_' . date('Y-m-d') . '.csv"');
                echo $csv;
                exit();
            }
            
            // Get statistics
            if (isset($_GET['stats'])) {
                json_response($api->getStats());
            }
            
            // Get filter options
            if (isset($_GET['filters'])) {
                json_response($api->getFilterOptions());
            }
            
            // Get single record
            if (isset($_GET['id'])) {
                $result = $api->readOne($_GET['id']);
                if ($result) {
                    json_response($result);
                } else {
                    json_response(['message' => 'Application not found.'], 404);
                }
            }
            
            // Search by name
            if (isset($_GET['search'])) {
                $results = $api->searchByName($_GET['search']);
                json_response([
                    'data' => $results,
                    'count' => count($results)
                ]);
            }
            
            // Get all with filters
            $filters = [
                'staging' => $_GET['staging'] ?? null,
                'staging_id' => $_GET['staging_id'] ?? null,
                'cabang' => $_GET['cabang'] ?? null,
                'sales' => $_GET['sales'] ?? null,
                'produk' => $_GET['produk'] ?? null,
                'proyeksi_booking' => $_GET['proyeksi_booking'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
                'limit' => $_GET['limit'] ?? null,
                'offset' => $_GET['offset'] ?? null
            ];
            
            $results = $api->read($filters);
            $total = $api->getCount($filters);
            
            json_response([
                'data' => $results,
                'total' => $total,
                'limit' => $filters['limit'] ?? null,
                'offset' => $filters['offset'] ?? 0
            ]);
            break;

        case 'POST':
            if (($authPayload['role'] ?? 'admin') === 'view') {
                json_response(['message' => 'Insufficient permissions.'], 403);
            }
            $data = get_json_input();
            
            // Validate required fields
            if (empty($data['nama_debitur'])) {
                json_response(['message' => 'Nama debitur is required.'], 400);
            }
            
            $id = $api->create($data);
            if ($id) {
                $created = $api->readOne($id);
                json_response($created, 201);
            } else {
                json_response(['message' => 'Failed to create application.'], 500);
            }
            break;

        case 'PUT':
            if (($authPayload['role'] ?? 'admin') === 'view') {
                json_response(['message' => 'Insufficient permissions.'], 403);
            }
            
            if (!isset($_GET['id'])) {
                json_response(['message' => 'Application ID is required.'], 400);
            }
            
            $id = $_GET['id'];
            $data = get_json_input();
            
            // Check if exists
            if (!$api->readOne($id)) {
                json_response(['message' => 'Application not found.'], 404);
            }
            
            if ($api->update($id, $data)) {
                $updated = $api->readOne($id);
                json_response($updated);
            } else {
                json_response(['message' => 'Failed to update application.'], 500);
            }
            break;

        case 'DELETE':
            if (($authPayload['role'] ?? 'admin') === 'view') {
                json_response(['message' => 'Insufficient permissions.'], 403);
            }
            
            if (!isset($_GET['id'])) {
                json_response(['message' => 'Application ID is required.'], 400);
            }
            
            $id = $_GET['id'];
            
            // Check if exists
            if (!$api->readOne($id)) {
                json_response(['message' => 'Application not found.'], 404);
            }
            
            if ($api->delete($id)) {
                json_response(['message' => 'Application deleted successfully.']);
            } else {
                json_response(['message' => 'Failed to delete application.'], 500);
            }
            break;

        default:
            json_response(['message' => 'Method not allowed.'], 405);
    }
} catch (Exception $e) {
    json_response(['message' => 'Server error: ' . $e->getMessage()], 500);
}
