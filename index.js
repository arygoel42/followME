const express = require('express');
require('dotenv').config();
const app = express();

app.use(express.json())

redirectURI = process.env.RedirectURI
client_id = process.env.instagram_Client_ID
client_secret = process.env.instagram_Client_Secret





app.get('/auth/instagram', (req, res) => {
    res.redirect(`https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`)
})

app.post('/', (req, res) => {})





app.listen(3006, () => {console.log('server is connected to port 3006')})