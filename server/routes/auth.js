import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "dte-high-fidelity-secret";
// SYSTEM ARCHITECT ACCOUNT
const users = [
    {
        id: "dte-architect",
        email: "drewt@dte.solutions",
        password: "password", // Change in production
        name: "Drew Ernst",
        onboardingCompleted: false
    }
];
export const handleMe = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "Authentication token missing." });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find(u => u.id === decoded.id);
        if (!user) {
            return res.status(404).json({ message: "User entity not found." });
        }
        // Return essential user info without sensitive details like password
        res.json({ id: user.id, email: user.email, name: user.name, onboardingCompleted: user.onboardingCompleted });
    }
    catch (err) {
        res.status(401).json({ message: "Invalid or expired token." });
    }
};
export const handleLogin = (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials. Verification failed." });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, onboardingCompleted: user.onboardingCompleted } });
};
export const handleSignup = (req, res) => {
    const { email, password, name } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: "Entity already exists in the DTE ecosystem." });
    }
    const newUser = { id: Date.now().toString(), email, password, name, onboardingCompleted: false };
    users.push(newUser);
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name, onboardingCompleted: newUser.onboardingCompleted } });
};
export const handleUpdateProfile = (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ message: "Authentication required." });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userIndex = users.findIndex(u => u.id === decoded.id);
        if (userIndex === -1) {
            return res.status(404).json({ message: "Entity not found." });
        }
        users[userIndex] = { ...users[userIndex], ...req.body };
        res.json({ message: "Profile synchronized with Ecosystem.", user: users[userIndex] });
    }
    catch (err) {
        res.status(401).json({ message: "Session expired or invalid token." });
    }
};
