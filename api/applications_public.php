<?php
/**
 * LINCA Dashboard - Public Applications Search API
 * Public endpoint for searching applications by name only
 * 
 * Endpoints:
 * GET /applications_public.php?search={name}
 */

require_once 'db.php';

class ApplicationsPublicApi {
    private $conn;
    private $table = 'applications';
    private $stagingTable = 'stagings';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Search applications by debtor name (public)
     * Returns limited fields only
     */
    public function searchByName($name, $limit = 50) {
        $query = "SELECT 
            a.id,
            a.no_aplikasi,
            a.nama_debitur,
            a.cabang,
            a.sales,
            s.name AS staging,
            a.cek_slik_ideb,
            a.produk,
            a.proyek,
            a.program_marketing,
            a.keterangan,
            a.proyeksi_booking,
            a.proses_sistem,
            a.wa_sales
        FROM " . $this->table . " a
        LEFT JOIN " . $this->stagingTable . " s ON a.staging_id = s.id
        WHERE a.nama_debitur LIKE :name 
        ORDER BY a.id DESC 
        LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $searchTerm = '%' . $name . '%';
        $stmt->bindParam(':name', $searchTerm, PDO::PARAM_STR);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}

// ============================================
// API ROUTING
// ============================================

$database = new Database();
$db = $database->getConnection();
$api = new ApplicationsPublicApi($db);

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method !== 'GET') {
        json_response(['message' => 'Method not allowed.'], 405);
    }

    // Search is required
    if (!isset($_GET['search']) || trim($_GET['search']) === '') {
        json_response(['message' => 'Search parameter is required.'], 400);
    }

    $search = trim($_GET['search']);

    // Minimum search length to prevent full table scans
    if (mb_strlen($search) < 2) {
        json_response(['message' => 'Search must be at least 2 characters.'], 400);
    }

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    if ($limit > 100) {
        $limit = 100;
    }

    $results = $api->searchByName($search, $limit);

    json_response([
        'data' => $results,
        'count' => count($results)
    ]);

} catch (Exception $e) {
    json_response(['message' => 'Server error: ' . $e->getMessage()], 500);
}
