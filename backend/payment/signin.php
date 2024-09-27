<?php

header('Content-Type: application/json');
session_start();

$conn = new mysqli("localhost", "root", "", "pesatrack");

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

// Decode the JSON data received from the client
$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'];
$password = $data['password'];

// Fetch the user's hashed password and other relevant data from the database
$sql = "SELECT id, password FROM shop_tellers WHERE email=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $hashedPassword = $row['password'];
    $userId = $row['id'];
    if (password_verify($password, $hashedPassword)) {
        // Store the user ID and email in session
        $_SESSION['user_id'] = $userId;
        $_SESSION['email'] = $email;

        // Return a successful response with the session ID
        echo json_encode([
            'success' => true,
            'message' => 'Logged in successfully',
            'sessionId' => session_id() 
        ]);
    } else {
        // Password verification failed
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
} else {
    // No user found with the given email
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
}

$stmt->close();
$conn->close();
?>
