const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');
const db = require('./database');
const auth = require('./auth');

class WebServer {
    constructor(port = 3000) {
	this.port = port;
	this.publicPath = path.join(__dirname, '../public');
	this.pagesPath = path.join(this.publicPath, 'pages');
	this.componentsPath = path.join(this.publicPath, 'components')
	
	this.mimeTypes = {
	    '.html': 'text/html',
	    '.css' : 'text/css',
	    '.js'  : 'text/javascript',
	    '.json': 'application/json',
	    '.png' : 'image/png',
	    '.jpg' : 'image/jpeg',
	    '.svg' : 'image/svg+xml',
	    '.ico' : 'image/x-icon',
	    '.txt' : 'text/plain'
	};

	this.routes = {
	    'GET' : {
		'/api/health'       : this.handleHealthCheck.bind(this),
		'/api/games'        : this.handleGetGames.bind(this),
		'/api/game/:id'     : this.handleGetGame.bind(this),
		'/api/user/profile' : this.handleGetProfile.bind(this),
		'/api/user/progress': this.handleGetProgress.bind(this),
		'/api/user/stats'   : this.handleGetUserStats.bind(this),
	    },
	    'POST' : {
		'/api/auth/register'    : this.handleRegister.bind(this),
		'/api/auth/login'       : this.handleLogin.bind(this),
		'/api/auth/logout'      : this.handleLogout.bind(this),
		'/api/game/:id/progress': this.handleSaveProgress.bind(this)
	    },
	    'PUT' : {
		'/api/user/profile' : this.handleUpdateProfile.bind(this),
		'/api/user/password': this.handleChangePassword.bind(this)
	    }
	};
    }

    async init() {
	try {
	    await db.init();
	    console.log('database initialized');
	} catch (error) {
	    console.error('error while initializing database:', error);
	    process.exit(1);
	}
    }

    getMimeType(filePath) {
	const extname = path.extname(filePath);
	return this.mimeTypes[extname] || 'application/octet-stream';
    }

    async serveStaticFile(filePath, res) {
	try {
	    const requestedPath = path.join(this.publicPath, filePath);
	    const normalizedPath = path.normalize(requestedPath);

	    if(!normalizedPath.startsWith(this.publicPath)) {
		//return this.send403(res);
		return this.sendError(res, 403, 'access denied');
	    }

	    const stats = await fs.stat(normalizedPath);
	    
	    if (stats.isDirectory()) {
		const indexPath = path.join(normalizedPath, 'index.html');
		try {
		    await fs.access(indexPath);
		    return this.serveStaticFile(path.join(filePath, 'index.html'), res);
		} catch {
		    //return this.send404(res);
		    return this.sendError(res, 404, 'page was not found');
		}
	    }

	    const data = await fs.readFile(normalizedPath);
	    const mimeType = this.getMimeType(normalizedPath);

	    res.writeHead(200, {
		'Content-Type': mimeType,
		'Cache-Control': 'no-cache'
	    });
	    
	    res.end(data);
	    
	} catch (error) {
	    console.error("error while serving static file:", error);
	    //this.send404(res);
	    this.sendError(res, 404, 'file was not found');
	}
    }

    async authenticate(req) {
	const authHeader = req.headers['authorization'];

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
	    return null;
	}

	const token = authHeader.substring(7);
	const user = await auth.getUserFromToken(token);

	return user;
    }

    async handleHealthCheck(req, res) {
	const response = {
	    status: 'healthy',
	    message: 'server works',
	    timestamp: new Date().toISOString(),
	    nodeVersion: process.version
	};

	this.sendJSON(res, 200, response);
    }

    async handleGetGames(req, res) {
	try {
	    console.log('Getting games from database...');
	    const games = await db.all('SELECT * FROM games ORDER BY id');

	    if (!games || games.length === 0) {
		const demoGames = [
                    {
                       id: 1,
                       title: "demo 1",
                        description: "demo-1",
                        icon: "D",
                        category: "demo",
                        difficulty: "none",
                        path: "none",
                        color: "#3498db",
                        status: "active"
                    },
                ];
                return this.sendJSON(res, 200, demoGames);
	    }
	    
	    this.sendJSON(res, 200, games);
	    
	} catch (error) {
	    console.error('Error in handleGetGames:', error);
	    this.sendError(res, 500, 'error getting games:' + error.message);
	}
    }

    async handleGetGame(req, res, params) {
	try {
	    const game = await db.get('SELECT * FROM games WHERE id = ?', [Number(params.id)]);
	    if (!game) {
		return this.sendError(res, 404, 'game was not found');
	    }
	    
	    this.sendJSON(res, 200, game);
	} catch (error) {
	    this.sendError(res, 500, 'error getting game');
	}
    }

    async handleRegister(req, res) {
	try {
	    const body = await this.parseBody(req);
	    const { username, email, password } = body;

	    if (!username || !email || ! password) {
		return this.sendError(res, 400, 'all fields are nessesery');
	    }

	    if (password.length < 6) {
		return this.sendError(res, 400, 'password should be more than 6 symbols');
	    }

	    const result = await auth.register(username, email, password);

	    this.sendJSON(res, 201, result);
	} catch (error) {
	    this.sendError(res, 400, error.message);
	}
    }

    async handleLogin(req, res) {
	try {
	    const body = await this.parseBody(req);
	    const {identifier, password } = body;

	    if (!identifier || !password) {
		return this.sendError(res, 400, 'all fields are nessesery');
	    }

	    const result = await auth.login(identifier, password);

	    this.sendJSON(res, 200, result);
	} catch (error) {
	    this.sendError(res, 401, error.message);
	}
    }

    async handleLogout(req, res) {
	this.sendJSON(res, 200, { success: true });
    }

    async handleGetProfile(req, res) {
	const user = await this.authenticate(req);

	if (!user) {
	    return this.sendError(res, 401, 'not authorized');
	}

	this.sendJSON(res, 200, user);
    }

    async handleGetProgress(req, res) {
	const user = await this.authenticate(req);
	if (!user) {
	    return this.sendError(res, 401, 'not authorized');
	}

	try {
	    const progress = await db.all(`
SELECT up.*, g.title, g.icon, g.category
FROM user_progress up
JOIN games g ON up.game_id = g.id
WHERE up.user_id = ?
ORDER BY up.last_played DESC
`, [user.id]);

	    this.sendJSON(res, 200, progress);
	} catch (error) {
	    console.error('Get progress error:', error);
	    this.sendError(res, 500, 'Error while getting progress');
	}
    }

    async handleGetUserStats(req, res) {
	const user = await this.authenticate(req);

	if (!user) {
	    return this.sendError(res, 401, 'not authorized');
	}

	try {
	    const atats = await this.getUserStats(user.id);
	    this.sendJSON(res, 200, stats);
        } catch (error) {
	    this.sendError(res, 500, 'Error while getting stats');
        }
    }

    async handleSaveProgress(req, res, params) {
	const user = await this.authenticate(req);

	if (!user) {
	    return this.sendError(res, 401, 'not authorized');
	}

	try {
	    const body = await this.parseBody(req);
	    const { score, completed } = body;
	    const gameId = params.id;

	    const current = await db.get(
		'SELECT * FROM user_progress WHERE user_id = ? AND game_id = ?',
		[user.id, gameId]
	    );

	    if (current) {
		await db.run(`
UPDATE user_progress
SET attempts = attemrts + 1,
    score = ?,
    max_score = MAX(max_score, ?),
    completed = MAX(completed, ?),
    last_played = CURRENT_TIMESTAMP
WHERE user_id = ? AND game_id = ?
`, [score, score, completed ? 1 : 0, user.id, gameId]);
	    } else {
		await db.run(`
INSERT INTO user_progress (user_id, game_id, score, max_score, attempts, completed)
VALUES (?, ?, ?, ?, 1, ?)
`, [user.id, gameId, score, score, completed ? 1 : 0]);
	    }

	    this.sendJSON(res, 200, { success: true });
	} catch (error) {
	    console.error('Save progress error:', error);
	    this.sendError(res, 500, 'error saving progress');
	}
    }

    async handleUpdateProfile(req, res) {
	const user = await this.authenticate(req);

	if(!user) {
	    this.sendError(res, 401, 'not authenticated')
	}

	try {
	    const body = await this.parseBody(req);
	    const { username, email, avatar } = body;

	    await db.run(
		'UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?',
		[username, email, avatar, user.id]
	    );

	    const updatedUser = await auth.getUserFromToken(
		auth.generateToken({ id: user.id })
	    );

	    const newToken = auth.generateToken(updatedUser);

	    this.sendJSON(res, 200, {
		success: true,
		user: updatedUser,
		token: newToken
	    });
	} catch (error) {
	    console.error('Update profile error:', error);
	    this.sendError(res, 500, 'Error updating profile')
	}
    }

    async handleChangePassword(req, res) {
        const user = await this.authenticate(req);
        
        if (!user) {
            return this.sendError(res, 401, 'Not authorized');
        }
        
        try {
            const body = await this.parseBody(req);
            const { oldPassword, newPassword } = body;
            
            if (!oldPassword || !newPassword) {
                return this.sendError(res, 400, 'All fields are nessesery');
            }
            
            if (newPassword.length < 6) {
                return this.sendError(res, 400, 'New password must be more than 6 symbols');
            }
            
            await auth.changePassword(user.id, oldPassword, newPassword);
            
            this.sendJSON(res, 200, { success: true });
            
        } catch (error) {
            this.sendError(res, 400, error.message);
        }
    }

    //assisting functions

    parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve(parsed);
                } catch (error) {
                    reject(new Error('Неверный формат JSON'));
                }
            });
            
            req.on('error', reject);
        });
    }
    
    sendJSON(res, statusCode, data) {
	res.writeHead(statusCode, {
	    'Content-Type': 'application/json',
	    'Access-Control-Allow-Origin': "*",
	    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
	});
	res.end(JSON.stringify(data, null, 2));
    }

    sendError(res, statusCode, message) {
        this.sendJSON(res, statusCode, { error: message });
    }

    send404(res) {
	res.writeHead(404, { 'Content-Type': 'text/html'});
	res.end(`
<!DOCTYPE html>
<html>
<head><title>404 - not found</title></head>
<body>
  <h1>404 - page not found</h1>
  <p>requested page was not found</p>
  <a href="/">to main page</a>
</body>
<html>
`);
    }

    send403(res) {
	res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
	res.end(`
<!DOCTYPE html>
<html>
<head><title>403 - firbidden</title></head>
<body>
  <h1>403 - access denied</h1>
  <p>You have not rights to access this resource</p>
</body>
</html>
`);
    }

    send500(res, error) {
	console.error('server error:', error);
	res.writeHead(500, { 'Content-Type': 'text/html' });
	res.end(`
<!DOCTYPE html>
<html>
<head><title>Internal server message</title></head>
<body>
  <h1>500 - Internal server error</h1>
  <p>${error.message}</p>
  <a href="/">to main page</a>
</body>
</html>
`);
    }

    parseRouteParams(route, pathname) {
	const routeParts = route.split('/').filter(p => p !== '');
	const pathParts = pathname.split('/').filter(p => p !== '');

	if (routeParts.length !== pathParts.length) return null;

	const params = {};

	for (let i = 0; i < routeParts.length; i++) {
	    if (routeParts[i].startsWith(':')) {
		const paramName = routeParts[i].slice(1);
		params[paramName] = pathParts[i];
	    } else if (routeParts[i] !== pathParts[i]) {
		return null;
	    }
	}

	return params;
    }

    findRoute(method, pathname) {
	const routes = this.routes[method] || {};

	if(routes[pathname]) {
	    return { handler: routes[pathname], params: {} };
	}

	for(const route in routes) {
	    if (route.includes(':')) {
		const params = this.parseRouteParams(route, pathname);
		if (params !== null) {
		    return { handler: routes[route], params };
		}
	    }
	}

	return null;
    }
    
    async handleRequest(req, res) {
	const parsedUrl = url.parse(req.url, true);
	const pathname = parsedUrl.pathname;
	const method = req.method;

	console.log(`${new Date().toISOString()} ${req.method} ${pathname}`);

	try {
	    if (method === 'OPTIONS') {
                res.writeHead(204, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                });
                res.end();
                return;
            }

	    const route = this.findRoute(method, pathname);
	    if (route) {
		return route.handler(req, res, route.params);
	    }

	    if (pathname === '/' ||
	        pathname.startsWith('/game/') ||
	        pathname === '/about' ||
	        pathname === '/login' ||
	        pathname === '/register' ||
	        pathname === '/profile') {
		return this.serveStaticFile('/index.html', res);
	    }

	    if (pathname.startsWith('/')) {
		return this.serveStaticFile(pathname, res);
	    }

	    this.sendError(res, 404, 'Page was not found');
	    
	} catch (error) {
	    console.error('Error while handling request:', error);
	    this.sendError(res, 500, 'Внутренняя ошибка сервера');
	}
    }

    async start() {
	await this.init();
	
	const server = http.createServer(this.handleRequest.bind(this));

	server.listen(this.port, () => {
	    console.log(`server works fine at ropt ${this.port}`);
	});

	server.on('error', (error) => {
	    console.error('server error:', error.message);
	    if(error.code === 'EADDRINUSE') {
		console.log('port ${this.port} is buisy');
	    }
	});
	
    }
}

const port = process.argv[2] || 3000;
const server = new WebServer(port);
server.start();
