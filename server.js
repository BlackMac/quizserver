const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const app = express();
const port = 3000;

app.use(express.json());

async function openDb() {
    return open({
        filename: 'trivia.db',
        driver: sqlite3.Database
    });
}

// GET /questions/{id}
app.get('/questions/:id', async (req, res) => {
    try {
        const db = await openDb();
        const question = await db.get('SELECT * FROM questions WHERE id = ?', req.params.id);
        await db.close();
        question ? res.json(question) : res.status(404).send('Question not found');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /questions/ with pagination
app.get('/questions', async (req, res) => {
    try {
        const { category, difficulty, page = 1, limit = 100 } = req.query;
        const offset = (page - 1) * limit;

        const db = await openDb();
        const query = `
            SELECT * FROM questions 
            WHERE (? IS NULL OR category = ?) 
            AND (? IS NULL OR difficulty = ?)
            LIMIT ? OFFSET ?`;
        const questions = await db.all(query, [category, category, difficulty, difficulty, limit, offset]);
        await db.close();

        res.json(questions);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// PUT /questions/{id}
app.put('/questions/:id', async (req, res) => {
    try {
        const db = await openDb();
        const { difficulty, active } = req.body;
        const updateQuery = 'UPDATE questions SET difficulty = ?, active = ? WHERE id = ?';
        const changes = await db.run(updateQuery, [difficulty, active, req.params.id]);
        await db.close();
        changes.changes > 0 ? res.send('Question updated successfully') : res.status(404).send('Question not found');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/categories', async (req, res) => {
    try {
        const db = await openDb();
        const categories = await db.all('SELECT DISTINCT category FROM questions');
        await db.close();
        res.json(categories.map(cat => cat.category));
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /quiz with categories and count
app.get('/quiz', async (req, res) => {
    try {
        const { categories, count = 10 } = req.query;
        const categoryList = categories ? categories.split(',') : [];

        const db = await openDb();
        let query = `
            SELECT * FROM questions 
            WHERE category IN (${categoryList.map(() => '?').join(',')})
            ORDER BY RANDOM() 
            LIMIT ?`;
        
        const randomQuestions = await db.all(query, [...categoryList, count]);
        await db.close();

        res.json(randomQuestions);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
