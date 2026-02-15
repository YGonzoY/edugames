class MathQuiz {
    constructor() {
        this.score = 0;
        this.currentQuestion = 0;
        this.totalQuestions = 10;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.timeLeft = 30;
        this.timer = null;
        this.gameActive = false;
        this.user = null;
        this.token = null;
        
        this.questions = [];
        this.generateQuestions();
        
        this.init();
    }
    
    generateQuestions() {
        for (let i = 0; i < this.totalQuestions; i++) {
            const type = Math.floor(Math.random() * 4); // 0: +, 1: -, 2: *, 3: /
            let a, b, answer, question;
            
            switch(type) {
                case 0: // Сложение
                    a = Math.floor(Math.random() * 20) + 1;
                    b = Math.floor(Math.random() * 20) + 1;
                    answer = a + b;
                    question = `${a} + ${b} = ?`;
                    break;
                case 1: // Вычитание
                    a = Math.floor(Math.random() * 30) + 10;
                    b = Math.floor(Math.random() * 10) + 1;
                    answer = a - b;
                    question = `${a} - ${b} = ?`;
                    break;
                case 2: // Умножение
                    a = Math.floor(Math.random() * 10) + 1;
                    b = Math.floor(Math.random() * 10) + 1;
                    answer = a * b;
                    question = `${a} × ${b} = ?`;
                    break;
                case 3: // Деление
                    b = Math.floor(Math.random() * 5) + 1;
                    answer = Math.floor(Math.random() * 5) + 1;
                    a = b * answer;
                    question = `${a} ÷ ${b} = ?`;
                    break;
            }
            
            // Генерируем варианты ответов
            const options = this.generateOptions(answer);
            
            this.questions.push({
                question,
                answer,
                options
            });
        }
    }
    
    generateOptions(correct) {
        const options = [correct];
        
        while (options.length < 4) {
            let wrong;
            if (Math.random() > 0.5) {
                wrong = correct + (Math.floor(Math.random() * 5) + 1);
            } else {
                wrong = Math.max(1, correct - (Math.floor(Math.random() * 5) + 1));
            }
            
            if (!options.includes(wrong) && wrong > 0) {
                options.push(wrong);
            }
        }
        
        // Перемешиваем варианты
        return this.shuffleArray(options);
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    init() {
        // Получаем данные из URL
        const params = new URLSearchParams(window.location.search);
        this.userId = params.get('userId');
        this.gameId = params.get('gameId') || 1;
        this.token = localStorage.getItem('eduGames_token');
        this.user = JSON.parse(localStorage.getItem('eduGames_user') || 'null');
        
        this.updateAuthStatus();
        
        // Добавляем обработчики событий
        document.getElementById('new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('play-again').addEventListener('click', () => this.startNewGame());
        
        // Запускаем игру
        this.startNewGame();
    }
    
    updateAuthStatus() {
        const statusEl = document.getElementById('auth-status');
        if (this.user) {
            statusEl.innerHTML = `✅ ${this.user.username}`;
        } else {
            statusEl.innerHTML = '⭕ Не авторизован (результаты не сохранятся)';
        }
    }
    
    startNewGame() {
        this.score = 0;
        this.currentQuestion = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.timeLeft = 30;
        this.gameActive = true;
        
        this.generateQuestions();
        
        document.getElementById('score').textContent = '0';
        document.getElementById('final-score').textContent = '0';
        document.getElementById('correct-answers').textContent = '0';
        document.getElementById('wrong-answers').textContent = '0';
        document.getElementById('total-time').textContent = '0';
        
        document.getElementById('question-screen').classList.remove('hidden');
        document.getElementById('result-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        
        this.showQuestion();
        this.startTimer();
    }
    
    showQuestion() {
        if (this.currentQuestion >= this.totalQuestions) {
            this.endGame();
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        document.getElementById('question').textContent = question.question;
        document.getElementById('question-counter').textContent = 
            `${this.currentQuestion + 1}/${this.totalQuestions}`;
        
        const answersContainer = document.getElementById('answers');
        answersContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.checkAnswer(option));
            answersContainer.appendChild(button);
        });
    }
    
    checkAnswer(answer) {
        if (!this.gameActive) return;
        
        const question = this.questions[this.currentQuestion];
        const isCorrect = answer === question.answer;
        
        if (isCorrect) {
            this.score += 10;
            this.correctAnswers++;
            this.showResult(true);
        } else {
            this.wrongAnswers++;
            this.showResult(false);
        }
        
        document.getElementById('score').textContent = this.score;
        
        this.currentQuestion++;
        
        setTimeout(() => {
            if (this.currentQuestion < this.totalQuestions && this.gameActive) {
                this.showQuestion();
            } else if (this.gameActive) {
                this.endGame();
            }
        }, 1000);
    }
    
    showResult(isCorrect) {
        const resultScreen = document.getElementById('result-screen');
        const resultIcon = document.getElementById('result-icon');
        const resultText = document.getElementById('result-text');
        const resultScore = document.getElementById('result-score');
        
        resultIcon.textContent = isCorrect ? '✅' : '❌';
        resultText.textContent = isCorrect ? 'Правильно!' : 'Неправильно!';
        resultScore.textContent = isCorrect ? '+10 очков' : '0 очков';
        
        resultScreen.classList.remove('hidden');
        
        setTimeout(() => {
            resultScreen.classList.add('hidden');
        }, 800);
    }
    
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            if (!this.gameActive) return;
            
            this.timeLeft--;
            document.getElementById('timer').textContent = `${this.timeLeft}s`;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);
        
        document.getElementById('question-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('correct-answers').textContent = this.correctAnswers;
        document.getElementById('wrong-answers').textContent = this.wrongAnswers;
        document.getElementById('total-time').textContent = 30 - this.timeLeft;
        
        // Сохраняем результат
        if (this.user) {
            this.saveProgress();
        }
    }
    
    async saveProgress() {
        try {
            const saveStatus = document.getElementById('save-status');
            saveStatus.textContent = '💾 Сохранение...';
            
            const response = await fetch(`/api/game/${this.gameId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    score: this.score,
                    completed: this.score > 0,
                    timeSpent: 30 - this.timeLeft,
                    correctAnswers: this.correctAnswers,
                    wrongAnswers: this.wrongAnswers
                })
            });
            
            if (response.ok) {
                saveStatus.textContent = '✅ Сохранено';
                setTimeout(() => {
                    saveStatus.textContent = '';
                }, 3000);
            } else {
                saveStatus.textContent = '❌ Ошибка сохранения';
            }
            
        } catch (error) {
            console.error('Error saving progress:', error);
            document.getElementById('save-status').textContent = '❌ Ошибка';
        }
    }
}

// Запускаем игру
document.addEventListener('DOMContentLoaded', () => {
    new MathQuiz();
});
