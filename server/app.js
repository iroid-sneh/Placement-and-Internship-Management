import dotenv from "dotenv";
dotenv.config({ quiet: true });
import express from "express";
import path from "path";
import routes from "./routes/index.js";
import { mongoConnection } from "./models/connection.js";
import errorHandler from "./src/common/middleware/errorHandler.js";
import swagger from "./src/common/config/swagger.js";
import "./seeder/index.js";

// Suppress MaxListenersExceededWarning during development
if (process.env.NODE_ENV !== "production") {
    process.setMaxListeners(20);
}

const app = express();
const PORT = process.env.PORT || 5001;
mongoConnection();

const __dirname = import.meta.dirname;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }
    return next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/", routes);
app.use("/api/documentation", swagger);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Listening on ${process.env.BASE_URL}:${PORT}`);
});
