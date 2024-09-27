<?php
header('Content-Type: application/json');

// Start session management
session_start();

// Check if a session exists
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized access. Please log in.']);
    exit();
}

$conn = new mysqli("localhost", "root", "", "pesatrack");

if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

$sql = "
    SELECT customer_number, COUNT(*) as total_items, SUM(price * quantity) as total_amount
    FROM purchases
    GROUP BY customer_number
    ORDER BY customer_number DESC
    LIMIT 20
";

$result = $conn->query($sql);

$recent_sales = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Convert numeric fields to appropriate types for JSON compatibility
        $row['total_items'] = (int)$row['total_items'];
        $row['total_amount'] = (float)$row['total_amount'];
        $recent_sales[] = $row;
    }
    echo json_encode(['recent_sales' => $recent_sales]);
} else {
    echo json_encode(['recent_sales' => []]);
}

$conn->close();
?>
