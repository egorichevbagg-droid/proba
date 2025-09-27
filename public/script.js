class BooksApp {
    constructor() {
        this.books = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadBooks();
    }

    bindEvents() {
        // Форма добавления книги
        document.getElementById('addBookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBook();
        });

        // Форма редактирования книги
        document.getElementById('editBookForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateBook();
        });

        // Закрытие модального окна
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Поиск
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterBooks(e.target.value);
        });
    }

    async loadBooks() {
        try {
            const response = await fetch('/api/books');
            const result = await response.json();
            
            if (response.ok) {
                this.books = result.data;
                this.displayBooks(this.books);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Ошибка загрузки книг: ' + error.message);
        }
    }

    displayBooks(books) {
        const booksList = document.getElementById('booksList');
        const booksCount = document.getElementById('booksCount');
        
        booksCount.textContent = books.length;

        if (books.length === 0) {
            booksList.innerHTML = '<p class="no-books">Книги не найдены</p>';
            return;
        }

        booksList.innerHTML = books.map(book => `
            <div class="book-card">
                <div class="book-title">${this.escapeHtml(book.title)}</div>
                <div class="book-info">
                    <strong>Автор:</strong> ${this.escapeHtml(book.author)}<br>
                    <strong>Год:</strong> ${book.year || 'Не указан'}<br>
                    <strong>Жанр:</strong> ${book.genre || 'Не указан'}
                </div>
                <div class="book-actions">
                    <button class="btn-edit" onclick="app.editBook(${book.id})">✏️ Редактировать</button>
                    <button class="btn-delete" onclick="app.deleteBook(${book.id})">🗑️ Удалить</button>
                </div>
            </div>
        `).join('');
    }

    async addBook() {
        const form = document.getElementById('addBookForm');
        const formData = new FormData(form);
        
        const bookData = {
            title: document.getElementById('title').value.trim(),
            author: document.getElementById('author').value.trim(),
            year: document.getElementById('year').value ? parseInt(document.getElementById('year').value) : null,
            genre: document.getElementById('genre').value.trim() || null
        };

        if (!bookData.title || !bookData.author) {
            this.showError('Заполните название и автора');
            return;
        }

        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookData)
            });

            const result = await response.json();

            if (response.ok) {
                form.reset();
                this.loadBooks();
                this.showSuccess('Книга успешно добавлена!');
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Ошибка добавления книги: ' + error.message);
        }
    }

    async editBook(id) {
        try {
            const response = await fetch(`/api/books/${id}`);
            const result = await response.json();

            if (response.ok) {
                this.openEditModal(result.data);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Ошибка загрузки книги: ' + error.message);
        }
    }

    openEditModal(book) {
        document.getElementById('editId').value = book.id;
        document.getElementById('editTitle').value = book.title;
        document.getElementById('editAuthor').value = book.author;
        document.getElementById('editYear').value = book.year || '';
        document.getElementById('editGenre').value = book.genre || '';
        
        document.getElementById('editModal').style.display = 'block';
    }

    async updateBook() {
        const id = document.getElementById('editId').value;
        const bookData = {
            title: document.getElementById('editTitle').value.trim(),
            author: document.getElementById('editAuthor').value.trim(),
            year: document.getElementById('editYear').value ? parseInt(document.getElementById('editYear').value) : null,
            genre: document.getElementById('editGenre').value.trim() || null
        };

        if (!bookData.title || !bookData.author) {
            this.showError('Заполните название и автора');
            return;
        }

        try {
            const response = await fetch(`/api/books/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookData)
            });

            const result = await response.json();

            if (response.ok) {
                this.closeModal();
                this.loadBooks();
                this.showSuccess('Книга успешно обновлена!');
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Ошибка обновления книги: ' + error.message);
        }
    }

    async deleteBook(id) {
        if (!confirm('Вы уверены, что хотите удалить эту книгу?')) {
            return;
        }

        try {
            const response = await fetch(`/api/books/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (response.ok) {
                this.loadBooks();
                this.showSuccess('Книга успешно удалена!');
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            this.showError('Ошибка удаления книги: ' + error.message);
        }
    }

    filterBooks(searchTerm) {
        const filteredBooks = this.books.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.displayBooks(filteredBooks);
    }

    closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    showError(message) {
        alert('Ошибка: ' + message);
    }

    showSuccess(message) {
        alert('✅ ' + message);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация приложения
const app = new BooksApp();

// Глобальные функции для onclick
window.loadBooks = () => app.loadBooks();
window.closeModal = () => app.closeModal();
window.app = app;