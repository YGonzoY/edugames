const API = (function() {
    const BASE_URL = window.location.origin;

    async function request(endpoint, options = {}) {
	const url = `${BASE_URL}${endpoint}`;
	const token = localStorage.getItem('eduGames_token');

	const headers = {
	    'Content-Type': 'application/json',
	    ...options.headers
	};

	if (token) {
	    headers['Authorization'] = `Bearer ${token}`;
	}

	try {
	    const response = await fetch(url, {
		...options,
		headers
	    });

	    if (response.status === 401) {
		localStorage.removeItem('eduGames_token');
		localStorage.removeItem('eduGames_user');
		window.dispatchEvent(new CustomEvent('auth-expired'));
		throw new Error('Session is expired. Sign again');
	    }

	    const data = await response.json();

	    if (!response.ok) {
		throw new Error(data.error || `Error ${response.status}`);
	    }

	    return data;
	} catch (error) {
	    console.error(`API Error [${endpoint}]:`, error);

	    if (!error.message.includes('Session is expired')) {
		showNotification(`Error: ${error.message}`, 'error');
	    }

	    throw error;
	}
    }

    async function getHealth() {
	return request('/api/health');
    }

    async function getGames() {
	return request('/api/games');
    }

    async function getGame(id) {
	return request(`/api/game/${id}`);
    }

    async function register(username, email, password) {
        return request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async function login(identifier, password) {
	return request('/api/auth/login', {
	    method: 'POST',
	    body: JSON.stringify({ identifier, password })
	});
    }

    async function logout() {
        return request('/api/auth/logout', {
            method: 'POST'
        });
    }

    async function getUserProfile() {
        return request('/api/user/profile');
    }

    async function getUserProgress() {
        return request('/api/user/progress');
    }

    async function getUserStats() {
        return request('/api/user/stats');
    }

    async function saveGameProgress(gameId, data) {
        return request(`/api/game/${gameId}/progress`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async function updateProfile(data) {
        return request('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async function changePassword(data) {
        return request('/api/user/password', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async function adminGetGames() {
        return request('/api/admin/games');
    }

    async function adminCreateGame(data) {
        return request('/api/admin/games', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async function adminUpdateGame(id, data) {
        return request(`/api/admin/game/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async function adminDeleteGame(id) {
        return request(`/api/admin/game/${id}`, {
            method: 'DELETE'
        });
    }

    async function adminGetUsers() {
        return request('/api/admin/users');
    }

    async function adminUpdateUser(id, data) {
        return request(`/api/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async function adminDeleteUser(id) {
        return request(`/api/admin/users/${id}`, {
             method: 'DELETE'
        });
    }
    
    async function adminGetStats() {
        return request('/api/admin/stats');
    }

    function showNotification(message, type = 'info') {
	const event = new CustomEvent('show-notification', {
	    detail: { message, type }
	});
	window.dispatchEvent(event);
    }

    return {
        request,
        getHealth,
        getGames,
        getGame,
        register,
        login,
        logout,
        getUserProfile,
        getUserProgress,
        getUserStats,
        saveGameProgress,
        updateProfile,
        changePassword,
	adminGetGames,
	adminCreateGame,
	adminCreateGame,
	adminUpdateGame,
	adminDeleteGame,
	adminGetUsers,
	adminUpdateUser,
	adminDeleteUser,
	adminGetStats
    };
})();

export default API;
