const AppState = (function() {
    let state = {
	user: null,
	games: [],
	currentPage: 'home',
	isLoading: true,
	error: null
    };

    const listeners = [];

    function getState() {
	return { ...state };
    }

    function setState(newState) {
	const oldState = { ...state };
	state = { ...state, ...newState };

	listeners.forEach(listener => {
	    listener(state, oldState);
	});

	if (window.location.hostname === 'localhost') {
	    console.log('State changed:', newState);
	}
    }

    function subscribe(listener) {
	listeners.push(listener);

	return function unsubscribe() {
	    const index = listeners.indexOf(listener);
	    if (index > -1) {
		listeners.splice(index, 1);
	    }
	};
    }

    function init() {
	try {
	    const savedUser = localStorage.getItem('eduGames_user');
	    if (savedUser) {
		state.user = JSON.parse(savedUser);
	    }

	    const savedGames = localStorage.getItem('eduGames_games');
	    if (savedGames) {
		state.games = JSON.parse(savedGames);
	    }

	    console.log('AppState initialised');
	} catch (error) {
	    console.error('error loading state from localStorage:', error);
	}
    }

    function saveToStorage() {
	try {
	    if (state.user) {
		localStorage.setItem('eduGames_user', JSON.stringify(state.user));
	    }

	    if (state.games.length > 0) {
		localStorage.setItem('eduGames_games', JSON.stringify(state.games));
	    }
	} catch (error) {
	    console.error('Error saving state to localStorage:', error);
	}
    }

    return {
	getState,
	setState,
	subscribe,
	init,
	saveToStorage
    };
})();

window.AppState = AppState;

export default AppState;
