import AppState from '../modules/state.js';
import API from '../modules/api.js';
import UI from '../modules/ui.js';
import Router from '../modules/router.js';

async function initApp() {
    console.log('initalizing application...');

    AppState.init();

    await loadHeader();

    await loadGames();

    Router.init();

    setupGlobalListeners();

    await checkServerHealth();

    console.log('application initialized');
    AppState.setState({ isLoading: false });
}

async function loadHeader() {
    const state = AppState.getState();
    const user = state.user;
    
    await UI.renderComponent('header-container', 'header', {
	isAuthrnticated: !!user,
	username: user ? user.username : '',
	role: user ? user.role : ''
    });
}

async function loadGames() {
    console.log('Loading games...');
    try {
	const games = await API.getGames();
	console.log('Games loaded:', games);
	AppState.setState({ games });
	UI.showNotification(`loaded ${games.length} games`, 'success', 2000);
	
    } catch (error) {
	console.error('error loading games:', error);
	UI.showNotification('could not load games', 'error');
    }
}

async function checkServerHealth() {
    try {
	const health = await API.getHealth();
	console.log('Server health:', health);

	localStorage.setItem('server_info', JSON.stringify({
	    lastCheck: new Date().toISOString(),
	    version: health.version,
	    nodeVersion: health.nodeVersion
	}));
    } catch (error) {
	console.error('server health check failed:', error);
	UI.showNotification('troubles connecting to the server', 'warning');
    }
}

function setupGlobalListeners() {
    window.addEventListener('show-notification', (event) => {
	const { message, type } = event.detail;
	UI.showNotification(message, type);
    });

    window.addEventListener('user-logout', (event) => {
	AppState.setState({ user: null });
	loadHeader();
	UI.showNotification('you leaved the system', 'info');
    });

    window.addEventListener('auth-expired', () => {
	AppState.setState({ user: null });
	loadHeader();
	UI.showNotification('session outdated. login again', 'warning');
    });

    AppState.subscribe((newState, oldState) => {
	if (newState.user !== oldState.user || newState.games !== oldState.games) {
	    AppState.saveToStorage();
	    loadHeader();
	}
    });

    window.addEventListener('error', (event) => {
	console.error('global error:', event.error);
	UI.showNotification(`Error: ${event.message}`, 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
	console.error('unhandled promise rejection:', event.reason);
	UI.showNotification(`error: ${event.reason.message}`, 'error');
    }); 
}

document.addEventListener('DOMContentLoaded', initApp);

window.App = {
    AppState,
    API,
    UI,
    Router,
    initApp
};

console.log('main module loaded');




/*
async function testAPI(endpoint) {
    const resultElement = document.getElementById('api-result');
    resultElement.textContent = 'Request..';
    resultElement.className = '';

    try {
	const response = await fetch(endpoint);
	const data = await response.json();

	resultElement.textContent = JSON.stringify(data, null, 2);
	resultElement.className = response.ok ? 'success' : 'error';

	console.log(`API ${endpoint}: `, data);
    } catch (error) {
	resultElement.textContent = `Error ${error.message}`;
	resultElement.className = 'error';
	console.error(`API error ${endpoint}:`, error);
    }
}


async function LoadServerInfo() {
    const infoElement = document.getElementById('server-info');

    try {
	const response = await fetch('/api/health');
	const data = await response.json();

	infoElement.innerHTML = `
<div class="info-grid">
  <div class="info-item">
    <strong>Status:</strong>
    <span class="status-indicator active">${data.status}</span>
  </div>
  <div class="info-item">
    <strong>Node.js:</strong>
    <span>${data.nodeVersion || "no data"}</span> 
  </div>
  <div class="info-item">
    <strong>Message</strong>
    <span>${data.message}</span>
  </div>
</div>
`;
    } catch (error) {
	infoElement.innerHTML = `<div class="error">error while losding data: ${error.message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('document loaded');

    LoadServerInfo();

    setTimeout( () => testAPI('/api/health'), 1000);

    document.querySelectorAll('.api-btn').forEach(btn => {
	const endpoint = btn.getAttribute('onclick').match(/'(.*?)'/)[1];
	btn.onclick = () => testAPI(endpoint);
    });

    updateTime();
    setInterval(updateTime, 1000);
});

function updateTime() {
    const timeElement = document.querySelector('.current-time');
    if (timeElement) {
	timeElement.textContent = new Date().toLocaleTimeString();
    }
}

if(typeof module !== 'undefined' && module.exports) {
    module.exports = { testAPI, loadServerInfo};
    }
*/
