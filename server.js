const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Обслуживаем статические файлы

// Подключение к базе данных
const dbPath = path.join(__dirname, 'books.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к БД:', err.message);
    } else {
        console.log('Успешное подключение к БД');
        initializeDatabase();
    }
});

// Инициализация базы данных
function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            year INTEGER,
            genre TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(createTableQuery, (err) => {
        if (err) {
            console.error('Ошибка создания таблицы:', err.message);
        } else {
            console.log('Таблица books готова к работе');
        }
    });
}

// Контроллер для работы с книгами
class BooksController {
    
    // Получить все книги
    static getAllBooks(req, res) {
        const query = "SELECT * FROM books ORDER BY created_at DESC";
        
        db.all(query, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: "Успешное получение списка книг",
                data: rows,
                count: rows.length
            });
        });
    }
    
    // Получить книгу по ID
    static getBookById(req, res) {
        const id = req.params.id;
        const query = "SELECT * FROM books WHERE id = ?";
        
        db.get(query, [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: "Книга не найдена" });
            }
            res.json({
                message: "Книга найдена",
                data: row
            });
        });
    }
    
    // Добавить новую книгу
    static addBook(req, res) {
        const { title, author, year, genre } = req.body;
        
        if (!title || !author) {
            return res.status(400).json({ 
                error: "Поля 'title' и 'author' обязательны" 
            });
        }
        
        const query = `
            INSERT INTO books (title, author, year, genre) 
            VALUES (?, ?, ?, ?)
        `;
        
        db.run(query, [title, author, year, genre], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: "Книга успешно добавлена",
                data: {
                    id: this.lastID,
                    title,
                    author,
                    year,
                    genre
                }
            });
        });
    }
    
    // Обновить книгу
    static updateBook(req, res) {
        const id = req.params.id;
        const { title, author, year, genre } = req.body;
        
        const checkQuery = "SELECT * FROM books WHERE id = ?";
        db.get(checkQuery, [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: "Книга не найдена" });
            }
            
            const updateQuery = `
                UPDATE books 
                SET title = ?, author = ?, year = ?, genre = ?
                WHERE id = ?
            `;
            
            db.run(updateQuery, [
                title || row.title,
                author || row.author,
                year || row.year,
                genre || row.genre,
                id
            ], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({
                    message: "Книга успешно обновлена",
                    data: {
                        id: parseInt(id),
                        title: title || row.title,
                        author: author || row.author,
                        year: year || row.year,
                        genre: genre || row.genre
                    }
                });
            });
        });
    }
    
    // Удалить книгу
    static deleteBook(req, res) {
        const id = req.params.id;
        
        const checkQuery = "SELECT * FROM books WHERE id = ?";
        db.get(checkQuery, [id], (err, row) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!row) {
                return res.status(404).json({ error: "Книга не найдена" });
            }
            
            const deleteQuery = "DELETE FROM books WHERE id = ?";
            db.run(deleteQuery, [id], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({
                    message: "Книга успешно удалена",
                    deletedBook: row
                });
            });
        });
    }
}

// Маршруты API
app.get('/api/books', BooksController.getAllBooks);
app.get('/api/books/:id', BooksController.getBookById);
app.post('/api/books', BooksController.addBook);
app.put('/api/books/:id', BooksController.updateBook);
app.delete('/api/books/:id', BooksController.deleteBook);

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});