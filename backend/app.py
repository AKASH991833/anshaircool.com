import os
import json
import secrets
import mysql.connector
from mysql.connector import Error
from datetime import timedelta
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, g, send_from_directory
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from functools import wraps

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'ansh_aircool_secret_2024')
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=2)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'images')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db():
    if 'db' not in g:
        g.db = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            port=int(os.getenv('MYSQL_PORT', 3306)),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DB', 'ac_service_billing'),
        )
    return g.db

@app.teardown_appcontext
def close_db(e):
    db = g.pop('db', None)
    if db: db.close()

def save_image(file):
    if file and file.filename and allowed_file(file.filename):
        fn = secure_filename(file.filename)
        fn = f"{fn.rsplit('.',1)[0]}_{secrets.token_hex(3)}.{fn.rsplit('.',1)[1]}"
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], fn))
        return fn
    return None

def init_db():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', '')
        )
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{os.getenv('MYSQL_DB', 'ac_service_billing')}`")
        cursor.close()
        conn.close()

        db = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', ''),
            database=os.getenv('MYSQL_DB', 'ac_service_billing'),
        )
        c = db.cursor(dictionary=True)

        c.execute('''CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL, buy_price DECIMAL(10,2) NOT NULL,
            rent_price DECIMAL(10,2) NOT NULL, old_price DECIMAL(10,2),
            description_buy TEXT, description_rent TEXT, image VARCHAR(255),
            rating DECIMAL(2,1) DEFAULT 4.5, rating_count INT DEFAULT 0,
            badge VARCHAR(50), features JSON, is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(100) NOT NULL,
            description TEXT, image VARCHAR(255), icon VARCHAR(50),
            features JSON, order_index INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS admin_users (
            id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL, email VARCHAR(100),
            is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS contact_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL, phone VARCHAR(20), message TEXT,
            is_read BOOLEAN DEFAULT FALSE, submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS site_settings (
            id INT AUTO_INCREMENT PRIMARY KEY, site_name VARCHAR(100),
            phone VARCHAR(20), email VARCHAR(100), address TEXT,
            whatsapp_number VARCHAR(20), tagline TEXT, description TEXT,
            years_experience INT, customers_served INT, satisfaction_rate INT
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS hero_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trust_badge VARCHAR(200),
            title_line1 VARCHAR(100),
            title_line2 VARCHAR(100),
            title_line3 VARCHAR(100),
            subtitle TEXT,
            starting_price DECIMAL(10,2),
            old_price DECIMAL(10,2),
            image VARCHAR(255),
            quick_features JSON,
            stats JSON,
            is_active BOOLEAN DEFAULT TRUE
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS features (
            id INT AUTO_INCREMENT PRIMARY KEY,
            icon VARCHAR(50),
            title VARCHAR(100) NOT NULL,
            description TEXT,
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')

        c.execute('''CREATE TABLE IF NOT EXISTS testimonials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            location VARCHAR(100),
            avatar VARCHAR(255),
            rating DECIMAL(2,1),
            text TEXT,
            display_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )''')

        c.execute('SELECT COUNT(*) as cnt FROM admin_users')
        if c.fetchone()['cnt'] == 0:
            c.execute('INSERT INTO admin_users (username, password, email) VALUES (%s, %s, %s)',
                ('admin', generate_password_hash('admin123'), 'admin@anshaircool.com'))

        c.execute('SELECT COUNT(*) as cnt FROM hero_content')
        if c.fetchone()['cnt'] == 0:
            c.execute('''INSERT INTO hero_content (trust_badge, title_line1, title_line2, title_line3, subtitle,
                starting_price, old_price, image, quick_features, stats) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)''',
                ("India's #1 Trusted AC Brand", "Experience", "Ultimate Cooling", "Like Never Before",
                 "Advanced inverter technology that saves <strong>up to 60% electricity</strong> while delivering lightning-fast cooling. Transform your space with Ansh Air Cool's premium AC solutions.",
                 32499, 38999, "images/split-ac.jpg",
                 json.dumps([{"icon":"fa-bolt","text":"5 Star Rating"},{"icon":"fa-truck-fast","text":"Free Delivery"},{"icon":"fa-shield-halved","text":"10 Year Warranty"}]),
                 json.dumps([{"count":15,"suffix":"+","label":"Years Experience"},{"count":50,"suffix":"K+","label":"Happy Customers"},{"count":99,"suffix":"%","label":"Satisfaction Rate"}])))

        c.execute('SELECT COUNT(*) as cnt FROM features')
        if c.fetchone()['cnt'] == 0:
            features_data = [
                ('fa-gem', 'Superior Quality', 'Built with premium components and rigorous testing for lasting durability and peak performance.', 1),
                ('fa-wifi', 'Smart Connectivity', 'WiFi-enabled control lets you manage your AC from anywhere using your smartphone.', 2),
                ('fa-shield-alt', '10 Year Warranty', 'Comprehensive warranty coverage for complete peace of mind on your investment.', 3),
                ('fa-award', '100% Satisfaction', 'Not happy? We offer full replacement or refund. Your satisfaction is guaranteed.', 4),
                ('fa-bolt', 'Energy Efficient', '5-star rated inverter technology that cuts your electricity bills by up to 60%.', 5),
                ('fa-headset', '24/7 Support', 'Round-the-clock customer support with instant response and quick resolution.', 6)
            ]
            for f in features_data:
                c.execute('INSERT INTO features (icon, title, description, display_order) VALUES (%s,%s,%s,%s)', f)

        c.execute('SELECT COUNT(*) as cnt FROM testimonials')
        if c.fetchone()['cnt'] == 0:
            testimonial_data = [
                ('Rajesh Kumar', 'Mumbai, Maharashtra', 'https://randomuser.me/api/portraits/men/32.jpg', 5, 'The cooling performance is exceptional. Room reaches desired temp in minutes. Installation team was professional and quick.', 1),
                ('Priya Sharma', 'Bangalore, Karnataka', 'https://randomuser.me/api/portraits/women/44.jpg', 5, 'Best AC purchase ever! Inverter tech really saves electricity. WiFi control is so convenient. Highly recommended!', 2),
                ('Amit Patel', 'Ahmedabad, Gujarat', 'https://randomuser.me/api/portraits/men/67.jpg', 4.5, 'Ultra-silent model is perfect for bedroom. Sleep peacefully without noise. Great build quality too!', 3),
                ('Sneha Reddy', 'Hyderabad, Telangana', 'https://randomuser.me/api/portraits/women/68.jpg', 5, 'The AMC plan is fantastic! Regular maintenance visits keep my AC running perfectly year-round.', 4)
            ]
            for t in testimonial_data:
                c.execute('INSERT INTO testimonials (name, location, avatar, rating, text, display_order) VALUES (%s,%s,%s,%s,%s,%s)', t)

        c.execute('SELECT COUNT(*) as cnt FROM products')
        if c.fetchone()['cnt'] == 0:
            for p in [
                ('Ansh Pro Cool Split', 'Split AC', 42999, 2499, 52999, 'Premium 5-star inverter split AC with advanced cooling technology. Perfect for homes and offices with energy savings up to 60%. Comes with 10-year compressor warranty and free installation.', 'Rent this premium split AC for your space. Includes free maintenance, 24/7 support, and no deposit required. Flexible rental terms with easy upgrade options.', 'images/split-ac.jpg', 4.5, 2847, 'best-seller', '["5 Star", "Inverter", "Cool"]'),
                ('Ansh Elite Window', 'Window AC', 32499, 1799, 38999, 'Energy-efficient 4-star window AC with quick cooling and auto mode. Easy installation, low noise operation. Perfect for bedrooms and small rooms with durable build quality.', 'Affordable window AC rental solution. Complete maintenance included. Great for rented apartments, offices, and seasonal needs. Quick installation within 24 hours.', 'images/window-ac.jpg', 5.0, 1523, 'new', '["4 Star", "Auto", "Easy Install"]'),
                ('Ansh Max Inverter Pro', 'Inverter AC', 54999, 3299, 68999, 'Top-of-the-line 5-star inverter AC with variable speed compressor. Ultra-quiet operation, auto-clean feature, and maximum energy efficiency. Best for large rooms and commercial spaces.', 'Premium cassette AC on rent for large spaces. Includes quarterly maintenance, priority support, and flexible upgrade options. Perfect for offices, shops, and large rooms.', 'images/cassette-ac.jpg', 5.0, 3291, 'hot', '["5 Star", "Variable", "Auto Clean"]')
            ]:
                c.execute('INSERT INTO products (name,category,buy_price,rent_price,old_price,description_buy,description_rent,image,rating,rating_count,badge,features) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)', p)

        c.execute('SELECT COUNT(*) as cnt FROM services')
        if c.fetchone()['cnt'] == 0:
            for i, s in enumerate([
                ('AC Installation', 'Professional setup for Split, Window & Cassette ACs with zero damage guarantee and free demo.', 'images/ac-installation.jpg', 'fa-screwdriver-wrench', '["Expert Technicians","All Brands Supported","Same Day Service"]'),
                ('AC Cleaning & Service', 'Deep cleaning with anti-bacterial foam wash for better cooling and healthy air quality.', 'images/ac-cleaning.jpg', 'fa-broom', '["Foam Wash Technology","Filter Deep Cleaning","Anti-Bacterial Treatment"]'),
                ('Gas Refill & Charging', 'R410A & R32 gas refill with leak detection and pressure testing for optimal cooling.', 'images/gas-refill.jpg', 'fa-snowflake', '["Genuine Gas Only","Leak Detection","Pressure Testing"]'),
                ('AC Repair & Service', 'Same-day repair for all AC brands with genuine spare parts and service warranty.', 'images/ac-repair.jpg', 'fa-wrench', '["All Brands Repaired","Genuine Spare Parts","30-Day Warranty"]'),
                ('Annual Maintenance (AMC)', 'Yearly AMC plans with unlimited servicing, priority support & 20% discount on repairs.', 'images/amc-service.jpg', 'fa-clipboard-check', '["Unlimited Service Calls","Priority Support","20% Discount on Repairs"]'),
                ('PCB Repair & Service', 'Advanced PCB level repair for inverter ACs with component replacement and testing.', 'images/pcb-repair.jpg', 'fa-microchip', '["Component Level Repair","Inverter AC Specialist","90-Day Warranty"]')
            ], 1):
                c.execute('INSERT INTO services (title,description,image,icon,features,order_index) VALUES (%s,%s,%s,%s,%s,%s)', (*s, i))

        try:
            c.execute("ALTER TABLE site_settings ADD COLUMN tagline TEXT AFTER whatsapp_number")
            db.commit()
        except:
            pass
        try:
            c.execute("ALTER TABLE site_settings ADD COLUMN description TEXT AFTER tagline")
            db.commit()
        except:
            pass
        try:
            c.execute("ALTER TABLE services ADD COLUMN order_index INT DEFAULT 0 AFTER icon")
            db.commit()
        except:
            pass
        # Migrate old image paths to new format
        try:
            c.execute("UPDATE products SET image = REPLACE(image, '/static/images/', 'images/') WHERE image LIKE '/static/images/%'")
            c.execute("UPDATE services SET image = REPLACE(image, '/static/images/', 'images/') WHERE image LIKE '/static/images/%'")
            c.execute("UPDATE products SET image = CONCAT('images/', image) WHERE image NOT LIKE 'images/%' AND image NOT LIKE '/%' AND image IS NOT NULL")
            c.execute("UPDATE services SET image = CONCAT('images/', image) WHERE image NOT LIKE 'images/%' AND image NOT LIKE '/%' AND image IS NOT NULL")
            db.commit()
        except:
            pass

        c.execute('SELECT COUNT(*) as cnt FROM site_settings')
        if c.fetchone()['cnt'] == 0:
            c.execute('INSERT INTO site_settings (site_name,phone,email,address,whatsapp_number,tagline,description,years_experience,customers_served,satisfaction_rate) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
                ('ANSH AIR COOL', '+919876543210', 'support@anshaircool.com', '123 Cool Street, AC Market, Mumbai, Maharashtra', '919876543210',
                 'Premium Air Conditioning Solutions', 'Advanced inverter technology that saves up to 60% electricity while delivering lightning-fast cooling. Transform your space with Ansh Air Cool\'s premium AC solutions.',
                 15, 50000, 99))

        db.commit()
        c.close()
        db.close()
        print("Database initialized successfully!")
    except Error as e:
        print(f"DB Init Error: {e}")

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'admin' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated

def parse_features(val):
    if isinstance(val, str):
        try: return json.loads(val)
        except: return []
    return val or []

def badge_map(b):
    m = {'best-seller': 'Best Seller', 'new': 'New', 'hot': 'Hot'}
    return {'type': b, 'text': m.get(b, b)} if b else None

def product_to_api(p):
    return {
        'id': p['id'], 'name': p['name'], 'category': p['category'],
        'buyPrice': float(p['buy_price']), 'rentPrice': float(p['rent_price']),
        'oldPrice': float(p['old_price']) if p.get('old_price') else None,
        'rating': float(p['rating']), 'ratingCount': p['rating_count'],
        'badge': badge_map(p.get('badge')),
        'features': parse_features(p.get('features')),
        'image': p['image'] if p['image'] and p['image'].startswith(('images/', '/static/')) else f"images/{p['image']}" if p['image'] else '',
        'descriptionBuy': p['description_buy'], 'descriptionRent': p['description_rent']
    }

def service_to_api(s):
    return {
        'id': s['id'], 'title': s['title'], 'description': s['description'],
        'image': s['image'] if s['image'] and s['image'].startswith('images/') else f"images/{s['image']}" if s['image'] else '',
        'icon': s['icon'], 'features': parse_features(s.get('features')),
        'order': s['order_index'] or 0
    }

# ============================================================
# MAIN WEBSITE STATIC FILES
# ============================================================
@app.route('/styles.css')
def serve_css():
    return send_from_directory(ROOT_DIR, 'styles.css')

@app.route('/script.js')
def serve_js():
    return send_from_directory(ROOT_DIR, 'script.js')

@app.route('/transparentdb/<path:filename>')
def serve_transparentdb(filename):
    return send_from_directory(os.path.join(ROOT_DIR, 'transparentdb'), filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(os.path.join(ROOT_DIR, 'images'), filename)

# ============================================================
# PUBLIC API - JSON data for the website
# ============================================================
@app.route('/api/hero')
def api_hero():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM hero_content WHERE is_active=TRUE ORDER BY id DESC LIMIT 1')
    h = c.fetchone()
    c.close()
    if not h:
        return jsonify({'error': 'No hero data'}), 404
    return jsonify({
        'trustBadge': h['trust_badge'],
        'titleLine1': h['title_line1'],
        'titleLine2': h['title_line2'],
        'titleLine3': h['title_line3'],
        'subtitle': h['subtitle'],
        'startingPrice': float(h['starting_price']) if h.get('starting_price') else 0,
        'oldPrice': float(h['old_price']) if h.get('old_price') else 0,
        'image': h['image'] or '',
        'quickFeatures': parse_features(h.get('quick_features')),
        'stats': parse_features(h.get('stats'))
    })

@app.route('/api/features')
def api_features():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM features WHERE is_active=TRUE ORDER BY display_order')
    rows = c.fetchall()
    c.close()
    return jsonify([{
        'id': r['id'], 'icon': r['icon'], 'title': r['title'],
        'description': r['description']
    } for r in rows])

@app.route('/api/testimonials')
def api_testimonials():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM testimonials WHERE is_active=TRUE ORDER BY display_order')
    rows = c.fetchall()
    c.close()
    return jsonify([{
        'id': r['id'], 'name': r['name'], 'location': r['location'],
        'avatar': r['avatar'] or '', 'rating': float(r['rating']),
        'text': r['text']
    } for r in rows])

@app.route('/api/settings')
def api_settings():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM site_settings LIMIT 1')
    s = c.fetchone() or {}
    c.close()
    return jsonify({
        'siteName': s.get('site_name', 'ANSH AIR COOL'),
        'phone': s.get('phone', ''),
        'email': s.get('email', ''),
        'address': s.get('address', ''),
        'whatsappNumber': s.get('whatsapp_number', ''),
        'tagline': s.get('tagline', ''),
        'description': s.get('description', ''),
        'yearsExperience': s.get('years_experience', 0),
        'customersServed': s.get('customers_served', 0),
        'satisfactionRate': s.get('satisfaction_rate', 0)
    })

@app.route('/api/products')
def api_products():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM products WHERE is_active=TRUE ORDER BY id')
    rows = c.fetchall()
    c.close()
    return jsonify([product_to_api(r) for r in rows])

@app.route('/api/services')
def api_services():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM services WHERE is_active=TRUE ORDER BY order_index')
    rows = c.fetchall()
    c.close()
    return jsonify([service_to_api(r) for r in rows])

@app.route('/api/website-data')
def api_website_data():
    db = get_db()
    c = db.cursor(dictionary=True)

    c.execute('SELECT * FROM hero_content WHERE is_active=TRUE ORDER BY id DESC LIMIT 1')
    hero_row = c.fetchone()

    c.execute('SELECT * FROM features WHERE is_active=TRUE ORDER BY display_order')
    features_rows = c.fetchall()

    c.execute('SELECT * FROM testimonials WHERE is_active=TRUE ORDER BY display_order')
    testimonials_rows = c.fetchall()

    c.execute('SELECT * FROM site_settings LIMIT 1')
    settings_row = c.fetchone()

    c.execute('SELECT * FROM products WHERE is_active=TRUE ORDER BY id')
    products_rows = c.fetchall()

    c.execute('SELECT * FROM services WHERE is_active=TRUE ORDER BY order_index')
    services_rows = c.fetchall()
    c.close()

    return jsonify({
        'hero': {
            'trustBadge': hero_row['trust_badge'] if hero_row else "India's #1 Trusted AC Brand",
            'titleLine1': hero_row['title_line1'] if hero_row else 'Experience',
            'titleLine2': hero_row['title_line2'] if hero_row else 'Ultimate Cooling',
            'titleLine3': hero_row['title_line3'] if hero_row else 'Like Never Before',
            'subtitle': hero_row['subtitle'] if hero_row else '',
            'startingPrice': float(hero_row['starting_price']) if hero_row and hero_row.get('starting_price') else 0,
            'oldPrice': float(hero_row['old_price']) if hero_row and hero_row.get('old_price') else 0,
            'image': hero_row['image'] if hero_row else '',
            'quickFeatures': parse_features(hero_row.get('quick_features')) if hero_row else [],
            'stats': parse_features(hero_row.get('stats')) if hero_row else []
        } if hero_row else None,
        'features': [{'id': r['id'], 'icon': r['icon'], 'title': r['title'], 'description': r['description']} for r in features_rows],
        'testimonials': [{'id': r['id'], 'name': r['name'], 'location': r['location'], 'avatar': r['avatar'] or '', 'rating': float(r['rating']), 'text': r['text']} for r in testimonials_rows],
        'settings': {
            'siteName': settings_row.get('site_name', 'ANSH AIR COOL') if settings_row else 'ANSH AIR COOL',
            'phone': settings_row.get('phone', '') if settings_row else '',
            'email': settings_row.get('email', '') if settings_row else '',
            'address': settings_row.get('address', '') if settings_row else '',
            'whatsappNumber': settings_row.get('whatsapp_number', '') if settings_row else '',
            'tagline': settings_row.get('tagline', '') if settings_row else '',
            'description': settings_row.get('description', '') if settings_row else '',
            'yearsExperience': settings_row.get('years_experience', 0) if settings_row else 0,
            'customersServed': settings_row.get('customers_served', 0) if settings_row else 0,
            'satisfactionRate': settings_row.get('satisfaction_rate', 0) if settings_row else 0
        } if settings_row else None,
        'products': [product_to_api(r) for r in products_rows],
        'services': [service_to_api(r) for r in services_rows]
    })

# ============================================================
# PUBLIC ROUTES
# ============================================================
@app.route('/')
def index():
    return send_from_directory(ROOT_DIR, 'index.html')

@app.route('/contact/submit', methods=['POST'])
def contact_submit():
    db = get_db()
    db.cursor().execute('INSERT INTO contact_submissions (name,email,phone,message) VALUES (%s,%s,%s,%s)',
        (request.form.get('name',''), request.form.get('email',''), request.form.get('phone',''), request.form.get('message','')))
    db.commit()
    return jsonify({'success': True, 'message': 'Thank you! We will contact you soon.'})

# ============================================================
# ADMIN LOGIN
# ============================================================
@app.route('/admin')
def admin_login():
    if 'admin' in session: return redirect(url_for('dashboard'))
    return render_template('admin/login.html')

@app.route('/admin/login', methods=['POST'])
def login_post():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM admin_users WHERE username=%s AND is_active=TRUE', (request.form['username'],))
    user = c.fetchone()
    c.close()
    if user and check_password_hash(user['password'], request.form['password']):
        session['admin'] = True
        session['admin_username'] = user['username']
        session.permanent = True
        return redirect(url_for('dashboard'))
    return redirect(url_for('admin_login', error='1'))

@app.route('/admin/logout')
def logout():
    session.clear()
    return redirect(url_for('admin_login'))

# ============================================================
# ADMIN DASHBOARD
# ============================================================
@app.route('/admin/dashboard')
@login_required
def dashboard():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute("SELECT (SELECT COUNT(*) FROM products) as pc, (SELECT COUNT(*) FROM services) as sc, (SELECT COUNT(*) FROM contact_submissions) as cc, (SELECT COUNT(*) FROM contact_submissions WHERE is_read=FALSE) as uc, (SELECT COUNT(*) FROM features) as fc, (SELECT COUNT(*) FROM testimonials) as tc")
    row = c.fetchone()
    c.close()
    return render_template('admin/dashboard.html',
        product_count=row['pc'], service_count=row['sc'],
        contact_count=row['cc'], unread_count=row['uc'],
        feature_count=row['fc'], testimonial_count=row['tc'])

# ============================================================
# ADMIN HERO
# ============================================================
@app.route('/admin/hero', methods=['GET', 'POST'])
@login_required
def admin_hero():
    db = get_db()
    if request.method == 'POST':
        c = db.cursor()
        quick_features = []
        titles = request.form.getlist('qf_title[]')
        icons = request.form.getlist('qf_icon[]')
        for i in range(len(titles)):
            if titles[i].strip():
                quick_features.append({'text': titles[i].strip(), 'icon': icons[i] if i < len(icons) else 'fa-star'})

        stats = []
        stat_counts = request.form.getlist('stat_count[]')
        stat_suffixes = request.form.getlist('stat_suffix[]')
        stat_labels = request.form.getlist('stat_label[]')
        for i in range(len(stat_counts)):
            if stat_counts[i].strip() and stat_labels[i].strip():
                stats.append({'count': int(stat_counts[i]), 'suffix': stat_suffixes[i] if i < len(stat_suffixes) else '+', 'label': stat_labels[i]})

        img = request.form.get('existing_image', 'images/split-ac.jpg')
        if 'image' in request.files:
            f = request.files['image']
            if f and f.filename and allowed_file(f.filename):
                saved = save_image(f)
                if saved: img = f"images/{saved}"

        c.execute('''UPDATE hero_content SET trust_badge=%s, title_line1=%s, title_line2=%s, title_line3=%s,
            subtitle=%s, starting_price=%s, old_price=%s, image=%s, quick_features=%s, stats=%s WHERE id=%s''',
            (request.form['trust_badge'], request.form['title_line1'], request.form['title_line2'],
             request.form['title_line3'], request.form['subtitle'],
             request.form['starting_price'], request.form['old_price'],
             img, json.dumps(quick_features), json.dumps(stats), 1))
        db.commit()
        flash('Hero section updated!', 'success')
        return redirect(url_for('admin_hero'))

    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM hero_content LIMIT 1')
    hero = c.fetchone()
    c.close()
    if hero:
        hero['quick_features'] = parse_features(hero.get('quick_features'))
        hero['stats'] = parse_features(hero.get('stats'))
    return render_template('admin/hero.html', hero=hero)

# ============================================================
# ADMIN FEATURES
# ============================================================
@app.route('/admin/features')
@login_required
def admin_features():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM features ORDER BY display_order')
    features = c.fetchall()
    c.close()
    return render_template('admin/features.html', features=features)

@app.route('/admin/features/add', methods=['GET', 'POST'])
@login_required
def add_feature():
    if request.method == 'POST':
        db = get_db()
        db.cursor().execute('INSERT INTO features (icon, title, description, display_order) VALUES (%s,%s,%s,%s)',
            (request.form['icon'], request.form['title'], request.form['description'], request.form.get('display_order', 0)))
        db.commit()
        return redirect(url_for('admin_features'))
    return render_template('admin/feature_form.html')

@app.route('/admin/features/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_feature(id):
    db = get_db()
    if request.method == 'POST':
        db.cursor().execute('UPDATE features SET icon=%s, title=%s, description=%s, display_order=%s WHERE id=%s',
            (request.form['icon'], request.form['title'], request.form['description'], request.form.get('display_order', 0), id))
        db.commit()
        return redirect(url_for('admin_features'))
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM features WHERE id=%s', (id,))
    feature = c.fetchone()
    c.close()
    return render_template('admin/feature_form.html', feature=feature)

@app.route('/admin/features/delete/<int:id>')
@login_required
def delete_feature(id):
    db = get_db()
    db.cursor().execute('DELETE FROM features WHERE id=%s', (id,))
    db.commit()
    return redirect(url_for('admin_features'))

# ============================================================
# ADMIN TESTIMONIALS
# ============================================================
@app.route('/admin/testimonials')
@login_required
def admin_testimonials():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM testimonials ORDER BY display_order')
    testimonials = c.fetchall()
    c.close()
    return render_template('admin/testimonials.html', testimonials=testimonials)

@app.route('/admin/testimonials/add', methods=['GET', 'POST'])
@login_required
def add_testimonial():
    if request.method == 'POST':
        db = get_db()
        db.cursor().execute('INSERT INTO testimonials (name, location, avatar, rating, text, display_order) VALUES (%s,%s,%s,%s,%s,%s)',
            (request.form['name'], request.form['location'], request.form.get('avatar', ''),
             request.form.get('rating', 5), request.form['text'], request.form.get('display_order', 0)))
        db.commit()
        return redirect(url_for('admin_testimonials'))
    return render_template('admin/testimonial_form.html')

@app.route('/admin/testimonials/edit/<int:id>', methods=['GET', 'POST'])
@login_required
def edit_testimonial(id):
    db = get_db()
    if request.method == 'POST':
        db.cursor().execute('UPDATE testimonials SET name=%s, location=%s, avatar=%s, rating=%s, text=%s, display_order=%s WHERE id=%s',
            (request.form['name'], request.form['location'], request.form.get('avatar', ''),
             request.form.get('rating', 5), request.form['text'], request.form.get('display_order', 0), id))
        db.commit()
        return redirect(url_for('admin_testimonials'))
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM testimonials WHERE id=%s', (id,))
    testimonial = c.fetchone()
    c.close()
    return render_template('admin/testimonial_form.html', testimonial=testimonial)

@app.route('/admin/testimonials/delete/<int:id>')
@login_required
def delete_testimonial(id):
    db = get_db()
    db.cursor().execute('DELETE FROM testimonials WHERE id=%s', (id,))
    db.commit()
    return redirect(url_for('admin_testimonials'))

# ============================================================
# ADMIN SETTINGS
# ============================================================
@app.route('/admin/settings', methods=['GET', 'POST'])
@login_required
def admin_settings():
    db = get_db()
    if request.method == 'POST':
        c = db.cursor(dictionary=True)
        c.execute('SELECT id FROM site_settings LIMIT 1')
        exist = c.fetchone()
        if exist:
            c.execute('''UPDATE site_settings SET site_name=%s, phone=%s, email=%s, address=%s,
                whatsapp_number=%s, tagline=%s, description=%s,
                years_experience=%s, customers_served=%s, satisfaction_rate=%s WHERE id=%s''',
                (request.form['site_name'], request.form['phone'], request.form['email'],
                 request.form['address'], request.form['whatsapp_number'],
                 request.form.get('tagline', ''), request.form.get('description', ''),
                 request.form.get('years_experience', 0), request.form.get('customers_served', 0),
                 request.form.get('satisfaction_rate', 0), exist['id']))
        else:
            c.execute('''INSERT INTO site_settings (site_name, phone, email, address, whatsapp_number,
                tagline, description, years_experience, customers_served, satisfaction_rate)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)''',
                (request.form['site_name'], request.form['phone'], request.form['email'],
                 request.form['address'], request.form['whatsapp_number'],
                 request.form.get('tagline', ''), request.form.get('description', ''),
                 request.form.get('years_experience', 0), request.form.get('customers_served', 0),
                 request.form.get('satisfaction_rate', 0)))
        db.commit()
        flash('Settings updated!', 'success')
        return redirect(url_for('admin_settings'))
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM site_settings LIMIT 1')
    settings = c.fetchone()
    c.close()
    return render_template('admin/settings.html', settings=settings)

# ============================================================
# ADMIN PRODUCTS
# ============================================================
@app.route('/admin/products')
@login_required
def products():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM products ORDER BY id DESC')
    return render_template('admin/products.html', products=c.fetchall())

@app.route('/admin/products/add', methods=['GET','POST'])
@login_required
def add_product():
    if request.method == 'POST':
        db = get_db()
        c = db.cursor()
        img = 'images/split-ac.jpg'
        if 'image' in request.files:
            f = request.files['image']
            if f and f.filename and allowed_file(f.filename):
                saved = save_image(f)
                if saved: img = f"images/{saved}"
        c.execute('INSERT INTO products (name,category,buy_price,rent_price,old_price,description_buy,description_rent,image,badge,features) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
            (request.form['name'], request.form['category'], request.form['buy_price'], request.form['rent_price'],
             request.form.get('old_price',0), request.form['description_buy'], request.form['description_rent'],
             img, request.form.get('badge',''), parse_features_input()))
        db.commit()
        return redirect(url_for('products'))
    return render_template('admin/product_form.html')

@app.route('/admin/products/edit/<int:id>', methods=['GET','POST'])
@login_required
def edit_product(id):
    db = get_db()
    if request.method == 'POST':
        c = db.cursor()
        c.execute('UPDATE products SET name=%s,category=%s,buy_price=%s,rent_price=%s,old_price=%s,description_buy=%s,description_rent=%s,badge=%s,features=%s WHERE id=%s',
            (request.form['name'], request.form['category'], request.form['buy_price'], request.form['rent_price'],
             request.form.get('old_price',0), request.form['description_buy'], request.form['description_rent'],
             request.form.get('badge',''), parse_features_input(), id))
        if 'image' in request.files:
            f = request.files['image']
            if f and f.filename and allowed_file(f.filename):
                saved = save_image(f)
                if saved:
                    db.cursor().execute('UPDATE products SET image=%s WHERE id=%s', (f"images/{saved}", id))
        db.commit()
        return redirect(url_for('products'))
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM products WHERE id=%s', (id,))
    prod = c.fetchone()
    c.close()
    if prod and prod.get('features'):
        if isinstance(prod['features'], str):
            try: prod['features'] = json.loads(prod['features'])
            except: prod['features'] = []
    return render_template('admin/product_form.html', product=prod, features_list=prod['features'] if prod else [])

@app.route('/admin/products/delete/<int:id>')
@login_required
def delete_product(id):
    db = get_db()
    db.cursor().execute('DELETE FROM products WHERE id=%s', (id,))
    db.commit()
    return redirect(url_for('products'))

# ============================================================
# ADMIN SERVICES
# ============================================================
@app.route('/admin/services')
@login_required
def services():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM services ORDER BY order_index')
    return render_template('admin/services.html', services=c.fetchall())

def parse_features_input():
    feat = request.form.getlist('features[]')
    if feat and feat[0] != '':
        return json.dumps(feat)
    text = request.form.get('features_text', '')
    if text and text.strip():
        return json.dumps([l.strip() for l in text.strip().split('\n') if l.strip()])
    return json.dumps([])

@app.route('/admin/services/add', methods=['GET','POST'])
@login_required
def add_service():
    if request.method == 'POST':
        db = get_db()
        c = db.cursor()
        img = 'images/ac-installation.jpg'
        if 'image' in request.files:
            f = request.files['image']
            if f and f.filename and allowed_file(f.filename):
                saved = save_image(f)
                if saved: img = f"images/{saved}"
        features_str = parse_features_input()
        c.execute('INSERT INTO services (title,description,image,icon,features,order_index) VALUES (%s,%s,%s,%s,%s,%s)',
            (request.form['title'], request.form['description'], img,
             request.form.get('icon', 'fa-wrench'),
             features_str,
             request.form.get('order_index', 0)))
        db.commit()
        return redirect(url_for('services'))
    return render_template('admin/service_form.html')

@app.route('/admin/services/edit/<int:id>', methods=['GET','POST'])
@login_required
def edit_service(id):
    db = get_db()
    if request.method == 'POST':
        c = db.cursor()
        features_str = parse_features_input()
        c.execute('UPDATE services SET title=%s,description=%s,order_index=%s,icon=%s,features=%s WHERE id=%s',
            (request.form['title'], request.form['description'], request.form.get('order_index', 0),
             request.form.get('icon', 'fa-wrench'),
             features_str, id))
        if 'image' in request.files:
            f = request.files['image']
            if f and f.filename and allowed_file(f.filename):
                saved = save_image(f)
                if saved:
                    db.cursor().execute('UPDATE services SET image=%s WHERE id=%s', (f"images/{saved}", id))
        db.commit()
        return redirect(url_for('services'))
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM services WHERE id=%s', (id,))
    svc = c.fetchone()
    c.close()
    if svc and svc.get('features'):
        if isinstance(svc['features'], str):
            try: svc['features'] = json.loads(svc['features'])
            except: svc['features'] = []
    return render_template('admin/service_form.html', service=svc, features_list=svc['features'] if svc else [])

@app.route('/admin/services/delete/<int:id>')
@login_required
def delete_service(id):
    db = get_db()
    db.cursor().execute('DELETE FROM services WHERE id=%s', (id,))
    db.commit()
    return redirect(url_for('services'))

# ============================================================
# ADMIN CONTACTS
# ============================================================
@app.route('/admin/contacts')
@login_required
def contacts():
    db = get_db()
    c = db.cursor(dictionary=True)
    c.execute('SELECT * FROM contact_submissions ORDER BY submitted_at DESC')
    return render_template('admin/contacts.html', contacts=c.fetchall())

@app.route('/admin/contacts/mark_read/<int:id>')
@login_required
def mark_read(id):
    db = get_db()
    db.cursor().execute('UPDATE contact_submissions SET is_read=TRUE WHERE id=%s', (id,))
    db.commit()
    return redirect(url_for('contacts'))

@app.route('/admin/contacts/delete/<int:id>')
@login_required
def delete_contact(id):
    db = get_db()
    db.cursor().execute('DELETE FROM contact_submissions WHERE id=%s', (id,))
    db.commit()
    return redirect(url_for('contacts'))

# ============================================================
# FLASH MESSAGES SUPPORT
# ============================================================
@app.context_processor
def inject_flash():
    return dict(get_flashed_messages=get_flashed_messages)

# Override flash with session-based flash for redirect compatibility
from flask import get_flashed_messages

# ============================================================
# STARTUP
# ============================================================
if __name__ == '__main__':
    init_db()
    print("\n" + "="*60)
    print("  Ansh Air Cool Backend")
    print("="*60)
    print("  Website: http://localhost:5000")
    print("  Admin:   http://localhost:5000/admin")
    print("  Login:   admin / admin123")
    print("="*60 + "\n")
    app.run(debug=True, port=5000, host='127.0.0.1')
