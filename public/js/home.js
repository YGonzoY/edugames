import AppState from '../modules/state.js';
import UI from '../modules/ui.js';
import API from '../modules/api.js';

export async function init() {
    console.log('Home page initialized');

    await loadGamesData();

    await renderGamesGrid();

    setupFilters();

    setupEventListeners();
}

async function loadGamesData() {
    const state = AppState.getState();
    
    if (state.games && state.games.length > 0) {
        return state.games;
    }
    
    try {
        console.log('Fetching games from server...');
        const games = await API.getGames();        
        AppState.setState({ games });
        return games;
    } catch (error) {
        console.error('Failed to load games:', error);
        
        const grid = document.getElementById('games-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="error-message">
                    <p>❌ Не удалось загрузить игры</p>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()" class="btn">Повторить</button>
                </div>
            `;
        }
        return [];
    }
}

async function renderGamesGrid() {
    const state = AppState.getState();
    const games = state.games;
    const container = document.getElementById('games-grid');

    if (!container) {
	console.error('Games grid container not found');
	return;
    }

    if (!games || games.length === 0) {
	container.innerHTML = `
<div class="no-games">
  <p>Games are temporary unavilable</p>
  <p>Try to update the page</p>
</div>
`;
	return;
    }

    console.log('Rendering games:', games.length);

    container.innerHTML = '';

    games.forEach(game => {
	const gameCard = createGameCard(game);
	container.appendChild(gameCard);
    });
}

function createGameCard(game) {
    console.log('creating game card for', game.title);

    try {
    const card = document.createElement('div');
    card.className = `game-card status-${game.status}`;
    card.style.cssText = 'display:block; border:2px solid red; margin:10px; padding:10px; background:#eee;';
    
    card.dataset.gameId = game.id;
    card.dataset.category = game.category;

    let statusText = '';
    let statusClass = '';

    switch(game.status) {
    case 'active':
	statusText = 'Available';
	statusClass = 'status-active';
	break;
    case 'in development':
	statusText = 'in development';
	statusClass = 'status-dev';
	break;
    case 'planned':
	statusText = 'planned';
	statusClass = 'status-planned';
	break;
    }

    card.innerHTML = `
<div class="game-card-inner">
  <div class="game-icon" style="background-color: ${game.color}20">
    <span class="icon">${game.icon}</span>
  </div>

  <div class="game-content">
    <div class="game-header">
      <h3 class="game-title">${game.title}</h3>
      <span class="game-catigory">${game.catigory}</span>
    </div>

    <p class="game-description">${game.description}</p>

    <div class="game-footer">
      <div class="game-meta">
        <span class="difficulty" title="difficulty">${game.difficulty}</span>
        <span class="status ${statusClass}">${statusText}</span>
      </div>

      <button class="play-btn" data-game-id="${game.id}">
        ${game.status === 'active' ? 'Play' : 'Comming'}
      </button>
    </div>
  </div>
</div>
`;

    const playBtn = card.querySelector('.play-btn');
    if (playBtn && game.status === 'active') {
	playBtn.addEventListener('click', () => {
	    window.location.hash = `#/game/${game.id}`;
	});
    }

    return card;
    } catch (error) {
	console.error('Error while creating game cardfor', game.title, error);
	return null;
    }
}

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButton.forEach(btn => {
	btn.addEventListener('click', () => {
	    filterButtons.forEach(b => b.classList.remove('active'));

	    btn.classList.add('active');

	    applyFilter(btn.dataset.filter);
	});
    });
}

function applyFilter(filterType) {
    const gameCards = document.querySelectorAll('.game-card');

    gameCards.forEach(card => {
	switch(filterType) {
	case 'all':
	    card.style.display = 'block';
	    break;
	case 'active':
	    card.style.display = card.classList.contains('status-active') ? 'block' : 'none';
	    break;
	case 'development':
	    card.style.display = card.classList.contains('status-dev') ||
		card.classList.contains('status-planned') ? 'block' : 'none';
	    break;
	}
    });
}

function setupEventListeners() {
    AppState.subscribe((newState, oldState) => {
	if (newState.games !== oldState.games) {
	    renderGamesGrid();
	}
    });

    const updateStats = () => {
	const state = AppState.getState();
	const gamesCount = state.games.length;
	const activeGames = state.games.filter(g => g.status === 'active').length;

	const countElement = document.querySelector('.stat-number');
	if (countElement) {
	    countElement.textCountent = gamesCount;
	}
    };

    updateStats();
}

window.homePage = { init, renderGamesGrid };
