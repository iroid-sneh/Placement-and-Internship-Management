import dotenv from "dotenv";
dotenv.config({ quiet: true });
import express from "express";
import path from "path";
import routes from "./routes/index.js";
import { mongoConnection } from "./models/connection.js";
import errorHandler from "./src/common/middleware/errorHandler.js";
import swagger from "./src/common/config/swagger.js";
import seedAdmin from "./seeder/index.js";
import { SERVER_ROOT } from "./constants/paths.js";

// Suppress MaxListenersExceededWarning during development
if (process.env.NODE_ENV !== "production") {
    process.setMaxListeners(20);
}

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(SERVER_ROOT, "public")));
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
app.set("views", path.join(SERVER_ROOT, "views"));

app.use("/", routes);
app.use("/api/documentation", swagger);
app.use(errorHandler);

async function bootstrap() {
    await mongoConnection();
    await seedAdmin();

    app.listen(PORT, () => {
        console.log(`Listening on ${process.env.BASE_URL}:${PORT}`);
    });
}

bootstrap().catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
});
