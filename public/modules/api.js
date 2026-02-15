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
	    headers['Authorisation'] = `Bearer ${token}`;
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
		throw new Error(data.error || `Error ${response.ststus}`);
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

    async function login(username, password) {
	return request('/api/auth/login', {
	    method: 'POST',
	    body: JSON.stringify({ username, password })
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
        changePassword
    };
})();

export default API;
