import UI from '../modules/ui.js';

const Router = (function() {
    const routes = {
    '/'          : 'home',
    '/game/:id'  : 'game',   
    '/about'     : 'about',
    '/login'     : 'login',
    '/register'  : 'register',
    '/profile'   : 'profile'
    };

    let currentPath = '';

    function init() {
	window.addEventListener('hashchange', handleHashChange);

	window.addEventListener('DOMContentLoaded', handleHashChange);

	console.log('Router initialized');
    }

    function handleHashChange() {
	const hash = window.location.hash.slice(1) || '/';

	if (hash === currentPath) return;

	currentPath = hash;

	let matchedRoute = null;
	let routeParams = {};

	console.log('routes:', routes);
	
	for (const route in routes) {
	    const params = matchRoute(route, hash);
	    console.log('matchRoute result:', params);
	    if (params !== null) {
		matchedRoute = routes[route];
		routeParams = params;
		break;
	    }
	}

	if (!matchedRoute) {
	    handleNotFound();
	    return;
	}
	
	navigateTo(matchedRoute, routeParams);
    }

    function matchRoute(route, path) {
	console.log('matching', route, 'with', path);
	const routeParts = route.split('/').filter(p => p !== '');
	const pathParts = path.split('/').filter(p => p !== '');

	if (route === '/' && path === '/') {
	    return {};
	}

	if (routeParts.length !== pathParts.length) {
	    return null;
	}

	const params = {};

	for (let i = 0; i < routeParts.length; i++) {
	    if (routeParts[i].startsWith(':')) {
		const paramName = routeParts[i].slice(1);
		params[paramName] = pathParts[i];
	    } else if (routeParts[i] !== pathParts[i]) {
		console.log(`Part ${i} mismatch: ${routeParts[i]} vs ${pathParts[i]}`);
		return null;
	    }
	}

	console.log('Params found:', params);
	return params;
    }

    async function navigateTo(pageName, params = {}) {
	console.log(`Navigate to: ${pageName}`, params);

	AppState.setState({
	    currentPage: pageName,
	    routeParams: params,
	    isLoading: true
	});

	UI.showLoading(true);

	try {
	    await UI.renderPage(pageName, params);

	    AppState.setState({ isLoading: false });

	    window.scrollTo(0,0);
	} catch (error) {
	    console.error('Navigating error: ', error);
	    AppState.setState({
		isLoading: false,
		error: error.message
	    });

	    UI.showNotification("error while loading the page", 'error');
	}
    }

    function handleNotFound() {
	console.log('Page not found:', currentPath );
	UI.renderPage('404', { path: currentPath });
	AppState.setState({ currentPage: '404' });
    }

    function goTo(path) {
	window.location.hash = path;
    }

    function getCurrentPath() {
	return currentPath;
    }

    return {
	init,
	goTo,
	getCurrentPath,
	navigateTo
    };
    
})();

export default Router;
