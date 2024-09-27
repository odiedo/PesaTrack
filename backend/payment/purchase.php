<?php
header('Content-Type: application/json');

// Start session management
session_start();

// Check if a session exists
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Please log in.']);
    exit();
}

// Database connection
$conn = new mysqli("localhost", "root", "", "pesatrack");

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

// Retrieve the input data
$data = json_decode(file_get_contents('php://input'), true);

if ($data && isset($data['purchaseItems'])) {
    $purchaseItems = $data['purchaseItems'];
    $customer_number = uniqid();
    $purchase_time = date("Y-m-d H:i:s");

    $errors = [];
    
    foreach ($purchaseItems as $item) {
        $item_id = $item['id'];
        $quantity = $item['quantity'];
        $price = $item['price'];

        $sql = "INSERT INTO purchases (item_id, quantity, price, customer_number, purchase_time) 
                VALUES ('$item_id', '$quantity', '$price', '$customer_number', '$purchase_time')";

        if (!$conn->query($sql)) {
            $errors[] = "Failed to insert item with ID $item_id: " . $conn->error;
        }
    }

    $conn->close();

    if (empty($errors)) {
        echo json_encode(['success' => true, 'message' => 'Purchase completed successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Some items failed to insert', 'errors' => $errors]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
}
?>
