<?php
// Set header to return JSON
header('Content-Type: application/json');

// Enable error reporting for debugging purposes (Remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database connection
$conn = new mysqli("localhost", "root", "", "pesatrack");

if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// Get customer number from query parameters
$customer_number = isset($_GET['customer_number']) ? $_GET['customer_number'] : '';

if (empty($customer_number)) {
    echo json_encode(['error' => 'Customer number is required']);
    exit;
}

// SQL query to fetch sales details
$sql = "
    SELECT 
        products.name AS product_name, 
        purchases.quantity, 
        purchases.price, 
        purchases.customer_number 
    FROM 
        purchases 
    INNER JOIN 
        products 
    ON 
        purchases.item_id = products.id 
    WHERE 
        purchases.customer_number = ?";

// Prepare statement
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(['error' => 'Failed to prepare statement: ' . $conn->error]);
    exit;
}

// Bind the parameter
$stmt->bind_param("s", $customer_number);

// Execute the query
$stmt->execute();

// Fetch the result
$result = $stmt->get_result();

// Process the result
$sales_details = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $sales_details[] = $row;
    }
    echo json_encode(['sales_details' => $sales_details]);
} else {
    echo json_encode(['sales_details' => []]);
}

// Close the statement and connection
$stmt->close();
$conn->close();
?>
