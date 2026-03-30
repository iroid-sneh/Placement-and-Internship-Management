import mongoose from "mongoose";

export async function mongoConnection() {
    if (mongoose.connection.readyState === 1) {
        console.log("MongoDB already connected");
        return;
    }

    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(process.env.MONGO_DB_URL, {});
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error In Connection Function", error);
        throw error;
    }
}
