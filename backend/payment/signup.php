<?php
header('Content-Type: application/json');
$conn = new mysqli("localhost", "root", "", "pesatrack");

if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Database connection failed']));
}

$data = json_decode(file_get_contents('php://input'), true);

$name = $data['name'];
$id_number = $data['id_number'];
$phone = $data['phone'];
$email = $data['email'];
$password = password_hash($data['password'], PASSWORD_BCRYPT);

$sql = "INSERT INTO shop_tellers (name, id_number, phone, email, password) VALUES ('$name', '$id_number', '$phone', '$email', '$password')";

if ($conn->query($sql) === TRUE) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Signup failed']);
}

$conn->close();
?>
