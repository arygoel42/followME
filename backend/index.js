const express = require('express');
require('dotenv').config();
const app = express();
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const session = require('express-session');

const redirectURI = process.env.RedirectURI;
const clientId = process.env.instagram_Client_ID;
const clientSecret = process.env.instagram_Client_Secret;

// Middleware to set Cross-Origin-Resource-Policy header
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

// Proxy middleware to handle Instagram API requests
app.use('/instagram-api', createProxyMiddleware({
    target: 'https://www.instagram.com',
    changeOrigin: true,
    pathRewrite: {
        '^/instagram-api': '', // Removes '/instagram-api' from the request path
    },
    onProxyReq: (proxyReq, req, res) => {
        // You can modify the request headers here if needed
    },
    onProxyRes: (proxyRes, req, res) => {
        // Modify the response headers if needed
    }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

const hardcodedRedirectURI = 'https://follow-me-nbqo-7iyt678o3-arygoel42s-projects.vercel.app/api/callback';

const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
};

app.get('/api/auth/instagram', async (req, res) => {
    res.redirect(`https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectURI}&scope=user_profile,user_media&response_type=code`);
    console.log('authenticating user');
});

app.get('/api/callback', async (req, res) => {
    const { code } = req.query;
    res.send('code received');

    if (!code) {
        res.send("Authentication failed");
        return;
    }

    try {
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', hardcodedRedirectURI);
        params.append('code', code);

        const response = await axios.post('https://api.instagram.com/oauth/access_token', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 25000, // 25 seconds
        });

        // Handle response
        req.session.accessToken = response.data.access_token;
        req.session.userId = response.data.user_id;
        res.redirect('/api/profile');
    } catch (error) {
        console.error('Error exchanging code for token:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred');
    }
});

app.post('/', (req, res) => {
    res.send('Received POST request');
});

app.get('/api/profile', async (req, res) => {
    const access_token = req.session.accessToken;
    const user_id = req.session.userID;

    if (!access_token || !user_id) {
        res.status(401).send('Unauthorized');
        return;
    }

    try {
        const response = await axios.get('https://graph.instagram.com/me', {
            params: {
                fields: 'id,username',
                access_token: access_token,
            }
        });

        res.send(`<h1>Hello, ${response.data.username}!</h1>`);
    } catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred');
    }
});

// HTTPS server setup (optional)
// https.createServer(sslOptions, app).listen(3006, 'localhost', () => {
//     console.log('HTTPS Server running at https://localhost:3006');
// });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

module.exports = app;