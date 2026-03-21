import mongoose from "mongoose";

export function mongoConnection() {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 1) {
        console.log("MongoDB already connected");
        return;
    }

    try {
        mongoose.set("strictQuery", false);
        mongoose
            .connect(process.env.MONGO_DB_URL, {})
            .then(() => {
                console.log("Connected to MongoDB");
            })
            .catch((error) => {
                console.log("Error In MongoDBConnection", error);
            });
    } catch (error) {
        console.log("Error In Connection Function", error);
    }
}
