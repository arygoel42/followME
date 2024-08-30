const express = require('express');
require('dotenv').config();
const app = express();
const https = require('https');
const fs = require('fs');
const path = require('path');
const axios = require('axios');



const session = require('express-session');


const redirectURI = process.env.RedirectURI;
const clientId = process.env.instagram_Client_ID;
const clientSecret = process.env.instagram_Client_secret;


app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

const cors = require('cors');
app.use(cors({
    origin: 'https://follow-me-nbqo.vercel.app', // Replace with your frontend URL
    credentials: true,
}));



app.use(session({
    secret: 'mongo-alpha-junior', // replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // set to true if using HTTPS
}));


app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));


//catchcall when no backend routes are called

const hardcodedRedirectURI = 'https://follow-me-nbqo-7iyt678o3-arygoel42s-projects.vercel.app/api/callback';
debugging_redirectURI = 'https://follow-me-nbqo.vercel.app/api/callback';



const sslOptions = {
    key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
};

app.get('/api/auth/instagram', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    

    res.redirect(`https://api.instagram.com/oauth/authorize?client_id=8852423798110118&redirect_uri=${debugging_redirectURI}&scope=user_profile,user_media&response_type=code`);
    console.log('authenticating user')

   
    
    
    
});

 //app.get('/api/callback' , async (req, res) => {

 
    app.get('/api/callback/', async (req, res) => { ///reminder pointer
        const { code } = req.query;
        console.log("Client ID:", '8852423798110118');
        console.log("Client Secret:", '211593af305e2f28b2e464637c56be7b');
        console.log("Redirect URI:", debugging_redirectURI);
        console.log("Code:", code);
        // res.send('Received GET request');
    
        // if (!code) {
        //     res.send("Authentication failed");
        //     return;
        // } else {
        //     console.log("Received authentication code:", code);
        //     console.log('Sending authentication code');
        //     console.log("Redirect URI:", hardcodedRedirectURI);
        // }
    
        try {
            const params = new URLSearchParams();
            params.append('client_id', '8852423798110118');
            params.append('client_secret', '211593af305e2f28b2e464637c56be7b');
            params.append('grant_type', 'authorization_code');
            params.append('redirect_uri', 'https://follow-me-nbqo.vercel.app/api/callback');
            params.append('code', code);
    
            console.log("Request Params:", params.toString());
    
            const response = await axios.post('https://api.instagram.com/oauth/access_token', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',


                },
                
                
            });
    
            // Handle response
            req.session.accessToken = response.data.access_token;
            req.session.userId = response.data.user_id;
            res.redirect('/api/profile');
        } catch (error) {
            console.error('Error exchanging code for token:', error.response ? error.response.data : error.message);
            res.status(500).send('An error occurred');
        }
    })
  //  })



app.post('/', (req, res) => {

    
    res.send('Received POST request');
});




app.get('/api/profile', async (req, res) => {
   
    const access_token = req.session.accessToken;
    const user_id = req.session.userID;
    console.log(access_token)
    console.log(user_id)

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
        }
        )

        res.send(`<h1>Hello, ${response.data.username}!</h1>`);
    
    }

    catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred');
    }
})
// Using https.createServer with SSL options for HTTPS server
// https.createServer(sslOptions, app).listen(3006, '0.0.0.0', () => {
//     console.log('HTTPS Server running at https://localhost:3007');
// });

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
  
module.exports = app;
// app.listen(3006, () => {
//     console.log('HTTP Server running at http://localhost:3006');
// });

// https.createServer(sslOptions, app).listen(3006, 'localhost', () => {
//     console.log('HTTPS Server running at https://localhost:3006');
//   });