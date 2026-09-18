//root / Admin123!

// --- Setup Complete ---
//Teacher: teacher_user / password123
//Student: student_user / password123

const mongoose = require("mongoose");
const { config } = require("dotenv");

const express = require("express"); 
const morgan = require("morgan");

const path = require("path");
const fs = require("fs"); 

const cors = require("cors"); 
const helmet = require("helmet"); 

const error_handler = require("./middleware/errror-handler.middleware");
const not_found_handler = require("./middleware/not-found.middleware");

var app = express(); 
var routes = path.join(__dirname, "routes");

config({ path: path.join(__dirname, ".env") });

async function connect_database() {
    try {
        await mongoose.connect(`mongodb+srv://${process.env.MONGO_DB_URI}?retryWrites=true&w=majority`)
        console.log("Successfully connected to MongoDB.");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    };
};


if (process.env.MODE === "DEV") {
    app.use(morgan("dev"));
};

app.use(cors()); 
app.use(helmet());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.set("trust proxy", true);
app.get("/", (request, response) => {
    response.sendStatus(200)
})

fs.readdirSync(routes).forEach((file) => {
    let file_path = path.join(routes, file);

    if (file.endsWith(".js")) {
        app.use("/v1/", require(file_path)); 
    }
});

app.use(error_handler);
app.use(not_found_handler);

app.listen(process.env.PORT, () => {
    console.log(`Listening: http://localhost:${process.env.PORT}`)
});
connect_database()

