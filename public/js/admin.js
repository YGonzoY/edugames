import API from '../modules/api.js';
import UI from '../modules/ui.js';
import AppState from '../modules/state.js';

export async function init() {
    // Проверяем, что пользователь админ
    const user = AppState.getState().user;
    if (!user || user.role !== 'admin') {
        UI.showNotification('Доступ запрещён', 'error');
        window.location.hash = '#/';
        return;
    }

    // Загружаем данные
    await loadGames();
    await loadUsers();
    await loadStats();

    // Настраиваем табы
    setupTabs();

    // Настраиваем модальное окно для игр
    setupGameModal();

    // Кнопка добавления игры
    document.getElementById('add-game-btn').addEventListener('click', () => {
        openGameModal();
    });
}

async function loadGames() {
    try {
        const games = await API.adminGetGames();
        const tbody = document.getElementById('games-list');
        tbody.innerHTML = '';
        games.forEach(game => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${game.id}</td>
                <td>${game.icon || '🎮'}</td>
                <td>${game.title}</td>
                <td>${game.category || '-'}</td>
                <td>${game.difficulty || '-'}</td>
                <td><span class="status-${game.status}">${game.status}</span></td>
                <td>
                    <button class="btn-edit" data-id="${game.id}">✏️</button>
                    <button class="btn-delete" data-id="${game.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Добавляем обработчики на кнопки
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                editGame(id);
            });
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                deleteGame(id);
            });
        });
    } catch (error) {
        UI.showNotification('Ошибка загрузки игр', 'error');
    }
}

async function loadUsers() {
    try {
        const users = await API.adminGetUsers();
        const tbody = document.getElementById('users-list');
        tbody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
                <td>${user.last_login ? new Date(user.last_login).toLocaleString() : '-'}</td>
                <td>
                    <button class="btn-role" data-id="${user.id}" data-role="${user.role}">🔄 Сменить роль</button>
                    <button class="btn-delete-user" data-id="${user.id}">🗑️</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Обработчики
        document.querySelectorAll('.btn-role').forEach(btn => {
            btn.addEventListener('click', toggleUserRole);
        });
        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', deleteUser);
        });
    } catch (error) {
        UI.showNotification('Ошибка загрузки пользователей', 'error');
    }
}

async function loadStats() {
    try {
        const stats = await API.adminGetStats();
        document.getElementById('stat-users').textContent = stats.users;
        document.getElementById('stat-games').textContent = stats.games;
        document.getElementById('stat-plays').textContent = stats.plays;
        document.getElementById('stat-completed').textContent = stats.completed;
    } catch (error) {
        UI.showNotification('Ошибка загрузки статистики', 'error');
    }
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

// Работа с модальным окном игр
let currentGameId = null;

function setupGameModal() {
    const modal = document.getElementById('game-modal');
    const closeBtn = modal.querySelector('.close');
    const form = document.getElementById('game-form');

    closeBtn.onclick = () => modal.classList.add('hidden');
    window.onclick = (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const gameData = {
            title: document.getElementById('game-title').value,
            description: document.getElementById('game-description').value,
            icon: document.getElementById('game-icon').value,
            category: document.getElementById('game-category').value,
            difficulty: document.getElementById('game-difficulty').value,
            path: document.getElementById('game-path').value,
            color: document.getElementById('game-color').value,
            status: document.getElementById('game-status').value
        };

        try {
            if (currentGameId) {
                await API.adminUpdateGame(currentGameId, gameData);
                UI.showNotification('Игра обновлена', 'success');
            } else {
                await API.adminCreateGame(gameData);
                UI.showNotification('Игра создана', 'success');
            }
            modal.classList.add('hidden');
            await loadGames(); // перезагружаем список
        } catch (error) {
            UI.showNotification('Ошибка сохранения', 'error');
        }
    };
}

function openGameModal(game = null) {
    const modal = document.getElementById('game-modal');
    document.getElementById('modal-title').textContent = game ? 'Редактировать игру' : 'Добавить игру';
    if (game) {
        currentGameId = game.id;
        document.getElementById('game-id').value = game.id;
        document.getElementById('game-title').value = game.title;
        document.getElementById('game-description').value = game.description || '';
        document.getElementById('game-icon').value = game.icon || '🎮';
        document.getElementById('game-category').value = game.category || '';
        document.getElementById('game-difficulty').value = game.difficulty || 'Начальный';
        document.getElementById('game-path').value = game.path || '';
        document.getElementById('game-color').value = game.color || '#3498db';
        document.getElementById('game-status').value = game.status || 'planned';
    } else {
        currentGameId = null;
        document.getElementById('game-form').reset();
        document.getElementById('game-id').value = '';
    }
    modal.classList.remove('hidden');
}

async function editGame(id) {
    try {
        const games = await API.adminGetGames(); // можно получить конкретную игру, но для простоты используем закешированное
        const game = games.find(g => g.id == id);
        if (game) openGameModal(game);
    } catch (error) {
        UI.showNotification('Ошибка', 'error');
    }
}

async function deleteGame(id) {
    if (!confirm('Удалить игру? Это также удалит весь прогресс пользователей в этой игре.')) return;
    try {
        await API.adminDeleteGame(id);
        UI.showNotification('Игра удалена', 'success');
        await loadGames();
    } catch (error) {
        UI.showNotification('Ошибка удаления', 'error');
    }
}

async function toggleUserRole(e) {
    const userId = e.target.dataset.id;
    const currentRole = e.target.dataset.role;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Сменить роль пользователя на ${newRole}?`)) return;
    try {
        await API.adminUpdateUser(userId, { role: newRole });
        UI.showNotification('Роль обновлена', 'success');
        await loadUsers();
    } catch (error) {
        UI.showNotification('Ошибка', 'error');
    }
}

async function deleteUser(id) {
    if (!confirm('Удалить пользователя? Это также удалит весь его прогресс.')) return;
    try {
        await API.adminDeleteUser(id);
        UI.showNotification('Пользователь удалён', 'success');
        await loadUsers();
    } catch (error) {
        UI.showNotification('Ошибка удаления', 'error');
    }
}
