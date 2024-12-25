const express = require('express');
const app = express();
const User = require('./models/user'); // Ensure the User model is in the correct path
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const session = require('express-session'); // Import express-session

// MongoDB connection URI
const uri = 'mongodb://localhost:27017/Login';

// Connect to MongoDB
mongoose.connect(uri)
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Session middleware configuration
app.use(session({
    secret: 'mysecretkey', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day session duration
}));

// Middleware to make user available in all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Home route
app.get('/', (req, res) => {
    res.render('home');
});

// Register form route
app.get('/register', (req, res) => {
    res.render('register');
});

// Handle user registration
app.post('/register', async (req, res) => {
    const { password, username } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const user = new User({
        username,
        password: hash
    });
    await user.save();
    res.redirect('/login');
});

// Login form route
app.get('/login', (req, res) => {
    res.render('login');
});

// Handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.send('User not found');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
        req.session.user = user; // Store user in session
        res.redirect('/secret');
    } else {
        res.send('Invalid password. Please try again.');
    }
});

// Secret page route (requires login to access)
app.get('/secret', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('secret', { username: req.session.user.username });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.send('Error logging out');
        }
        res.redirect('/login');
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`http://localhost:${port}`);
});
