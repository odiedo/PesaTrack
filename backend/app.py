from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import json
import os
from decimal import Decimal
import bcrypt
import uuid
from datetime import datetime


app = Flask(__name__)
CORS(app)

# Database connection
db_config = {
    'user': 'root',
    'password': '',
    'host': 'localhost',
    'database': 'pesatrack'
}

def get_db_connection():
    connection = mysql.connector.connect(**db_config)
    return connection

# Helper function to convert Decimal to float
def decimal_to_float(data):
    if isinstance(data, Decimal):
        return float(data)
    elif isinstance(data, dict):
        return {k: decimal_to_float(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [decimal_to_float(i) for i in data]
    return data
def generate_customer_number():
    # Generate a unique customer number
    return str(uuid.uuid4())

@app.route('/sync-products', methods=['POST'])
def sync_products():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT * FROM products")
        products = cursor.fetchall()

        cursor.close()
        connection.close()

        # Convert Decimal values to float
        products = decimal_to_float(products)

        # JSON file path
        json_file_path = os.path.join(os.path.dirname(__file__), 'products.json')

        # Write the data to the JSON file
        with open(json_file_path, 'w') as json_file:
            json.dump({'products': products}, json_file, indent=4)

        return jsonify({'message': 'Products synced successfully!'})
    except mysql.connector.Error as db_err:
        return jsonify({'error': f"Database error: {str(db_err)}"}), 500
    except Exception as e:
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500

@app.route('/products-json', methods=['GET'])
def get_products_json():
    try:
        json_file_path = os.path.join(os.path.dirname(__file__), 'products.json')
        
        if not os.path.exists(json_file_path):
            return jsonify({'error': 'JSON file not found'}), 404

        with open(json_file_path, 'r') as json_file:
            data = json.load(json_file)
        
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500

@app.route('/sign-up', methods=['POST'])
def sign_up():
    data = request.get_json()

    required_fields = ['name', 'id_number', 'phone', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    name = data['name']
    id_number = data['id_number']
    phone = data['phone']
    email = data['email']
    password = data['password']

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Check if email already exists
        cursor.execute("SELECT id FROM shop_tellers WHERE email = %s", (email,))
        existing_teller = cursor.fetchone()
        if existing_teller:
            return jsonify({'error': 'Email already in use'}), 409

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        # Insert the new teller
        cursor.execute(
            "INSERT INTO shop_tellers (name, id_number, phone, email, password) VALUES (%s, %s, %s, %s, %s)",
            (name, id_number, phone, email, hashed_password.decode('utf-8'))
        )
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({'message': 'Sign-up successful'}), 201
    except mysql.connector.Error as db_err:
        return jsonify({'error': f"Database error: {str(db_err)}"}), 500
    except Exception as e:
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500

@app.route('/sign-in', methods=['POST'])
def sign_in():
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    email = data['email']
    password = data['password']

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT id, email, password FROM shop_tellers WHERE email = %s", (email,))
        teller = cursor.fetchone()

        cursor.close()
        connection.close()

        if teller is None:
            return jsonify({'error': 'Invalid email or password'}), 401
 
        # Verify the password
        if not bcrypt.checkpw(password.encode('utf-8'), teller['password'].encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Successful sign-in
        return jsonify({'message': 'Sign-in successful', 'teller_id': teller['id']}), 200
    except mysql.connector.Error as db_err:
        return jsonify({'error': f"Database error: {str(db_err)}"}), 500
    except Exception as e:
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500   

@app.route('/completePurchase', methods=['POST'])
def complete_purchase():
    data = request.get_json()
    
    if not data or 'purchaseItems' not in data:
        return jsonify({'error': 'Invalid request'}), 400

    purchase_items = data['purchaseItems']
    
    try:
        customer_number = generate_customer_number()

        purchase_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')


        db = get_db_connection()
        cursor = db.cursor()

        # Begin a transaction
        cursor.execute("START TRANSACTION")

        for item in purchase_items:
            cursor.execute(
                'INSERT INTO purchases (item_id, quantity, price, customer_number, purchase_time) VALUES (%s, %s, %s, %s, %s)',
                (item['id'], item['quantity'], item['price'], customer_number, purchase_time)
            )

        db.commit()  
        cursor.close()
        db.close()

        return jsonify({'status': 'success', 'customer_number': customer_number}), 200

    except mysql.connector.Error as err:
        print(f"Error: {err}")  
        return jsonify({'error': 'Database error'}), 500

    except Exception as e:
        print(f"Error: {e}")  
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/recent-sales', methods=['GET'])
def recent_sales():
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # get distinct customer numbers with the total number of items purchased
        cursor.execute("""
            SELECT customer_number, COUNT(*) as total_items, SUM(price * quantity) as total_amount
            FROM purchases
            GROUP BY customer_number
            ORDER BY customer_number DESC
            LIMIT 20
        """)
        recent_sales = cursor.fetchall()

        # Convert Decimal values to float
        recent_sales = decimal_to_float(recent_sales)

        cursor.close()
        db.close()

        return jsonify(recent_sales), 200
    except mysql.connector.Error as db_err:
        return jsonify({'error': f"Database error: {str(db_err)}"}), 500
    except Exception as e:
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500

@app.route('/sales-details/<customer_number>', methods=['GET'])
def sales_details(customer_number):
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # get all items for the given customer number
        cursor.execute("""
            SELECT p.item_id, p.quantity, p.price, prod.name as product_name
            FROM purchases p
            JOIN products prod ON p.item_id = prod.id
            WHERE p.customer_number = %s
        """, (customer_number,))
        sales_details = cursor.fetchall()

        # Convert Decimal values to float
        sales_details = decimal_to_float(sales_details)

        cursor.close()
        db.close()

        return jsonify(sales_details), 200
    except mysql.connector.Error as db_err:
        return jsonify({'error': f"Database error: {str(db_err)}"}), 500
    except Exception as e:
        return jsonify({'error': f"Unexpected error: {str(e)}"}), 500



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
