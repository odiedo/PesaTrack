<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Database connection settings
$db_config = [
    'user' => 'root',
    'password' => '',
    'host' => 'localhost',
    'database' => 'pesatrack'
];

function get_db_connection() {
    global $db_config;
    $connection = new mysqli($db_config['host'], $db_config['user'], $db_config['password'], $db_config['database']);
    if ($connection->connect_error) {
        die(json_encode(['error' => 'Database connection failed: ' . $connection->connect_error]));
    }
    return $connection;
}

function decimal_to_float($data) {
    if (is_array($data)) {
        return array_map('decimal_to_float', $data);
    } elseif (is_object($data)) {
        foreach ($data as $key => $value) {
            $data->$key = decimal_to_float($value);
        }
        return $data;
    } elseif (is_numeric($data)) {
        return floatval($data);
    }
    return $data;
}

function generate_customer_number() {
    // customer number uniqid function
    return uniqid();
}

// Endpoint to sync products
if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/sync-products') {
    try {
        $connection = get_db_connection();
        $result = $connection->query("SELECT * FROM products");
        $products = $result->fetch_all(MYSQLI_ASSOC);

        $products = decimal_to_float($products);

        $json_file_path = __DIR__ . '/products.json';
        file_put_contents($json_file_path, json_encode(['products' => $products], JSON_PRETTY_PRINT));

        echo json_encode(['message' => 'Products synced successfully!']);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Unexpected error: ' . $e->getMessage()]);
    }
}

// Endpoint to get products JSON
if ($_SERVER['REQUEST_METHOD'] == 'GET' && $_SERVER['REQUEST_URI'] == '/products-json') {
    try {
        $json_file_path = __DIR__ . '/products.json';
        if (!file_exists($json_file_path)) {
            http_response_code(404);
            echo json_encode(['error' => 'JSON file not found']);
            exit();
        }

        $data = json_decode(file_get_contents($json_file_path), true);
        echo json_encode($data);
    } catch (Exception $e) {
        echo json_encode(['error' => 'Unexpected error: ' . $e->getMessage()]);
    }
}

// Endpoint to sign up a new user
if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/sign-up') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['name'], $data['id_number'], $data['phone'], $data['email'], $data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    $name = $data['name'];
    $id_number = $data['id_number'];
    $phone = $data['phone'];
    $email = $data['email'];
    $password = $data['password'];

    try {
        $connection = get_db_connection();

        $stmt = $connection->prepare("SELECT id FROM shop_tellers WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already in use']);
            exit();
        }

        $hashed_password = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $connection->prepare("INSERT INTO shop_tellers (name, id_number, phone, email, password) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param('sssss', $name, $id_number, $phone, $email, $hashed_password);
        $stmt->execute();

        echo json_encode(['message' => 'Sign-up successful']);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Unexpected error: ' . $e->getMessage()]);
    }
}

// Endpoint to sign in a user
if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/sign-in') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['email'], $data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit();
    }

    $email = $data['email'];
    $password = $data['password'];

    try {
        $connection = get_db_connection();

        $stmt = $connection->prepare("SELECT id, email, password FROM shop_tellers WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $teller = $result->fetch_assoc();

        if ($teller && password_verify($password, $teller['password'])) {
            echo json_encode(['message' => 'Sign-in successful', 'teller_id' => $teller['id']]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid email or password']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Unexpected error: ' . $e->getMessage()]);
    }
}

// Endpoint to complete a purchase
if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/completePurchase') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['purchaseItems'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid request']);
        exit();
    }

    $purchase_items = $data['purchaseItems'];

    try {
        $connection = get_db_connection();
        $customer_number = generate_customer_number();
        $purchase_time = date('Y-m-d H:i:s');

        $connection->begin_transaction();

        $stmt = $connection->prepare('INSERT INTO purchases (item_id, quantity, price, customer_number, purchase_time) VALUES (?, ?, ?, ?, ?)');

        foreach ($purchase_items as $item) {
            $stmt->bind_param('iidss', $item['id'], $item['quantity'], $item['price'], $customer_number, $purchase_time);
            $stmt->execute();
        }

        $connection->commit();

        echo json_encode(['status' => 'success', 'customer_number' => $customer_number]);
    } catch (Exception $e) {
        $connection->rollback();
        http_response_code(500);
        echo json_encode(['error' => 'Unexpected error: ' . $e->getMessage()]);
    }
}

// Endpoint to get recent sales
if ($_SERVER['REQUEST_METHOD'] == 'GET' && $_SERVER['REQUEST_URI'] == '/recent-sales') {
    try {
        $connection = get_db_connection();
        $result = $connection->query("
            SELECT customer_number, COUNT(*) as total_items, SUM(price * quantity) as total_amount
            FROM purchases
            GROUP BY customer_number
            ORDER BY customer_number DESC
            LIMIT 20
        ");
        $recent_sales = $result->fetch_all(MYSQLI_ASSOC);

        $recent_sales = decimal_to_float($recent_sales);

        echo json_encode($recent_sales);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Unexpected error: ' . $e->getMessage()]);
    }
}

// Endpoint to get sales details for a specific customer
if ($_SERVER['REQUEST_METHOD'] == 'GET' && preg_match('/^\/sales-details\/(.+)$/', $_SERVER['REQUEST_URI'], $matches)) {
    $customer_number = $matches[1];

    try {
        $connection = get_db_connection();
        $stmt = $connection->prepare("
            SELECT p.item_id, p.quantity, p.price, prod.name as product_name
            FROM purchases p
            JOIN products prod ON p.item_id = prod.id
            WHERE p.customer_number = ?
        ");
        $stmt->bind_param('s', $customer_number);
        $stmt->execute();
        $sales_details = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

        $sales_details = decimal_to_float($sales_details);

        echo json_encode($sales_details);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Unexpected error: ' . $e->getMessage()]);
    }
}

?>
