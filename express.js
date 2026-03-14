const express = require("express");
const rateLimit = require("express-rate-limit");
const fs = require("fs"); // File system access module

const app = express();

// 1. Define the rate limiter for the file access route
const fileAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message:
    "Too many file access requests from this IP, please try again after 15 minutes",
  statusCode: 429, // 429 Too Many Requests status
  headers: true, // Send rate limit info in the headers
});

// 2. Apply the middleware to the specific route
app.get("/download-file", fileAccessLimiter, (req, res) => {
  // Expensive file system operation
  fs.readFile("/path/to/your/file.pdf", (err, data) => {
    if (err) {
      return res.status(500).send("Error reading file");
    }
    res.send(data);
  });
});

// Other routes can have different or no rate limits
app.get("/", (req, res) => {
  res.send("Hello World, this route is not rate limited");
});

app.listen(3000, () => console.log("Server running on port 3000"));
