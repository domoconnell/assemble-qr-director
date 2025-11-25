const express = require('express');
const cookieParser = require('cookie-parser');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { loginPage, adminPage } = require('./views/templates');

const app = express();

// --- Config ---
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'; // set in env in prod
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'super-secret-change-me';
const LINKS_FILE = path.join(__dirname, 'links.json');

// --- Basic middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser(COOKIE_SECRET));

let links = {};

// --- Load/Save links functions ---
// Links are stored in memory and persisted to file on changes
// File is ONLY read at server startup, not during normal operation
// Link structure: { url: string, name?: string, favorite?: boolean }
function loadLinks() {
    if (fs.existsSync(LINKS_FILE)) {
        try {
            const raw = fs.readFileSync(LINKS_FILE, 'utf-8');
            links = JSON.parse(raw || '{}');

            // Migrate old format (string URLs) to new format (objects)
            let needsSave = false;
            for (const [slug, value] of Object.entries(links)) {
                if (typeof value === 'string') {
                    links[slug] = { url: value, name: '', favorite: false };
                    needsSave = true;
                }
            }

            if (needsSave) {
                console.log('[STARTUP] Migrated old link format to new format');
                saveLinks();
            }

            console.log(`[STARTUP] Loaded ${Object.keys(links).length} links from file`);
        } catch (err) {
            console.error('[STARTUP] Error loading links file:', err);
            links = {};
        }
    } else {
        links = {};
        console.log('[STARTUP] No links file found, starting with empty links');
    }

    // Ensure default link exists
    if (!links._default) {
        links._default = { url: 'https://www.google.com', name: 'Default', favorite: false };
        saveLinks();
    } else if (typeof links._default === 'string') {
        links._default = { url: links._default, name: 'Default', favorite: false };
        saveLinks();
    }
}

function saveLinks() {
    try {
        fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8');
        console.log(`[PERSIST] Saved ${Object.keys(links).length} links to file`);
    } catch (err) {
        console.error('[PERSIST] Error saving links:', err);
    }
}

// Load links once at startup
loadLinks();

// --- Auth middleware ---
function requireAuth(req, res, next) {
    if (req.signedCookies.authenticated === 'true') {
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
    const defaultLink = links._default || { url: 'https://www.google.com' };
    const defaultUrl = typeof defaultLink === 'string' ? defaultLink : defaultLink.url;
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

    const linkData = links[slug];

    if (!linkData) {
        setNoCache(res);
        return res.status(404).send('QR code not found');
    }

    const targetUrl = typeof linkData === 'string' ? linkData : linkData.url;
    setNoCache(res);
    return res.redirect(302, targetUrl);
});

app.get('/admin/login', (req, res) => {
    setNoCache(res);
    res.send(loginPage());
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Set a signed cookie that expires in 24 hours
        res.cookie('authenticated', 'true', {
            signed: true,
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        return res.redirect('/admin');
    }
    setNoCache(res);
    return res.status(401).send(loginPage('Invalid credentials'));
});

app.get('/admin/logout', (req, res) => {
    res.clearCookie('authenticated');
    res.redirect('/admin/login');
});

app.get('/admin', requireAuth, (req, res) => {
    // Use in-memory links directly - no file reading during normal operation
    setNoCache(res);
    res.send(adminPage(links));
});

app.post('/admin/save', requireAuth, (req, res) => {
    const { slug, url, name } = req.body;

    if (!slug || !url) {
        return res.status(400).send('Slug and URL are required');
    }

    const cleanSlug = slug.trim();
    const cleanUrl = url.trim();
    const cleanName = (name || '').trim();

    // Preserve favorite status if updating existing link
    const existingFavorite = links[cleanSlug]?.favorite || false;

    links[cleanSlug] = {
        url: cleanUrl,
        name: cleanName,
        favorite: existingFavorite
    };
    saveLinks();

    res.redirect('/admin');
});

// QR code generation endpoint
app.get('/admin/qr/:slug', requireAuth, async (req, res) => {
    const { slug } = req.params;
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    const targetUrl = `${baseUrl}/${slug}`;

    try {
        const { createCanvas, loadImage } = require('canvas');

        // Generate QR code with custom styling
        const qrCodeDataUrl = await QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: 'H', // High error correction for logo overlay
            type: 'image/png',
            width: 500,
            margin: 2,
            color: {
                dark: '#1d1d1b',  // Dark charcoal (Assemble branding)
                light: '#ffffff'  // White background
            }
        });

        // Load the QR code and logo
        const qrImage = await loadImage(qrCodeDataUrl);
        const logoPath = path.join(__dirname, 'public', 'logo.png');
        const logo = await loadImage(logoPath);

        // Create canvas and overlay logo
        const canvas = createCanvas(qrImage.width, qrImage.height);
        const ctx = canvas.getContext('2d');

        // Draw QR code
        ctx.drawImage(qrImage, 0, 0);

        // Calculate logo size (about 20% of QR code size)
        const logoSize = Math.floor(qrImage.width * 0.2);
        const logoX = (qrImage.width - logoSize) / 2;
        const logoY = (qrImage.height - logoSize) / 2;

        // Draw white background circle for logo
        const bgSize = logoSize * 1.2;
        const bgX = qrImage.width / 2;
        const bgY = qrImage.height / 2;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bgX, bgY, bgSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Add border to make it look integrated with QR code
        ctx.strokeStyle = '#1d1d1b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw logo
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

        // Convert to data URL
        const finalQRCode = canvas.toDataURL('image/png');

        // Return as JSON so we can display it in the admin page
        res.json({ qrCode: finalQRCode, url: targetUrl });
    } catch (err) {
        console.error('QR code generation error:', err);
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

app.post('/admin/delete', requireAuth, (req, res) => {
    const { slug } = req.body;
    if (slug && links[slug]) {
        delete links[slug];
        saveLinks();
    }
    res.redirect('/admin');
});

app.post('/admin/toggle-favorite', requireAuth, (req, res) => {
    const { slug } = req.body;
    if (slug && links[slug]) {
        const linkData = links[slug];
        linkData.favorite = !linkData.favorite;
        saveLinks();
    }
    res.redirect('/admin');
});

// Generate a random slug that doesn't exist
app.get('/admin/generate-slug', requireAuth, (req, res) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        const length = Math.floor(Math.random() * 4) + 5; // 5-8 characters
        slug = '';
        for (let i = 0; i < length; i++) {
            slug += chars[Math.floor(Math.random() * chars.length)];
        }
        attempts++;
    } while (links[slug] && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
        return res.status(500).json({ error: 'Could not generate unique slug' });
    }

    res.json({ slug });
});

app.listen(PORT, () => {
    console.log(`QR app listening on port ${PORT} `);
});