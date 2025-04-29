const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Middleware to parse JSON bodies
app.use(express.json());

// GET endpoint to fetch JavaScript books
app.get('/api/books/javascript', async (req, res) => {
    try {
        // Using Open Library API to search for books
        const response = await axios.get(
            "https://openlibrary.org/search.json?q=javascript&limit=10"
        );

        // Process the response to get a cleaner format
        const books = response.data.docs.map((book) => ({
            title: book.title,
            author: book.author_name ? book.author_name.join(", ") : "Unknown",
            first_publish_year: book.first_publish_year || "Unknown",
            isbn: book.isbn ? book.isbn[0] : "Unknown",
        }));

        return res.status(200).json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error("Error fetching books:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch books"
        });
    }
});

// Make the query parameter customizable
app.get('/api/books', async (req, res) => {
    try {
        const query = req.query.q || 'javascript';
        const limit = req.query.limit || 10;

        const response = await axios.get(
            `https://openlibrary.org/search.json?q=${query}&limit=${limit}`
        );

        const books = response.data.docs.map((book) => ({
            title: book.title,
            author: book.author_name ? book.author_name.join(", ") : "Unknown",
            first_publish_year: book.first_publish_year || "Unknown",
            isbn: book.isbn ? book.isbn[0] : "Unknown",
            reviews:{}
        }));

        return res.status(200).json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error("Error fetching books:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch books"
        });
    }
});


// GET endpoint to fetch a book by ISBN
app.get('/api/books/isbn/:isbn', async (req, res) => {
    try {
        const { isbn } = req.params;

        // Using Open Library API to get book by ISBN
        const response = await axios.get(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
        );

        // The response format is an object with ISBN:number as the key
        const key = `ISBN:${isbn}`;
        const bookData = response.data[key];

        if (!bookData) {
            return res.status(404).json({
                success: false,
                error: `No book found with ISBN: ${isbn}`
            });
        }

        // Format the book data for a cleaner output
        const book = {
            title: bookData.title,
            authors: bookData.authors
                ? bookData.authors.map((author) => author.name).join(", ")
                : "Unknown",
            publisher: bookData.publishers ? bookData.publishers[0].name : "Unknown",
            publish_date: bookData.publish_date || "Unknown",
            cover: bookData.cover ? bookData.cover.medium : "No cover available",
            number_of_pages: bookData.number_of_pages || "Unknown",
            subjects: bookData.subjects
                ? bookData.subjects.slice(0, 5).map((subject) => subject.name)
                : [],
        };

        return res.status(200).json({
            success: true,
            data: book
        });
    } catch (error) {
        console.error(`Error fetching book with ISBN ${req.params.isbn}:`, error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch book details"
        });
    }
});


// GET endpoint to fetch books by author
app.get('/api/books/author/:authorName', async (req, res) => {
    try {
        const { authorName } = req.params;

        // URL encode the author name for the API request
        const encodedAuthor = encodeURIComponent(authorName);

        // Using Open Library API to search for books by the author
        const response = await axios.get(
            `https://openlibrary.org/search.json?author=${encodedAuthor}&limit=10`
        );

        // Process the response to get a cleaner format
        const books = response.data.docs.map((book) => ({
            title: book.title,
            first_publish_year: book.first_publish_year || "Unknown",
            isbn: book.isbn ? book.isbn[0] : "Unknown",
            language: book.language ? book.language[0] : "Unknown",
        }));

        return res.status(200).json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error(
            `Error fetching books by author ${req.params.authorName}:`,
            error.message
        );
        return res.status(500).json({
            success: false,
            error: "Failed to fetch books by author"
        });
    }
});

// GET endpoint to fetch books by title
app.get('/api/books/title/:title', async (req, res) => {
    try {
        const { title } = req.params;

        // URL encode the title for the API request
        const encodedTitle = encodeURIComponent(title);

        // Using Open Library API to search for books by title
        const response = await axios.get(
            `https://openlibrary.org/search.json?title=${encodedTitle}&limit=10`
        );

        // Process the response to get a cleaner format
        const books = response.data.docs.map((book) => ({
            title: book.title,
            author: book.author_name ? book.author_name.join(", ") : "Unknown",
            first_publish_year: book.first_publish_year || "Unknown",
            isbn: book.isbn ? book.isbn[0] : "Unknown",
            publisher: book.publisher ? book.publisher[0] : "Unknown",
        }));

        return res.status(200).json({
            success: true,
            data: books
        });
    } catch (error) {
        console.error(`Error fetching books with title "${req.params.title}":`, error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch books by title"
        });
    }
});


// GET endpoint to fetch book reviews by book ID
app.get('/api/books/reviews/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Using Open Library API to get book information by work ID
        const response = await axios.get(
            `https://openlibrary.org/works/${bookId}.json`
        );

        // Extract basic book information
        const bookInfo = {
            title: response.data.title,
            subjects: response.data.subjects || [],
            description: response.data.description || "No description available",
        };

        // Simulate reviews since Open Library doesn't provide them directly
        const simulatedReviews = [
            {
                reviewer: "John Smith",
                rating: 4.5,
                date: "2023-04-15",
                review: `I found "${bookInfo.title}" to be an excellent read. The concepts were well explained and the examples were very practical.`,
            },
            {
                reviewer: "Jane Doe",
                rating: 5,
                date: "2023-03-22",
                review: `"${bookInfo.title}" is one of the best books I've read on this subject. Highly recommended for beginners and experts alike.`,
            },
        ];

        const result = {
            book: bookInfo,
            reviews: simulatedReviews,
        };

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error(
            `Error fetching reviews for book ID ${req.params.bookId}:`,
            error.message
        );
        return res.status(500).json({
            success: false,
            error: "Failed to fetch book reviews"
        });
    }
});


// Middleware to parse JSON bodies
app.use(express.json());

// Define path for users file
const usersFilePath = './users.json';
const reviewsFilePath = path.join(__dirname, "reviews.json");

// Function to read existing users from file
function readUsers() {
    try {
        if (fs.existsSync(usersFilePath)) {
            const data = fs.readFileSync(usersFilePath, "utf8");
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error("Error reading users file:", error.message);
        return [];
    }
}

// Function to write users to file
function writeUsers(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), "utf8");
    } catch (error) {
        console.error("Error writing users file:", error.message);
    }
}

// Generate a simple JWT token
function generateToken(userId) {
    // In a real app, use a proper JWT library
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
    };

    const headerBase64 = Buffer.from(JSON.stringify(header)).toString("base64");
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    // In a real app, use a proper secret key
    const secretKey = "your-secret-key-for-jwt-signing";
    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(`${headerBase64}.${payloadBase64}`)
        .digest("base64");

    return `${headerBase64}.${payloadBase64}.${signature}`;
}

// POST endpoint to register a new user
app.post('/api/auth/register', async (req, res) => {
    try {
        const userData = req.body;

        // Validate user data
        if (!userData.username || !userData.email || !userData.password) {
            return res.status(400).json({
                success: false,
                error: "Username, email, and password are required"
            });
        }

        // Read existing users
        const users = readUsers();

        // Check if username or email already exists
        if (users.find((user) => user.username === userData.username)) {
            return res.status(409).json({
                success: false,
                error: "Username already exists"
            });
        }

        if (users.find((user) => user.email === userData.email)) {
            return res.status(409).json({
                success: false,
                error: "Email already exists"
            });
        }

        // Create new user object with ID and registration date
        const newUser = {
            id: users.length + 1,
            username: userData.username,
            email: userData.email,
            password: userData.password, // In a real app, always hash passwords!
            registeredAt: new Date().toISOString(),
        };

        // Add the new user to the array
        users.push(newUser);

        // Save the updated users array
        writeUsers(users);

        // Return the user object (without password) for display
        const { password, ...userWithoutPassword } = newUser;

        return res.status(201).json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("Error registering user:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to register user"
        });
    }
});

// POST endpoint to login a user
app.post('/api/auth/login', async (req, res) => {
    try {
        const credentials = req.body;

        // Validate credentials
        if (!credentials.email || !credentials.password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required"
            });
        }

        // Read users from file
        const users = readUsers();

        // Find user by email
        const user = users.find((user) => user.email === credentials.email);

        // Check if user exists and password matches
        if (!user || user.password !== credentials.password) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password"
            });
        }

        // Generate authentication token
        const token = generateToken(user.id);

        // User information to return (excluding password)
        const { password, ...userWithoutPassword } = user;

        const loginResult = {
            user: userWithoutPassword,
            token: token,
            expiresIn: "1 hour",
        };

        return res.status(200).json({
            success: true,
            data: loginResult
        });
    } catch (error) {
        console.error("Error logging in:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to log in"
        });
    }
});

// GET endpoint to get all users (typically would require authentication)
app.get('/api/users', (req, res) => {
    try {
        const users = readUsers();
        // Remove passwords before sending
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        return res.status(200).json({
            success: true,
            data: usersWithoutPasswords
        });
    } catch (error) {
        console.error("Error fetching users:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch users"
        });
    }
});


// Function to read existing reviews from file
function readReviews() {
    try {
        if (fs.existsSync(reviewsFilePath)) {
            const data = fs.readFileSync(reviewsFilePath, "utf8");
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error("Error reading reviews file:", error.message);
        return [];
    }
}

// Function to write reviews to file
function writeReviews(reviews) {
    try {
        fs.writeFileSync(reviewsFilePath, JSON.stringify(reviews, null, 2), "utf8");
    } catch (error) {
        console.error("Error writing reviews file:", error.message);
    }
}

// Function to verify token
function verifyToken(token) {
    try {
        // In a real app, verify JWT signature and expiration
        if (!token || typeof token !== "string") {
            return null;
        }

        // Extract user ID from token (simplified)
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        return payload.sub; // user ID
    } catch (error) {
        console.error("Error verifying token:", error.message);
        return null;
    }
}

// Function to get user by ID
function getUserById(userId) {
    try {
        if (fs.existsSync(usersFilePath)) {
            const users = JSON.parse(fs.readFileSync(usersFilePath, "utf8"));
            return users.find((user) => user.id === userId);
        }
        return null;
    } catch (error) {
        console.error("Error getting user:", error.message);
        return null;
    }
}

// Middleware to authenticate requests
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized: No token provided"
        });
    }

    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized: Invalid token"
        });
    }

    // Add user ID to the request object
    req.userId = userId;
    next();
}

// POST endpoint to add or update a book review
app.post('/api/books/:bookId/reviews', authenticate, async (req, res) => {
    try {
        const { bookId } = req.params;
        const reviewData = req.body;
        const userId = req.userId;

        // Get user information
        const user = getUserById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // Validate review data
        if (!bookId || !reviewData.rating) {
            return res.status(400).json({
                success: false,
                error: "Book ID and rating are required"
            });
        }

        // Validate rating
        const rating = Number(reviewData.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: "Rating must be a number between 1 and 5"
            });
        }

        // Get book information (simulate with a request or use a cached version)
        // For real implementation: const bookResponse = await axios.get(`https://openlibrary.org/works/${bookId}.json`);

        // For this demo, we'll simulate book info
        const bookInfo = {
            id: bookId,
            title: reviewData.bookTitle || "Unknown Book Title",
        };

        // Read existing reviews
        const reviews = readReviews();

        // Check if review already exists
        const existingReviewIndex = reviews.findIndex(
            (review) => review.bookId === bookId && review.userId === userId
        );

        const reviewObject = {
            id: existingReviewIndex >= 0 ? reviews[existingReviewIndex].id : Date.now(),
            bookId: bookId,
            userId: userId,
            username: user.username,
            rating: rating,
            comment: reviewData.comment || "",
            bookTitle: bookInfo.title,
            createdAt: existingReviewIndex >= 0
                ? reviews[existingReviewIndex].createdAt
                : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Update or add the review
        if (existingReviewIndex >= 0) {
            reviews[existingReviewIndex] = reviewObject;
            console.log("Review updated successfully");
        } else {
            reviews.push(reviewObject);
            console.log("Review added successfully");
        }

        // Save reviews
        writeReviews(reviews);

        return res.status(200).json({
            success: true,
            data: reviewObject,
            message: existingReviewIndex >= 0 ? "Review updated successfully" : "Review added successfully"
        });
    } catch (error) {
        console.error("Error adding/updating review:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to add/update review"
        });
    }
});

// DELETE endpoint to delete a book review
app.delete('/api/books/:bookId/reviews/:reviewId', authenticate, async (req, res) => {
    try {
        const { bookId, reviewId } = req.params;
        const userId = req.userId;

        // Read existing reviews
        const reviews = readReviews();

        // Find the review
        const reviewIndex = reviews.findIndex(
            (review) =>
                review.id.toString() === reviewId.toString() &&
                review.bookId === bookId
        );

        if (reviewIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Review not found"
            });
        }

        // Check if the review belongs to the authenticated user
        if (reviews[reviewIndex].userId !== userId) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized: You can only delete your own reviews"
            });
        }

        // Store the review that is about to be deleted for display
        const deletedReview = reviews[reviewIndex];

        // Remove the review from the array
        reviews.splice(reviewIndex, 1);

        // Save the updated reviews
        writeReviews(reviews);

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: deletedReview
        });
    } catch (error) {
        console.error("Error deleting review:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to delete review"
        });
    }
});

// GET endpoint to get all reviews for a book
app.get('/api/books/:bookId/reviews', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Read all reviews
        const reviews = readReviews();

        // Filter reviews for the specific book
        const bookReviews = reviews.filter(review => review.bookId === bookId);

        return res.status(200).json({
            success: true,
            data: bookReviews
        });
    } catch (error) {
        console.error("Error fetching reviews:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch reviews"
        });
    }
});

// DELETE endpoint to delete a specific user's review for a book
app.delete('/api/books/:bookId/user-reviews', authenticate, async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.userId;

        // Read existing reviews
        const reviews = readReviews();

        // Find the review by bookId and userId
        const reviewIndex = reviews.findIndex(
            (review) => review.bookId === bookId && review.userId === userId
        );

        if (reviewIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Review not found for this user and book"
            });
        }

        // Store the review that is about to be deleted for display
        const deletedReview = reviews[reviewIndex];

        // Remove the review from the array
        reviews.splice(reviewIndex, 1);

        // Save the updated reviews
        writeReviews(reviews);

        return res.status(200).json({
            success: true,
            message: "Your review for this book has been deleted successfully",
            data: deletedReview
        });
    } catch (error) {
        console.error("Error deleting user review:", error.message);
        return res.status(500).json({
            success: false,
            error: "Failed to delete your review"
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});