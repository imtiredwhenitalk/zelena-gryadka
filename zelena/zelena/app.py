from flask import Flask, render_template, request, redirect, session, url_for, send_from_directory
import os, json

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# Зберігання користувачів і товарів у файлах
USERS_FILE = 'users.json'
PRODUCTS_FILE = 'products.json'

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def load_products():
    if os.path.exists(PRODUCTS_FILE):
        with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_products(products):
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

@app.route('/')
def main():
    products = load_products()
    return render_template('main.html', products=products)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        users = load_users()
        username = request.form['username']
        password = request.form['password']
        if username in users:
            return 'Користувач вже існує'
        users[username] = {'password': password, 'is_admin': False}
        save_users(users)
        return redirect('/login')
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        users = load_users()
        username = request.form['username']
        password = request.form['password']
        if username in users and users[username]['password'] == password:
            session['username'] = username
            session['is_admin'] = users[username].get('is_admin', False)
            return redirect('/')
        return 'Невірний логін або пароль'
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

@app.route('/add_product', methods=['GET', 'POST'])
def add_product():
    if not session.get('is_admin'):
        return redirect('/login')
    if request.method == 'POST':
        products = load_products()
        name = request.form['name']
        desc = request.form['desc']
        price = request.form['price']
        category = request.form['category']
        image = request.files['image']
        image_filename = f"img/{name.replace(' ', '_')}.jpg"
        image.save(os.path.join('zelena', 'zelena', image_filename))
        product = {
            'id': len(products) + 1,
            'name': name,
            'desc': desc,
            'price': price,
            'category': category,
            'image': image_filename
        }
        products.append(product)
        save_products(products)
        # Створити сторінку-референс
        with open(f'zelena/zelena/html/product_{product['id']}.html', 'w', encoding='utf-8') as f:
            f.write(f"""<!DOCTYPE html>
<html lang='uk'><head><meta charset='UTF-8'><title>{name}</title></head>
<body><h2>{name}</h2><img src='../{image_filename}' width='200'><p>{desc}</p><p>Ціна: {price} грн</p><p>Категорія: {category}</p></body></html>""")
        return redirect('/')
    return render_template('add_product.html')

@app.route('/product/<int:product_id>')
def product_page(product_id):
    products = load_products()
    for p in products:
        if p['id'] == product_id:
            return render_template('product.html', product=p)
    return 'Товар не знайдено', 404

# Додай ще маршрути для about, contact, basket, search і т.д.