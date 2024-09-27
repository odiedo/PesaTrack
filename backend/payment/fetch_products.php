<?php
header('Content-Type: application/json');
session_start();

// Check if a session exists
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized access. Please log in.']);
    exit();
}

$conn = new mysqli("localhost", "root", "", "pesatrack");
if ($conn->connect_error) {
    echo json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

$sql = "SELECT id, category, name, price, quantity_in_stock, remaining_stock, image_url FROM products";

if ($stmt = $conn->prepare($sql)) {
    $stmt->execute();
    $result = $stmt->get_result();

    $products = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        echo json_encode(['products' => $products]);
    } else {
        // No products found
        echo json_encode(['products' => []]);
    }
    $stmt->close();
} else {
    echo json_encode(['error' => 'Failed to prepare the SQL statement']);
}

$conn->close();
?>
