import AppState from '../modules/state.js';
import API from '../modules/api.js';
import UI from '../modules/ui.js';
import Router from '../modules/router.js';

export async function init() {
    console.log('Login page initialized');

    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const identifier = document.getElementById('identifier').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('login-btn');
    
    if (!identifier || !password) {
        UI.showNotification('Заполните все поля', 'error');
        return;
    }
    
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '⏳ Вход...';
    loginBtn.disabled = true;
    
    try {
        const result = await API.login(identifier, password);
        
        if (result.success) {
            localStorage.setItem('eduGames_token', result.token);
            localStorage.setItem('eduGames_user', JSON.stringify(result.user));
            
            AppState.setState({ user: result.user });
            
            UI.showNotification('Успешный вход!', 'success');

	    const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');

	    if (redirect === 'admin' && result.user.role === 'admin') {
                Router.goTo('/admin');
            } else {
                Router.goTo('/');
            }
        } else {
            UI.showNotification(result.error || 'Ошибка входа', 'error');
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
        }
        
    } catch (error) {
        UI.showNotification(error.message, 'error');
        
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const identifier = document.getElementById('identifier');
        const password = document.getElementById('password');
        
        if (identifier && password) {
            //identifier.value = 'user1';
            //password.value = 'password123';
        }
    }
});
