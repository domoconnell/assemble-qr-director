const express = require('express');
const session = require('express-session');
const JSONStore = require('express-session-json')(session);
const fs = require('fs');
const path = require('path');
const { loginPage, adminPage } = require('./views/templates');

const app = express();

// --- Config ---
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'; // set in env in prod
const LINKS_FILE = path.join(__dirname, 'links.json');

// --- Basic middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(
    session({
        store: new JSONStore({
            path: path.join(__dirname, 'sessions'),
        }),
        secret: process.env.SESSION_SECRET || 'super-secret-change-me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        },
    })
);

let links = {};

function loadLinks() {
    if (fs.existsSync(LINKS_FILE)) {
        const raw = fs.readFileSync(LINKS_FILE, 'utf-8');
        links = JSON.parse(raw || '{}');
    } else {
        links = {};
    }

    if (!links._default) {
        links._default = 'https://www.google.com';
        saveLinks();
    }
}

function saveLinks() {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8');
}

loadLinks();

// --- Auth middleware ---
function requireAuth(req, res, next) {
    if (req.session && req.session.loggedIn) {
        return next();
    }
    return res.redirect('/admin/login');
}

function setNoCache(res) {
    res.setHeader(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, max-age=0'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
}

app.get('/', (req, res) => {
    const defaultUrl = links._default || 'https://www.google.com';
    setNoCache(res);
    return res.redirect(302, defaultUrl);
});

app.get('/:slug', (req, res, next) => {
    if (req.params.slug === 'admin') return next();

    const slug = req.params.slug;

    if (slug === '_default') {
        setNoCache(res);
        return res.status(404).send('QR code not found');
    }

    const target = links[slug];

    if (!target) {
        setNoCache(res);
        return res.status(404).send('QR code not found');
    }

    setNoCache(res);
    return res.redirect(302, target);
});

app.get('/admin/login', (req, res) => {
    setNoCache(res);
    res.send(loginPage());
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.loggedIn = true;
        return res.redirect('/admin');
    }
    setNoCache(res);
    return res.status(401).send(loginPage('Invalid credentials'));
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

app.get('/admin', requireAuth, (req, res) => {
    setNoCache(res);
    res.send(adminPage(links));
});

app.post('/admin/save', requireAuth, (req, res) => {
    const { slug, url } = req.body;

    if (!slug || !url) {
        return res.status(400).send('Slug and URL are required');
    }

    const cleanSlug = slug.trim();
    const cleanUrl = url.trim();

    links[cleanSlug] = cleanUrl;
    saveLinks();

    res.redirect('/admin');
});

app.post('/admin/delete', requireAuth, (req, res) => {
    const { slug } = req.body;
    if (slug && links[slug]) {
        delete links[slug];
        saveLinks();
    }
    saveLinks();
    res.redirect('/admin');
});

app.listen(PORT, () => {
    console.log(`QR app listening on port ${PORT}`);
});