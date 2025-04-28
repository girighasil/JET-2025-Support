import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage, verifyPassword } from "./storage";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email?: string | null;
      mobileNumber: string;
      fullName: string;
      role: string;
    }
  }
}

const PostgresSessionStore = connectPg(session);

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "maths-magic-town-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    })
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Convert username to lowercase for case-insensitive authentication
        const lowercaseUsername = username.toLowerCase();
        const user = await storage.getUserByUsername(lowercaseUsername);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        const isValid = await verifyPassword(password, user.password);
        
        if (!isValid) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"));
      }
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Auth Routes
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/register", async (req, res) => {
    try {
      const userData = req.body;
      
      // Convert username to lowercase for case-insensitive checks
      if (userData.username) {
        userData.username = userData.username.toLowerCase();
      }
      
      // Check if username exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email exists (only if email is provided)
      if (userData.email && userData.email.trim() !== '') {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // Check if mobile number exists
      if (!userData.mobileNumber) {
        return res.status(400).json({ message: "Mobile number is required" });
      }
      
      // Create user with student role by default
      const user = await storage.createUser({
        ...userData,
        role: userData.role || "student"
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      if (error.message && error.message.includes('mobile_number_unique')) {
        return res.status(400).json({ message: "Mobile number already in use" });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });
}