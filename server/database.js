const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
	this.dbPath = path.join(__dirname, '..', 'database.sqlite');
	this.db = null;
    }

    async init() {
	return new Promise((resolve, reject) => {
	    console.log('initializing database');

	    this.db = new sqlite3.Database(this.dbPath, async (err) => {
		if (err) {
		    console.error('Error connecting to the database:', err);
		    reject(err);
		    return;
		}

		console.log('connected to the database');

		try {
		    await this.createTables();
		    await this.insertDemoData();
		    console.log('database is ready for work');
		    resolve();
		} catch (error) {
		    console.error('error initializing the databse');
		    reject(error);
		}
	    });
	});
    }

    createTables() {
	return new Promise((resolve, reject) => {
	    this.db.serialize(() => {
	        this.db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT 'default',
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
)
`, (err) => {
    if (err) console.error('Error creating users table:', err);
});
		this.db.run(`
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    difficulty TEXT,
    path TEXT NOT NULL,
    color TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`, (err) => {
    if (err) console.error('Error creating games table:', err);
});
		this.db.run(`
CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    last_played DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE(user_id, game_id)
)
`, (err) => {
    if (err) console.error('Error creating user_progress table:', err);
});
		this.db.run(`
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_id INTEGER,
    achievement_type TEXT NOT NULL,
    achieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
)
`, (err) => {
    if (err) console.error('Error creating achievements table:', err);
});
		resolve();
	    });  
        });
    }

    insertDemoData() {
	return new Promise((resolve, reject) => {
	    const bcrypt = require('bcryptjs');
	    const saltRounds = 10;

	    this.db.serialize(() => {
		this.db.get('SELECT COUNT(*) as count FROM users', async (err, row) => {
		    if (err) {
			reject(err);
			return;
		    }

		    if (row.count === 0) {
			console.log('adding demo-users...');

			const passwordHash = await bcrypt.hash('password123', saltRounds);

			const users = [
			    ['user1', 'user1@example.com', passwordHash],
			    ['demo', 'demo@example.com', passwordHash],
			    ['test', 'test@example.com', passwordHash],
			];

			const stmt = this.db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?,?,?)');

			users.forEach(user => {
			    stmt.run(user, function(err) {
				if (err) console.error('Error inserting user:', err);
			    });
			});

			stmt.finalize();
		    }
		});

		this.db.get('SELECT COUNT(*) as count FROM games', (err, row) => {
		    if (err) {
			reject(err);
			return;
		    }

		    if (row.count === 0) {
			console.log('adding games...');

			const games = [
			    ['Mathimatical game', 'time limited mathimatical problems', '+', 'maths', 'low', '/games/math-quiz/', '#3498db', 'active'],
			    ['Memmory training', 'memmory based match seeking', '*', 'memmory', 'mid-low', '/games/memmory/', '#9b59b6', 'in development']
			];

			const stmt = this.db.prepare(`
INSERT INTO games
(title, description, icon, category, difficulty, path, color, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

			games.forEach(game => {
			    stmt.run(game, function(err) {
				if (err) console.error('Error inserting game:', err);
			    });
			});

			stmt.finalize();
		    }
		});

		resolve();
	    });
	});
    }

    run(query, params = []) {
	return new Promise((resolve, reject) => {
	    this.db.run(query, params, function(err) {
		if (err) {
		    reject(err);
		} else {
		    resolve({ lastID: this.lastID, changes: this.changes });
		}
	    });
	});
    }

    get(query, params = []) {
	return new Promise((resolve, reject) => {
	    this.db.get(query, params, (err, row) => {
		if (err) {
		    reject(err);
		} else {
		    resolve(row);
		}
	    });
	});
    }

    all(query, params = []) {
	return new Promise((resolve, reject) => {
	    this.db.all(query, params, (err, rows) => {
		if (err) {
		    reject(err);
		} else {
		    resolve(rows);
		}
	    }); 
	});
    }

    close() {
	return new Promise((resolve, reject) => {
	    this.db.close((err) => {
		if(err) {
		    reject(err);
		} else {
		    resolve();
		}
	    });
	});
    }
}

module.exports = new Database();
