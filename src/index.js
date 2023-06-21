const express = require("express");
const app = express();

require("./db/mongoose");

const userRoute = require("./routes/user");
const taskRoute = require("./routes/task");

const port = process.env.PORT || 3000;
app.use(express.json());
app.use(userRoute);
app.use(taskRoute);

app.listen(port, () => {
    console.log("server running on port " + port);
});
