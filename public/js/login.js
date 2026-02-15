import AppState from '../modules/state.js';
import API from '../modules/api.js';
import UI from '../modules/ui.js';

export async function init() {
    console.log('Login page initialized');
    
    const form = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
    
    // Демо-кнопки
    document.querySelectorAll('.demo-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const username = e.target.dataset.user;
            document.getElementById('identifier').value = username;
            document.getElementById('password').value = 'password123';
            
            // Автоматически отправляем форму
            await handleLogin(new Event('submit'));
        });
    });
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
    
    // Блокируем кнопку
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '⏳ Вход...';
    loginBtn.disabled = true;
    
    try {
        const result = await API.login(identifier, password);
        
        if (result.success) {
            // Сохраняем данные
            localStorage.setItem('eduGames_token', result.token);
            localStorage.setItem('eduGames_user', JSON.stringify(result.user));
            
            // Обновляем состояние
            AppState.setState({ user: result.user });
            
            UI.showNotification('Успешный вход!', 'success');
            
            // Перенаправляем на главную
            setTimeout(() => {
                window.location.hash = '#/';
            }, 1000);
        }
        
    } catch (error) {
        UI.showNotification(error.message, 'error');
        
        // Разблокируем кнопку
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

// Автозаполнение демо-данных (для разработки)
document.addEventListener('DOMContentLoaded', () => {
    // Для быстрого тестирования
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const identifier = document.getElementById('identifier');
        const password = document.getElementById('password');
        
        if (identifier && password) {
            identifier.value = 'user1';
            password.value = 'password123';
        }
    }
});
