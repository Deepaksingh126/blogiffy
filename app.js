require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const userRouter = require('./routes/user');
const blogRouter = require('./routes/blog');
const cookieParser = require('cookie-parser');
const { checkForAuthenticationCookie } = require("./middlewares/authentication");

const Blogs = require('./models/blog');
const User = require('./models/user');

const port = process.env.PORT;
const app = express();

mongoose.connect(process.env.MONGO_URI).then(e => console.log('mongodb connected'));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve('./public')));

app.use('/user', userRouter);
app.use('/blog', blogRouter);

app.get('/', async (req, res) => {
    const allBlogs = await Blogs.find({});
    res.render('home', {
        user: req.user,
        blogs: allBlogs,
    })
})

app.listen(port, () => {
    console.log(`your server is running port:${port}`);
})