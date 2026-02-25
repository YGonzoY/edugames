import API from '../modules/api.js';
import UI from '../modules/ui.js';
import AppState from '../modules/state.js';
import Router from '../modules/router.js';

export async function init() {
    console.log('Register page initialized');

    const form = document.getElementById('register-form');
    if (!form) {
        console.error('Register form not found');
        return;
    }

    form.addEventListener('submit', (e) => handleRegister(e, form));
}

async function handleRegister(e, form) {
    e.preventDefault();

    const username = document.getElementById('username')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirm-password')?.value || '';

    if (!username || !email || !password) {
        UI.showNotification('Заполните все поля', 'error');
        return;
    }

    if (password.length < 6) {
        UI.showNotification('Пароль должен быть не менее 6 символов', 'error');
        return;
    }

    const confirmField = document.getElementById('confirm-password');
    if (confirmField && password !== confirmPassword) {
        UI.showNotification('Пароли не совпадают', 'error');
        return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Регистрация...';

    try {
        const result = await API.register(username, email, password);
        console.log('Registration result:', result);

        if (result.success) {
            if (result.token && result.user) {
                localStorage.setItem('eduGames_token', result.token);
                localStorage.setItem('eduGames_user', JSON.stringify(result.user));
                AppState.setState({ user: result.user });
                UI.showNotification('Регистрация и вход выполнены успешно!', 'success');
                setTimeout(() => Router.goTo('/'), 1000);
            } else {
                UI.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
                setTimeout(() => Router.goTo('/login'), 1500);
            }
        } else {
            UI.showNotification(result.error || 'Ошибка регистрации', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        UI.showNotification(error.message || 'Ошибка при регистрации', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
