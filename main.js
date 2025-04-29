const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const usersFilePath = path.join(__dirname, "users.json");

async function getAllBooks() {
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

        console.log("Books about JavaScript:");
        console.log(JSON.stringify(books, null, 2));
        return books;
    } catch (error) {
        console.error("Error fetching books:", error.message);
        throw error;
    }
}

async function getBookByISBN(isbn) {
    try {
        // Using Open Library API to get book by ISBN
        const response = await axios.get(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
        );

        // The response format is an object with ISBN:number as the key
        const key = `ISBN:${isbn}`;
        const bookData = response.data[key];

        if (!bookData) {
            console.log(`No book found with ISBN: ${isbn}`);
            return null;
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

        console.log(`Book details for ISBN ${isbn}:`);
        console.log(JSON.stringify(book, null, 2));
        return book;
    } catch (error) {
        console.error(`Error fetching book with ISBN ${isbn}:`, error.message);
        throw error;
    }
}

async function getBooksByAuthor(authorName) {
    try {
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

        console.log(`Books by ${authorName}:`);
        console.log(JSON.stringify(books, null, 2));
        return books;
    } catch (error) {
        console.error(
            `Error fetching books by author ${authorName}:`,
            error.message
        );
        throw error;
    }
}

async function getBooksByTitle(title) {
    try {
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

        console.log(`Books with title containing "${title}":`);
        console.log(JSON.stringify(books, null, 2));
        return books;
    } catch (error) {
        console.error(`Error fetching books with title "${title}":`, error.message);
        throw error;
    }
}

async function getBookReviews(bookId) {
    try {
        // const response = await axios.get(`https://api.nytimes.com/svc/books/v3/reviews.json?isbn=${isbn}&api-key=YOUR_API_KEY`);

        // Instead, we'll simulate a response using the Open Library API with work ID
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

        console.log(`Reviews for book "${bookInfo.title}":`);
        console.log(JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error(
            `Error fetching reviews for book ID ${bookId}:`,
            error.message
        );
        throw error;
    }
}

// File path for storing user data

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

// Using async/await to register a new user
async function registerUser(userData) {
    try {
        // Validate user data
        if (!userData.username || !userData.email || !userData.password) {
            throw new Error("Username, email, and password are required");
        }

        // Read existing users
        const users = readUsers();

        // Check if username or email already exists
        if (users.find((user) => user.username === userData.username)) {
            throw new Error("Username already exists");
        }

        if (users.find((user) => user.email === userData.email)) {
            throw new Error("Email already exists");
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

        console.log("User registered successfully:");
        console.log(JSON.stringify(userWithoutPassword, null, 2));
        return userWithoutPassword;
    } catch (error) {
        console.error("Error registering user:", error.message);
        throw error;
    }
}

// Call the function with user data
const newUser = {
    username: "johnsmith",
    email: "john.smith@example.com",
    password: "securePassword123",
};

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

// Using async/await to login a user
async function loginUser(credentials) {
    try {
        // Validate credentials
        if (!credentials.email || !credentials.password) {
            throw new Error("Email and password are required");
        }

        // Read users from file
        const users = readUsers();

        // Find user by email
        const user = users.find((user) => user.email === credentials.email);

        // Check if user exists and password matches
        if (!user || user.password !== credentials.password) {
            throw new Error("Invalid email or password");
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

        console.log("User logged in successfully:");
        console.log(JSON.stringify(loginResult, null, 2));
        return loginResult;
    } catch (error) {
        console.error("Error logging in:", error.message);
        throw error;
    }
}

// Call the function with login credentials
const credentials = {
    email: "john.smith@example.com",
    password: "securePassword123",
};

const reviewsFilePath = path.join(__dirname, "reviews.json");

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

// Using async/await to add or update a book review
async function addOrUpdateReview(bookId, reviewData, token) {
    try {
        // Verify token and get user ID
        const userId = verifyToken(token);
        if (!userId) {
            throw new Error("Unauthorized: Invalid token");
        }

        // Get user information
        const user = getUserById(userId);
        if (!user) {
            throw new Error("User not found");
        }

        // Validate review data
        if (!bookId || !reviewData.rating) {
            throw new Error("Book ID and rating are required");
        }

        // Validate rating
        const rating = Number(reviewData.rating);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            throw new Error("Rating must be a number between 1 and 5");
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
            id:
                existingReviewIndex >= 0 ? reviews[existingReviewIndex].id : Date.now(),
            bookId: bookId,
            userId: userId,
            username: user.username,
            rating: rating,
            comment: reviewData.comment || "",
            bookTitle: bookInfo.title,
            createdAt:
                existingReviewIndex >= 0
                    ? reviews[existingReviewIndex].createdAt
                    : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Update or add the review
        if (existingReviewIndex >= 0) {
            reviews[existingReviewIndex] = reviewObject;
            console.log("Review updated successfully:");
        } else {
            reviews.push(reviewObject);
            console.log("Review added successfully:");
        }

        // Save reviews
        writeReviews(reviews);

        console.log(JSON.stringify(reviewObject, null, 2));
        return reviewObject;
    } catch (error) {
        console.error("Error adding/updating review:", error.message);
        throw error;
    }
}

// Call the function with review data and token
// (Use the token from the login response in Task 7)
const reviewData = {
    rating: 4.5,
    comment:
        "This book was extremely helpful. I learned a lot of new techniques and concepts that I could apply immediately.",
    bookTitle: "JavaScript: The Good Parts",
};

const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTY4MzAyNDkxMCwiZXhwIjoxNjgzMDI4NTEwfQ==.your-signature"; // Replace with your token from Task 7
const bookId = "OL27258W"; // Open Library work ID for "JavaScript: The Good Parts"

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

// Using async/await to delete a book review
async function deleteReview(bookId, reviewId, token) {
    try {
        // Verify token and get user ID
        const userId = verifyToken(token);
        if (!userId) {
            throw new Error("Unauthorized: Invalid token");
        }

        // Read existing reviews
        const reviews = readReviews();

        // Find the review
        const reviewIndex = reviews.findIndex(
            (review) =>
                review.id.toString() === reviewId.toString() && review.bookId === bookId
        );

        if (reviewIndex === -1) {
            throw new Error("Review not found");
        }

        // Check if the review belongs to the authenticated user
        if (reviews[reviewIndex].userId !== userId) {
            throw new Error("Unauthorized: You can only delete your own reviews");
        }

        // Store the review that is about to be deleted for display
        const deletedReview = reviews[reviewIndex];

        // Remove the review from the array
        reviews.splice(reviewIndex, 1);

        // Save the updated reviews
        writeReviews(reviews);

        console.log("Review deleted successfully:");
        console.log(
            JSON.stringify(
                {
                    message: "Review deleted successfully",
                    review: deletedReview,
                },
                null,
                2
            )
        );

        return { message: "Review deleted successfully", review: deletedReview };
    } catch (error) {
        console.error("Error deleting review:", error.message);
        throw error;
    }
}

const reviewId = 1745887407204; // Replace with the actual review ID from Task 8

// Using traditional callbacks with async for fetching all books
function getAllBooksWithCallback(callback) {
    // Using Open Library API to search for books
    axios
        .get("https://openlibrary.org/search.json?q=javascript&limit=10")
        .then((response) => {
            // Process the response to get a cleaner format
            const books = response.data.docs.map((book) => ({
                title: book.title,
                author: book.author_name ? book.author_name.join(", ") : "Unknown",
                first_publish_year: book.first_publish_year || "Unknown",
                isbn: book.isbn ? book.isbn[0] : "Unknown",
            }));

            // Call the callback with the results
            callback(null, books);
        })
        .catch((error) => {
            // Call the callback with the error
            callback(error, null);
        });
}

function searchByISBN(isbn) {
    return new Promise((resolve, reject) => {
        // Using Open Library API to get book by ISBN
        axios
            .get(
                `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
            )
            .then((response) => {
                // The response format is an object with ISBN:number as the key
                const key = `ISBN:${isbn}`;
                const bookData = response.data[key];

                if (!bookData) {
                    reject(new Error(`No book found with ISBN: ${isbn}`));
                    return;
                }

                // Format the book data for a cleaner output
                const book = {
                    title: bookData.title,
                    authors: bookData.authors
                        ? bookData.authors.map((author) => author.name).join(", ")
                        : "Unknown",
                    publisher: bookData.publishers
                        ? bookData.publishers[0].name
                        : "Unknown",
                    publish_date: bookData.publish_date || "Unknown",
                    cover: bookData.cover ? bookData.cover.medium : "No cover available",
                    number_of_pages: bookData.number_of_pages || "Unknown",
                    subjects: bookData.subjects
                        ? bookData.subjects.slice(0, 5).map((subject) => subject.name)
                        : [],
                };

                resolve(book);
            })
            .catch((error) => {
                reject(
                    new Error(`Error fetching book with ISBN ${isbn}: ${error.message}`)
                );
            });
    });
}

// Using async/await to search for books by author
async function searchByAuthor(author) {
    try {
        // URL encode the author name for the API request
        const encodedAuthor = encodeURIComponent(author);

        // Using Open Library API to search for books by the author
        const response = await axios.get(
            `https://openlibrary.org/search.json?author=${encodedAuthor}&limit=10`
        );

        // Check if any books were found
        if (response.data.docs.length === 0) {
            console.log(`No books found for author: ${author}`);
            return [];
        }

        // Process the response to get a cleaner format
        const books = response.data.docs.map((book) => ({
            title: book.title,
            first_publish_year: book.first_publish_year || "Unknown",
            isbn: book.isbn ? book.isbn[0] : "Unknown",
            language: book.language ? book.language[0] : "Unknown",
            subject: book.subject ? book.subject.slice(0, 3) : [],
        }));

        return books;
    } catch (error) {
        console.error(`Error searching books by author ${author}:`, error.message);
        throw error;
    }
}

// Using the async function
async function main() {
    try {
        const author = "Martin Fowler"; // Example author
        console.log(`Searching for books by author: ${author}...`);

        const books = await searchByAuthor(author);

        console.log(`Found ${books.length} books by ${author}:`);
        console.log(JSON.stringify(books, null, 2));
    } catch (error) {
        console.error("Search failed:", error.message);
    }
}

// Function to search for books by title using Promises with async/await
async function searchByTitle(title) {
    try {
        // URL encode the title for the API request
        const encodedTitle = encodeURIComponent(title);

        // Using Open Library API to search for books by title
        const response = await axios.get(
            `https://openlibrary.org/search.json?title=${encodedTitle}&limit=10`
        );

        // Check if any books were found
        if (response.data.docs.length === 0) {
            console.log(`No books found with title containing: ${title}`);
            return [];
        }

        // Process the response to get a cleaner format
        const books = response.data.docs.map((book) => ({
            title: book.title,
            author: book.author_name ? book.author_name.join(", ") : "Unknown",
            first_publish_year: book.first_publish_year || "Unknown",
            isbn: book.isbn ? book.isbn[0] : "Unknown",
            publisher: book.publisher ? book.publisher[0] : "Unknown",
        }));

        return books;
    } catch (error) {
        console.error(`Error searching books by title "${title}":`, error.message);
        throw error;
    }
}

// getAllBooks();
// getBookByISBN("9781449331818");
// getBooksByAuthor("Douglas Crockford");
// getBooksByTitle("JavaScript");
// getBookReviews("OL27258W");
// registerUser(newUser);
// loginUser(credentials);
// addOrUpdateReview(bookId, reviewData, token);
// deleteReview(bookId, reviewId, token);

// // Calling the function with a callback
// console.log("Fetching books with async callback...");
// getAllBooksWithCallback((error, books) => {
//   if (error) {
//     console.error("Error fetching books:", error.message);
//     return;
//   }
//
//   console.log("Books fetched successfully using callback:");
//   console.log(JSON.stringify(books, null, 2));
// });

// Call the function with a valid ISBN
// console.log(`Searching for book with ISBN using Promises...`);
// const isbn = "9781449331818"; // Example: "Learning JavaScript Design Patterns"
//
// searchByISBN(isbn)
//   .then((book) => {
//     console.log(`Book found with ISBN ${isbn}:`);
//     console.log(JSON.stringify(book, null, 2));
//   })
//   .catch((error) => {
//     console.error(error.message);
//   });

// main();

// Using the function with Promise chaining
console.log("Searching for books by title...");
const searchTitle = "Design Patterns"; // Example title to search

searchByTitle(searchTitle)
    .then((books) => {
        console.log(
            `Found ${books.length} books with title containing "${searchTitle}":`
        );
        console.log(JSON.stringify(books, null, 2));
    })
    .catch((error) => {
        console.error("Search failed:", error.message);
    });
