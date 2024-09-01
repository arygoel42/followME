const express = require('express');
require('dotenv').config();
const app = express();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { MongoClient, ServerApiVersion } = require('mongodb');






const session = require('express-session');


app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));


//environment variables : add these to your .env file after debugging your code
const redirectURI = process.env.RedirectURI;
const clientId = process.env.instagram_Client_ID;
const clientSecret = process.env.instagram_Client_secret;
const mongoURI = process.env.mongo_URI



const client = new MongoClient(mongoURI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


 //connecting to mondoDB atlas database  
async function connectToDatabase() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    catch (err) {
        console.error('MongoDB connection error:', err);

    }
}

connectToDatabase()


  

//middlewear that could be used to avoid cross origin errors
//sets the header for cross origin requests 
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

//antother middlewear instance that could be used to avoid cors errors 
const cors = require('cors');
app.use(cors({
    origin: 'https://follow-me-nbqo.vercel.app', // Replace with your frontend URL
    credentials: true,
}));


app.get('/api/auth/instagram', async (req, res) => {
   
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    

    res.redirect(`https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectURI}&scope=user_profile,user_media&response_type=code`);
    console.log('authenticating usser')
    
});


 
    app.get('/api/callback/', async (req, res) => { ///reminder pointer
        //gets code from url, query paramters 
        const { code } = req.query;
        console.log("Client IDs:", clientId);
        console.log("Client Secret:", clientSecret);
        console.log("Redirect URI:", redirectURI);
        console.log("Code:", code);
       
    
        try {
            //attaches query string parameters to request body
            const params = new URLSearchParams();
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('grant_type', 'authorization_code');
            params.append('redirect_uri', redirectURI);
            params.append('code', code);
    
            console.log("Request Params:", params.toString());
            //send reuqest to instagram for accsess code with the request body
            const response = await axios.post('https://api.instagram.com/oauth/access_token', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',


                },
                
                
            });
            

              
    
            // Handle response
            //adding the access token to the database
                async function createAccessCollection() {
                const db = client.db('Instagram_API');
                const accessCollection = db.collection('Access');
              
                // Insert a document into the collection
                const access = { accessToken: response.data.access_token, userID: response.data.user_id };
                const result = await accessCollection.insertOne(access);
                console.log(result);
              }
            createAccessCollection()
           
            res.redirect('/api/profile');
        } catch (error) {
            console.error('Error exchanging code for token:', error.response ? error.response.data : error.message);
            res.status(500).send('An error occurred');
        }
    })
 

app.get('/api/profile', async (req, res) => {


    try {

        const db = client.db('Instagram_API');
        const accessCollection = db.collection('Access');
        //returns the most recent entry and limits to 1 and sorts by decending order
        const recentEntry = await accessCollection.find().sort({ _id: -1 }).limit(1).toArray();
        console.log(recentEntry);
        if (recentEntry.length > 0) {
            accToken = recentEntry[0].accessToken; // Assign the token to accToken
        } else {
            return res.send('No data found');
        }
        //deletes the oldest entry to avoid overloading the database
        if (recentEntry.lenght > 3) {
            oldestEntry = await accessCollection.find().sort({ _id: 1 }).limit(1).toArray();
            //deletes by the id found in the oldest entry
            await accessCollection.deleteOne({ _id: oldestEntry[0]._id });
            console.log('Oldest entry deleted:', oldestEntry[0]);
        }

    }

    catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred');
    }
        
    //pulls data from isntagram api 
    try {
        response = await axios.get('https://graph.instagram.com/me', {
            params: {
                fields: 'id,username,followers_count,media_count',
                access_token: accToken,
            }
        }
        )

        console.log(response.data.username, response.data.followers_count)
    
    }

    catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred');
    }
//pulls data from instagram api and gets the most recent media
    try {
         mediaResponse = await axios.get('https://graph.instagram.com/me/media', {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink',
                access_token: accToken,
            }
        })
    }


    
    catch (error) {
        console.error('Error fetching user profile:', error.response ? error.response.data : error.message);
        res.status(500).send('An error occurred');
    }


    res.send({ username: response.data.username,  media_count: response.data.media_count, media: mediaResponse.data.data[0].media_url, caption: mediaResponse.data.data[0].caption, followers_count: response.data.followers_count })
})




//catchcall when no backend routes are called. sends index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
  
module.exports = app;
