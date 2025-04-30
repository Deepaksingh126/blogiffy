const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve(`./public/uploads/`));
    },
    filename: function (req, file, cb) {
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
    return res.render("addBlog", {
        user: req.user,
    });
});

router.get("/:id", async (req, res) => {
    try {
        console.log("Attempting to find blog with ID:", req.params.id);
        const blog = await Blog.findById(req.params.id).populate({
            path: 'createdBy',
            select: 'fullName profileImageUrl'  // Explicitly select the fields we need
        });
        
        console.log("Found blog:", blog);
        
        if (!blog) {
            console.log("Blog not found");
            return res.status(404).render("error", { 
                error: "Blog not found",
                user: req.user 
            });
        }

        if (!blog.createdBy) {
            console.log("Blog creator not found");
            return res.status(404).render("error", { 
                error: "Blog creator information not found",
                user: req.user 
            });
        }
        
        const comments = await Comment.find({ blogId: req.params.id }).populate({
            path: 'createdBy',
            select: 'fullName profileImageUrl'
        });
        console.log("Found comments:", comments);

        return res.render("blog", {
            user: req.user,
            blog,
            comments,
        });
    } catch (error) {
        console.error("Error viewing blog:", error);
        return res.status(500).render("error", { 
            error: "An error occurred while viewing the blog: " + error.message,
            user: req.user 
        });
    }
});

router.post("/comment/:blogId", async (req, res) => {
    await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
});

router.post("/", upload.single("coverImage"), async (req, res) => {
    const { title, body } = req.body;
    const blog = await Blog.create({
        body,
        title,
        createdBy: req.user._id,
        coverImageURL: `/uploads/${req.file.filename}`,
    });
    return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;
