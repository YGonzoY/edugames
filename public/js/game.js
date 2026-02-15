import API from '../modules/api.js';
import UI from '../modules/ui.js';

export async function init(params) {
    console.log('Game page init', params);
    const gameId = params.id;
    
    try {
        const game = await API.getGame(gameId);
        document.getElementById('game-title').textContent = game.title;
        document.getElementById('game-description').textContent = game.description;
        
        const iframe = document.getElementById('game-frame');
        if (iframe) {
            iframe.src = game.path;  // например "/games/math-quiz/"
        }
    } catch (error) {
        UI.showNotification('Ошибка загрузки игры', 'error');
    }
}
