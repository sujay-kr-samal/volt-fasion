const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;
const USERS_DB = path.join(__dirname, 'database', 'users.json');
const PRODUCTS_DB = path.join(__dirname, 'database', 'products.json');
const ORDERS_DB = path.join(__dirname, 'database', 'orders.json');
const OFFERS_DB = path.join(__dirname, 'database', 'offers.json');

app.use(cors());
app.use(bodyParser.json());

// Basic Data Helpers
const readData = (p) => {
    try {
        if (!fs.existsSync(p)) return [];
        return JSON.parse(fs.readFileSync(p, 'utf8').trim() || '[]');
    } catch (e) { return []; }
};
const writeData = (p, d) => fs.writeFileSync(p, JSON.stringify(d, null, 2));

// Legacy compatibility
const getUsers = () => readData(USERS_DB);
const saveUsers = (u) => writeData(USERS_DB, u);

// Auth Middleware
const isAdmin = (req, res, next) => {
    const role = req.headers['x-user-role'];
    if (role === 'admin') next();
    else res.status(403).json({ message: 'Access denied. Admins only.' });
};

// Signup Route
app.post('/api/signup', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const users = getUsers();

        if (users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            name: `${firstName} ${lastName}`.trim(),
            email,
            password: hashedPassword,
            role: 'user'
        };

        users.push(newUser);
        saveUsers(users);

        res.status(201).json({ message: 'User created successfully', user: { name: newUser.name, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = getUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', user: { name: user.name, email: user.email, role: user.role || 'user' } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// --- PRODUCT API ---
app.get('/api/products', (req, res) => res.json(readData(PRODUCTS_DB)));

app.post('/api/products', isAdmin, (req, res) => {
    const products = readData(PRODUCTS_DB);
    const newP = { id: Date.now(), ...req.body };
    products.push(newP);
    writeData(PRODUCTS_DB, products);
    res.status(201).json(newP);
});

app.put('/api/products/:id', isAdmin, (req, res) => {
    let products = readData(PRODUCTS_DB);
    const idx = products.findIndex(p => p.id == req.params.id);
    if (idx === -1) return res.status(404).send();
    products[idx] = { ...products[idx], ...req.body };
    writeData(PRODUCTS_DB, products);
    res.json(products[idx]);
});

app.delete('/api/products/:id', isAdmin, (req, res) => {
    let products = readData(PRODUCTS_DB);
    products = products.filter(p => p.id != req.params.id);
    writeData(PRODUCTS_DB, products);
    res.status(204).send();
});

// --- ORDER API ---
app.get('/api/orders', isAdmin, (req, res) => res.json(readData(ORDERS_DB)));

app.post('/api/orders', (req, res) => {
    const orders = readData(ORDERS_DB);
    const newO = {
        id: 'ORD-' + Date.now(),
        date: new Date().toISOString(),
        status: 'Processing',
        ...req.body
    };
    orders.push(newO);
    writeData(ORDERS_DB, orders);
    res.status(201).json(newO);
});

app.put('/api/orders/:id', isAdmin, (req, res) => {
    let orders = readData(ORDERS_DB);
    const idx = orders.findIndex(o => o.id == req.params.id);
    if (idx === -1) return res.status(404).send();
    orders[idx].status = req.body.status;
    writeData(ORDERS_DB, orders);
    res.json(orders[idx]);
});

// --- DASHBOARD ANALYTICS ---
app.get('/api/admin/stats', isAdmin, (req, res) => {
    const orders = readData(ORDERS_DB);
    const products = readData(PRODUCTS_DB);
    const users = readData(USERS_DB);

    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter(o => o.status === 'Processing').length;

    res.json({
        totalRevenue: revenue,
        totalOrders: orders.length,
        totalProducts: products.length,
        totalCustomers: users.length,
        pendingOrders: pending
    });
});

// --- OFFERS API ---
app.get('/api/offers', (req, res) => res.json(readData(OFFERS_DB)));

app.post('/api/offers', isAdmin, (req, res) => {
    const offers = readData(OFFERS_DB);
    const newO = { id: Date.now(), ...req.body };
    offers.push(newO);
    writeData(OFFERS_DB, offers);
    res.status(201).json(newO);
});

app.delete('/api/offers/:id', isAdmin, (req, res) => {
    let offers = readData(OFFERS_DB);
    offers = offers.filter(o => o.id != req.params.id);
    writeData(OFFERS_DB, offers);
    res.status(204).send();
});

// --- STAFF API ---
app.get('/api/admin/staff', isAdmin, (req, res) => {
    const users = readData(USERS_DB);
    const staff = users.filter(u => u.role === 'admin' || u.role === 'manager');
    res.json(staff);
});

app.delete('/api/admin/staff/:id', isAdmin, (req, res) => {
    let users = readData(USERS_DB);
    users = users.filter(u => u.id != req.params.id);
    writeData(USERS_DB, users);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
