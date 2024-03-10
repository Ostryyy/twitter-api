const router = require('express').Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

router.post('/register', async (req, res) => {
    try {
        const { username, email, password, bio } = req.body;

        if (!username || !email || !password) {
            return res.status(400).send({ message: 'Username, email, and password are required.' });
        }

        const user = await User.create({
            username,
            email,
            password, 
            bio: bio || '', 
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).send({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                bio: user.bio,
                followersCount: user.followersCount,
                followingCount: user.followingCount,
                createdAt: user.createdAt,
            },
            token
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).send({ message: 'Username or email already exists.' });
        }
        console.error(error);
        res.status(400).send(error);
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).send({ error: 'Email or password is incorrect' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
