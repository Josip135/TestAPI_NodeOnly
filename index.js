import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const port = 8000;

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM task ORDER BY id ASC");
    const task = result.rows;

    res.status(200).render("api.ejs", {
      taskList: task,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error!" });
  }
});

app.post("/addtask", async (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.status(400).json({ message: "Type something to add new task!" });
  }

  try {
    const result = await db.query("INSERT INTO task (text) VALUES ($1)", [text]);
    res.status(200).redirect("/");
  } catch (err) {
    console.log(err);
    res.render("err");
  }
});

app.post("/deletetask", async (req, res) => {
  const id = req.body.deleteTask;
  try {
    await db.query("DELETE FROM task WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/edit", async (req, res) => {

  const tekst = req.body.editedText;
  const id = req.body.id;

  try {
    await db.query("UPDATE task SET text = ($1) WHERE id = $2", [tekst, id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.post("/search/:id", async (req, res) => {
  const id = req.body.searchID;

  if (!id) {
    return res.status(400).json({ message: "Type an ID to find a task" });
  }

  try {
    const result = await db.query("SELECT * FROM task WHERE id = $1", [id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "No tasks with that text!" });
    }
    const task = result.rows;
    res.render("api.ejs", {
      taskList: task,
    });
  } catch (err) {
    console.log(err);
  }
})

app.post("/searchText/:text", async (req, res) => {
  const text = req.body.searchText;

  if (!text) {
    return res.status(400).json({ message: "Type something to find a task" });
  }

  try {
    const result = await db.query("SELECT * FROM task WHERE LOWER (text) LIKE '%' || $1 || '%'", [text.toLowerCase()]);

    if (!result.rows.length) {
      return res.status(500).json({ message: "No tasks with that text!" });
    }

    const task = result.rows;
    res.render("api.ejs", {
      taskList: task,
    });


  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Nešto je pošlo po krivu!" });
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});