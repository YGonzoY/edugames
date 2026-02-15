import AppState from '../modules/state.js';
import API from '../modules/api.js';
import UI from '../modules/ui.js';

export async function init() {
    console.log('Profile page initialized');
    
    const user = AppState.getState().user;
    
    if (!user) {
        UI.showNotification('Необходимо войти в систему', 'warning');
        window.location.hash = '#/login';
        return;
    }
    
    await loadUserProfile();
    await loadUserProgress();
    await loadUserStats();
    
    setupTabs();
    setupForms();
}

async function loadUserProfile() {
    try {
        const user = AppState.getState().user;
        
        document.getElementById('profile-username').textContent = user.username;
        document.getElementById('profile-email').textContent = user.email;
        
        // Форматируем даты
        const created = new Date(user.created_at).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        document.getElementById('profile-created').textContent = created;
        
        if (user.last_login) {
            const lastLogin = new Date(user.last_login).toLocaleString('ru-RU');
            document.getElementById('profile-lastlogin').textContent = lastLogin;
        }
        
        // Заполняем форму настроек
        document.getElementById('settings-username').value = user.username;
        document.getElementById('settings-email').value = user.email;
        
        // Аватар (первая буква имени)
        const avatarEl = document.getElementById('avatar-placeholder');
        if (avatarEl) {
            avatarEl.textContent = user.username.charAt(0).toUpperCase();
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        UI.showNotification('Ошибка загрузки профиля', 'error');
    }
}

async function loadUserProgress() {
    try {
        const response = await API.request('/api/user/progress');
        const progressList = document.getElementById('progress-list');
        
        if (response.length === 0) {
            progressList.innerHTML = '<p class="empty-state">Вы еще не играли в игры. 🎮</p>';
            return;
        }
        
        progressList.innerHTML = '';
        
        response.forEach(progress => {
            const item = document.createElement('div');
            item.className = 'progress-item';
            item.innerHTML = `
                <div class="progress-item-icon">${progress.icon}</div>
                <div class="progress-item-info">
                    <h4>${progress.title}</h4>
                    <div class="progress-item-stats">
                        <span class="stat">🎯 Счёт: ${progress.score}</span>
                        <span class="stat">🏆 Рекорд: ${progress.max_score}</span>
                        <span class="stat">🎮 Попыток: ${progress.attempts}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(progress.score / 100) * 100}%"></div>
                    </div>
                </div>
                <div class="progress-item-status">
                    ${progress.completed ? '✅ Пройдено' : '🔄 В процессе'}
                </div>
            `;
            
            progressList.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

async function loadUserStats() {
    try {
        const stats = await API.request('/api/user/stats');
        
        document.getElementById('stat-games').textContent = stats.games_played || 0;
        document.getElementById('stat-completed').textContent = stats.games_completed || 0;
        document.getElementById('stat-attempts').textContent = stats.total_attempts || 0;
        document.getElementById('stat-best').textContent = stats.best_score || 0;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Убираем активный класс со всех табов
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Прячем все панели
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Показываем нужную панель
            const tabName = tab.dataset.tab;
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });
}

function setupForms() {
    // Форма профиля
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Форма смены пароля
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Кнопка удаления аккаунта
    const deleteBtn = document.getElementById('delete-account');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleDeleteAccount);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const username = document.getElementById('settings-username').value;
    const email = document.getElementById('settings-email').value;
    
    try {
        const result = await API.request('/api/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ username, email })
        });
        
        if (result.success) {
            // Обновляем токен и данные пользователя
            localStorage.setItem('eduGames_token', result.token);
            localStorage.setItem('eduGames_user', JSON.stringify(result.user));
            
            // Обновляем состояние
            AppState.setState({ user: result.user });
            
            UI.showNotification('Профиль обновлен', 'success');
            
            // Обновляем отображение
            await loadUserProfile();
        }
        
    } catch (error) {
        UI.showNotification(error.message, 'error');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (!oldPassword || !newPassword || !confirmPassword) {
        UI.showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        UI.showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        UI.showNotification('Пароль должен быть не менее 6 символов', 'error');
        return;
    }
    
    try {
        await API.request('/api/user/password', {
            method: 'PUT',
            body: JSON.stringify({ oldPassword, newPassword })
        });
        
        UI.showNotification('Пароль успешно изменен', 'success');
        
        // Очищаем поля
        document.getElementById('old-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-new-password').value = '';
        
    } catch (error) {
        UI.showNotification(error.message, 'error');
    }
}

function handleDeleteAccount() {
    if (confirm('Вы уверены? Это действие нельзя отменить.')) {
        if (confirm('Все ваши данные будут удалены. Продолжить?')) {
            UI.showNotification('Функция временно недоступна', 'warning');
        }
    }
}
