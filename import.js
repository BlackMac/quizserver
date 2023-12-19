const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function openDb() {
    return open({
        filename: 'trivia.db',
        driver: sqlite3.Database
    });
}

async function createTable(db) {
    const query = `
        CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            category TEXT NOT NULL,
            difficulty INTEGER DEFAULT 2,
            active INTEGER DEFAULT 1
        )`;
    await db.exec(query);
}

async function parseFile(filePath, category, db) {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let question = '';
    let options = [];
    let correctAnswer = '';

    for await (const line of rl) {
        if (line.startsWith('#Q')) {
            question = line.substring(3).trim();
        } else if (line.startsWith('^')) {
            correctAnswer = line.substring(2).trim();
        } else if (line.match(/^[A-D]\s/)) {
            options.push(line.trim().replace(/^[A-D]\s/, ''));
        } else if (line.trim() === '') {
            await insertQuestion(question, JSON.stringify(options), correctAnswer, category, db);
            options = [];
        }
    }
}

async function insertQuestion(question, options, correctAnswer, category, db) {
    const query = `INSERT INTO questions (question, options, correct_answer, category) VALUES (?, ?, ?, ?)`;
    await db.run(query, question, options, correctAnswer, category);
}

async function main() {
    const db = await openDb();
    await createTable(db);

    const directoryPath = '/Users/lange-hegermann/Development/TriviaGame/OpenTriviaQA/categories'; // Replace with your directory path
    const files = fs.readdirSync(directoryPath);
    for (const file of files) {
        await parseFile(path.join(directoryPath, file), path.parse(file).name, db);
    }

    await db.close();
}

main().catch(err => {
    console.error(err);
});



