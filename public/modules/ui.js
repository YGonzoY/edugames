const UI = (function() {
    async function loadComponent(path) {
	try {
	    const response = await fetch(`/components/${path}.html`);
	    if (!response.ok) {
		throw new Error(`Component not found: ${path}`);
	    }
	    return await response.text();
	} catch (error) {
	    console.error('Error loading component: ', error);
	    return `<div class="error">Could not load component: ${path}</div>`;
	}
    }

    async function loadPage(pageName) {
	try {
	    const response = await fetch(`/pages/${pageName}.html`);
	    if (!response.ok) {
		throw new Error(`Page not found: ${pageName}`);
	    }
	    return await response.text();
	} catch (error) {
	    console.error('Error loading page: ', error);
	    return `
<div class="error-page">
  <h2>Page not found</h2>
  <p>Page "${pagename}" does not exist</p>
  <button onclick="window.location.hash = '#/'">To main page</button>
</div>
`;
	}
    }

    async function renderComponent(containerId, componentName, data = {}) {
	const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container not found: ${containerId}`);
            return;
        }
    
        try {
            let html = await loadComponent(componentName);
        
            // Простой шаблонизатор: заменяем {{ключ}} на значения
            html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                return data[key] !== undefined ? data[key] : '';
            });
        
            container.innerHTML = html;
        
            // Если это шапка, дополнительно обновляем секцию пользователя
            if (componentName === 'header') {
                updateUserSection(data);
            }
        
            initComponentEvents(containerId, componentName, data);
        
        } catch (error) {
            container.innerHTML = `<div class="error">Ошибка загрузки компонента: ${error.message}</div>`;
        }
    }

    function updateUserSection(data) {
        const userSection = document.getElementById('user-section');
        if (!userSection) return;
    
        if (data.isAuthenticated && data.username) {
	    let adminLink = '';
	    if (data.role === 'admin') {
		adminLink = '<a href="#/admin" class="nav-link">Admin Page</a>';
	    }
            userSection.innerHTML = `
            <div class="user-info">
                ${adminLink}
                <span class="username">👤 ${data.username}</span>
                <button id="logout-btn" class="btn btn-small">Выйти</button>
            </div>
        `;
        } else {
            userSection.innerHTML = `<button id="login-btn" class="btn btn-primary">Войти</button>`;
        }
    }

    async function renderPage(pageName, data = {}) {
	const container = document.getElementById('app-container');
	if (!container) return;

	try {
	    let html = await loadPage(pageName);

	    html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		return data[key] !== undefined ? data[key] : match;
	    });

	    container.innerHTML = html;

	    await loadPageScript(pageName, data);
	} catch (error) {
	    container.innerHTML = `
<div class="error-page">
  <h2>Loading Error</h2>
  <p>${error.message}</p>
  <button onclick="window.location.hash = '#/'">To main page</button>
</div>
`;
	}
    }

    async function loadPageScript(pageName, data) {
    try {
        const module = await import(`/js/${pageName}.js`);
        if (module.init) {
            await module.init(data);
        } else {
            console.log(`No init function in ${pageName}.js`);
        }
    } catch (error) {
        console.error(`Error loading script for ${pageName}:`, error);
    }
}
    
/*
    async function loadPageScript(pageName, data) {
	try {
	    const module = await import(`/js/${pageName}.js`);
	    if (module.init) {
		await module.init(data);
	    }
	} catch (error) {
	    console.log('No script for page: ${pageName}');
	}
    }
*/
    function initComponentEvents(containerId, componentName, data) {
	const container = document.getElementById(containerId);

	switch(componentName) {
	case 'header':
	    const loginBtn = container.querySelector('#login-btn');
	    if (loginBtn) {
		loginBtn.addEventListener('click', () => {
		    window.location.hash = '#/login';
		});
	    }
	    
	    const logoutBtn = container.querySelector('#logout-btn');
	    if (logoutBtn) {
		logoutBtn.addEventListener('click', () => {
		    localStorage.removeItem('eduGames_token');
		    localStorage.removeItem('edugames_user');
		    window.dispatchEvent(new CustomEvent('user-logout'));
		    window.location.hash = '#/';
		});
	    }

	    const logo = container.querySelector('.logo');
	    if (logo) {
		logo.addEventListener('click', () => {
		    window.location.hash = '/#'; 
		});
	    }
	    break;
	}
    }

    function showNotification(message, type = 'info', duration = 3000) {
	const container = document.getElementById('notification-container');
	if(!container) return;

	const notification = document.createElement('div');
	notification.className = `notification notification-${type}`;
	notification.innerHTML = `
<div class="notification-content">
  <span class="notification-icon">${getNotification(type)}</span>
  <span class="notification-text">${message}</span>
  <button class="notification-close">&times;</button>
</div>
`;

	container.appendChild(notification);
	setTimeout(() => notification.classList.add('show'), 10);

	notification.querySelector('.notification-close').addEventListener('click', () => {
	    closeNotification(notification);
	});

	if (duration > 0) {
	    setTimeout(() => closeNotification(notification), duration);
	}

	return notification;
    }

    function closeNotification(notification) {
	notification.classList.remove('show');
	setTimeout(() => {
	    if (notification.parentNode) {
		notification.parentNode.removeChild(notification);
	    }
	}, 300);
    }

    function getNotification(type) {
	const icons = {
	    'success': 'v',
	    'error': 'x',
	    'warning': '!',
	    'info': 'i'
	};
	return icons[type] || 'i';
    }

    async function showModal(modalName, data = {}) {
	const container = document.getElementById('modal-container');
	if (!container) return;

	try {
	    let html = await loadComponent(`modals/${modalName}`);

	    html = html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
		return data[key] !== undefined ? data[key] : match;
	    });

	    container.innerHTML = html;

	    const modal = container.querySelector('.modal');
	    if (modal) {
		setTimeout(() => modal.classList.add('show'), 10);
	    }

	    const backdrop = container.querySelector('.modal-backdrop');
	    if (backdrop) {
		backdrop.addEventListener('click', () => {
		    hideModal();
		});
	    }

	    const closeBtn = container.querySelector('.modal-close');
	    if (closeBtn) {
		closeBtn.addEventListener('click', () => {
		    hideModal();
		});
	    }
	} catch (error) {
	    console.error('Error showing modal:', error);
	}
    }

    function hideModal() {
	const container = document.getElementById('modal-container');
	if (!container) return;

	const modal = container.querySelector('.modal');
	if (modal) {
	    modal.classList.remove('show');
	    setTimeout(() => {
		container.innerHTML = '';
	    }, 300);
	}
    }

    function showLoading(show = true) {
	const container = document.getElementById('modal-container');
	if (!container) return;

	if (show) {
	    container.innerHTML = `
<div class="loading-container">
  <div class="loading-spinner"></div>
  <p>Loading...</p>
</div>
`;
	}
    }

    return {
	renderComponent,
	renderPage,
	showNotification,
	showModal,
	hideModal,
	showLoading,
	loadComponent
    };
    
})();

export default UI;
