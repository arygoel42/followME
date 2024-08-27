const express = require('express');
require('dotenv').config();
const path = require('path');
const axios = require('axios');
const session = require('express-session');

const app = express();

const redirectURI = process.env.RedirectURI;
const clientId = process.env.instagram_Client_ID;
const clientSecret = process.env.instagram_Client_Secret;

app.use(session({
    secret: 'alpha-tiger-mongo',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Set secure: true in production
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/api/auth/instagram', (req, res) => {
    res.redirect(`https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectURI}&scope=user_profile,user_media&response_type=code`);
    console.log('Authenticating user');
});

app.get('/api/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        res.send("Authentication failed");
        return;
    }

    console.log("Received authentication code:", code);

    try {
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', redirectURI);
        params.append('code', code);

        console.log("Request Params:", params.toString());

        const response = await axios.post('https://api.instagram.com/oauth/access_token', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        req.session.accessToken = response.data.access_token;
        req.session.userId = response.data.user_id;
        res.redirect('/api/profile');
    } catch (error) {
        console.error('Error exchanging code for token:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred');
    }
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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

module.exports = app;