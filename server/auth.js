const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');


class Auth {
    constructor() {
	this.JWT_SECRET = 'your-secret-key-change-in-production';
	this.JWT_EXPIRES = '7d';
	this.saltRounds = 10;
    }    

    async register(username, email, password) {
	try {
	    const existingUser = await db.get(
		'SELECT id FROM users WHERE username = ? OR email = ?',
		[username, email]
	    );

	    if (existingUser) {
		throw new Error('User with these name ir email already exists');
	    }

	    const passwordHash = await bcrypt.hash(password, this.saltRounds);

	    const result = await db.run(
		'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
		[username, email, passwordHash]
	    );

	    const user = await db.get(
		'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
		[result.lastID]
	    );

	    const token = this.generateToken(user);

	    return {
		success: true,
		user,
		token
	    };
	} catch (error) {
	    console.error('Registration error:', error);
	    throw error;
	}
    }

    async login(identifier, password) {
	try {
	    const user = await db.get(
		'SELECT * FROM users WHERE username = ? OR email = ?',
		[identifier, identifier]
	    );

	    if (!user) {
		throw new Error('incorrect username or password');
	    }

	    const isValid = await bcrypt.compare(password, user.password_hash);

	    if (!isValid) {
		throw new Error('Incorrect username or password');
	    }

	    await db.run(
		'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
		[user.id]
	    );

	    delete user.password_hash;

	    const token = this.generateToken(user);

	    return {
		success: true,
		user,
		token
	    };
	} catch (error) {
	    console.error('Login error:', error);
	    throw error;
	}
    }

    verifyToken(token) {
	try {
	    return jwt.verify(token, this.JWT_SECRET);
	} catch (error) {
	    return null;
	}
    }
    
    generateToken(user) {
	return jwt.sign(
	    {
		id: user.id,
		username: user.username,
		email: user.email,
		role: user.role
	    },
	    this.JWT_SECRET,
	    { expiresIn: this.JWT_EXPIRES }
	);
    }

    async getUserFromToken(token) {
	const decoded = this.verifyToken(token);

	if (!decoded || !decoded.id) {
	    return null;
	}

	const user = await db.get(
	    'SELECT id, usrname, email, role, avatar, created_at, last_login FROM users WHERE id = ?',
	    [decoded.id]
	);

	return user;
    }

    async changePassword(userId, oldPassword, newPassword) {
	try {
	    const user = await db.get(
		'SELECT password_hash FROM users WHERE id =?',
		[userId]
	    );

	    if (!user) {
		throw new Error('User not found');
	    }

	    const isValid = await bcrypt.compare(oldPassword, user.password_hash);

	    if (!isValid) {
		throw new Error('Invalid current password');
	    }

	    const newPasswordHash = bcrypt.hash(newPassword, this.saltRounds);

	    await db.run(
		'UPDATE users SET password_hash = ? WHERE id = ?',
		[newPasswordHash, userId]
	    );

	    return {success: true};
	    
	} catch (error) {
	    console.error('Changing password error:', error);
	    throw error;
	}
    }

    async getUserStats(userId) {
	try {
	    const stats = await db.get(`
SELECT
    COUNT(DISTINCT game_id) as games_played,
    SUM(attempts) as total_attempts,
    SUM(completed) as games_completed,
    AVG(max_score) as avg_score,
    MAX(max_score) as best_score,
    MAX(last_played) as last_played
FROM user_progress
WHERE user_id = ?
`, [userId]);
	    return stats;
	} catch (error) {
	    console.error('Get user stats error:', error);
	    throw error;
	}
    }
}

module.exports = new Auth();
