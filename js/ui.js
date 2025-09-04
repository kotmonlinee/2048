// UI交互逻辑
import { Game2048 } from './game.js'
import { trackGAEvent } from './paramsHandler.js'
import { trackChallengeStarted } from './paramsHandler.js'
class GameUI {
    constructor() {
        this.game = new Game2048();
        this.gameBoard = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        // this.newGameButton = document.getElementById('new-game');
        this.restartGameButton = document.getElementById('restart-game');
        this.gameOverElement = document.getElementById('game-over');
        
        // 限时挑战模式UI元素
        this.countdownElement = document.getElementById('countdown');
        this.timerElement = document.getElementById('timer');
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.countdownScreen = document.getElementById('countdown-screen');
        this.readyCountdownElement = document.getElementById('ready-countdown');
        this.startChallengeButton = document.getElementById('start-challenge');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.downloadAppButton = document.getElementById('download-app');
        
        // 游戏引导元素
        this.gameGuide = document.getElementById('game-guide');
       // this.guideMessage = document.getElementById('guide-message');
        this.guideHighlight = document.getElementById('guide-highlight');
        
        // 触摸事件变量
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        
        // 拖拽相关变量
        this.isDragging = false;
        this.draggedTile = null; // 被拖拽的方块信息
        this.draggedTileElement = null; // 拖拽的视觉元素
        this.dragStartPosition = { row: 0, col: 0 };
        // 拖拽目标相关变量
        this.currentDragTarget = null; // 当前拖拽下方的目标方块元素
        this.currentDragTargetCanMerge = false; // 当前目标是否可以合并
        
        // 初始化游戏事件回调
        this.initGameCallbacks();
        
        // 初始化UI
        this.initUI();
        // 添加事件监听
        this.addEventListeners();
        // 渲染游戏棋盘
        this.renderBoard();
    }
    
    // 初始化游戏事件回调
    initGameCallbacks() {
        // 设置时间更新回调 - 包含毫秒数参数
        this.game.setTimeUpdateCallback((remainingTime, remainingMilliseconds = 0) => {
            this.updateCountdown(remainingTime, remainingMilliseconds);
        });
        
        // 设置游戏完成回调
        this.game.setGameCompleteCallback((isSuccess, reason = null) => {
            this.showGameResult(isSuccess, reason);
        });
    }

    // 显示游戏引导
    showGameGuide() {
        // 查找第一个可合并的方块对
        const mergeablePair = this.game.findFirstMergeablePair();
        
        if (mergeablePair) {
            // 只显示滑动提示箭头，不显示弹窗
            // 确保guide-message不显示
            if (this.guideMessage) {
                this.guideMessage.style.display = 'none';
            }
            
            // 显示引导界面，但确保不会阻止玩家交互
            this.gameGuide.classList.remove('opacity-0');
            this.gameGuide.classList.add('pointer-events-none'); // 关键修改：添加pointer-events-none确保可点击下方元素
            
            // 高亮显示可合并的方块
            this.highlightMergeableTiles(mergeablePair);
        }
    }

    // 高亮显示可合并的方块并添加滑动提示
    highlightMergeableTiles(mergeablePair) {
        // 清空之前的高亮
        this.guideHighlight.innerHTML = '';
        
        // 获取源方块和目标方块的DOM元素
        const fromCell = this.getCellAtPosition(mergeablePair.from.row, mergeablePair.from.col);
        const toCell = this.getCellAtPosition(mergeablePair.to.row, mergeablePair.to.col);
        
        if (fromCell && toCell) {
            // 获取单元格的位置信息
            const fromRect = fromCell.getBoundingClientRect();
            const boardRect = this.gameBoard.getBoundingClientRect();
            
            // 计算相对位置
            const fromX = fromRect.left - boardRect.left + fromRect.width / 2;
            const fromY = fromRect.top - boardRect.top + fromRect.height / 2;
            const toRect = toCell.getBoundingClientRect();
            const toX = toRect.left - boardRect.left + toRect.width / 2;
            const toY = toRect.top - boardRect.top + toRect.height / 2;
            
            // 创建滑动路径
            const path = document.createElement('div');
            path.className = 'absolute bg-primary/30 rounded-full transition-all duration-300 pointer-events-none';
            path.style.width = '8px';
            path.style.height = '8px';
            path.style.left = `${fromX - 4}px`;
            path.style.top = `${fromY - 4}px`;
            path.style.transform = 'scale(0)';
            path.style.zIndex = '10';
            this.guideHighlight.appendChild(path);
            
            // 创建手指滑动动画
            const finger = document.createElement('div');
            finger.className = 'absolute pointer-events-none animate-swipe';
            finger.style.fontSize = '32px'; // 增大手指图标尺寸使其更明显
            finger.style.color = 'white';
            finger.style.textShadow = '0 0 8px rgba(255, 255, 255, 0.8)'; // 添加发光效果
            finger.style.zIndex = '12';
            finger.style.left = `${fromX - 16}px`;
            finger.style.top = `${fromY - 16}px`;
            finger.style.transform = 'scale(0)';
            finger.textContent = '👉'; // 手指图标
            this.guideHighlight.appendChild(finger);
            
            // 添加动画效果
            setTimeout(() => {
                path.style.transform = 'scale(1)';
                finger.style.transform = 'scale(1)';
                setTimeout(() => {
                    path.style.left = `${toX - 4}px`;
                    path.style.top = `${toY - 4}px`;
                    
                    // 根据方向旋转手指图标
                    let fingerRotation = 0;
                    switch(mergeablePair.direction) {
                        case 'right':
                            fingerRotation = 0;
                            break;
                        case 'down':
                            fingerRotation = 90;
                            break;
                        case 'left':
                            fingerRotation = 180;
                            break;
                        case 'up':
                            fingerRotation = 270;
                            break;
                    }
                    
                    // 添加手指滑动动画
                    finger.style.transition = 'transform 0.6s ease-out, left 0.6s ease-out, top 0.6s ease-out'; // 延长动画时间
                    finger.style.transform = `rotate(${fingerRotation}deg) scale(1.2)`; // 先放大再滑动
                    
                    // 延迟滑动，让放大效果先显示
                    setTimeout(() => {
                        finger.style.transform = `rotate(${fingerRotation}deg) scale(1)`;
                        finger.style.left = `${toX - 16}px`;
                        finger.style.top = `${toY - 16}px`;
                    }, 150);
                    
                    // 动画完成后重置位置，创建循环动画
                    setTimeout(() => {
                        path.style.transition = 'none';
                        path.style.left = `${fromX - 4}px`;
                        path.style.top = `${fromY - 4}px`;
                        path.style.transform = 'scale(0)';
                        
                        finger.style.transition = 'none';
                        finger.style.left = `${fromX - 16}px`;
                        finger.style.top = `${fromY - 16}px`;
                        finger.style.transform = 'scale(0)';
                        
                        setTimeout(() => {
                            path.style.transition = 'all 0.3s ease';
                            finger.style.transition = 'all 0.3s ease';
                        }, 50);
                    }, 800);
                }, 300);
            }, 100);
            
            // 在源方块上添加箭头指示
            const arrow = document.createElement('div');
            arrow.className = 'absolute text-white font-bold text-2xl animate-guide-pulse pointer-events-none';
            arrow.textContent = this.getDirectionArrow(mergeablePair.direction);
            
            // 设置箭头位置
            const arrowSize = 24;
            arrow.style.width = `${arrowSize}px`;
            arrow.style.height = `${arrowSize}px`;
            arrow.style.display = 'flex';
            arrow.style.alignItems = 'center';
            arrow.style.justifyContent = 'center';
            arrow.style.left = `${fromX - arrowSize/2}px`;
            arrow.style.top = `${fromY - arrowSize/2}px`;
            arrow.style.zIndex = '11';
            
            // 根据方向旋转箭头
            let rotation = 0;
            switch(mergeablePair.direction) {
                case 'right':
                    rotation = 0;
                    break;
                case 'down':
                    rotation = 90;
                    break;
                case 'left':
                    rotation = 180;
                    break;
                case 'up':
                    rotation = 270;
                    break;
            }
            arrow.style.transform = `rotate(${rotation}deg)`;
            
            this.guideHighlight.appendChild(arrow);
            
            // 高亮源方块和目标方块
            const highlightFrom = this.createHighlight(fromCell, 'from');
            const highlightTo = this.createHighlight(toCell, 'to');
            
            this.guideHighlight.appendChild(highlightFrom);
            this.guideHighlight.appendChild(highlightTo);
        }
    }

    // 创建高亮元素
    createHighlight(cell, type) {
        const rect = cell.getBoundingClientRect();
        const boardRect = this.gameBoard.getBoundingClientRect();
        
        const highlight = document.createElement('div');
        highlight.className = `absolute rounded-lg transition-all duration-300 border-2 pointer-events-none`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.left = `${rect.left - boardRect.left}px`;
        highlight.style.top = `${rect.top - boardRect.top}px`;
        highlight.style.zIndex = '9';
        
        // 设置不同类型的高亮样式
        if (type === 'from') {
            highlight.style.borderColor = '#FFD166';
            highlight.style.animation = 'pulse 1s ease-in-out infinite';
        } else {
            highlight.style.borderColor = '#06D6A0';
        }
        
        return highlight;
    }

    // 获取方向箭头符号
    getDirectionArrow(direction) {
        switch(direction) {
            case 'right':
                return '→';
            case 'down':
                return '↓';
            case 'left':
                return '←';
            case 'up':
                return '↑';
            default:
                return '→';
        }
    }

    // 获取指定位置的单元格
    getCellAtPosition(row, col) {
        const cells = this.gameBoard.children;
        const index = row * this.game.cols + col;
        return cells[index] || null;
    }

    // 隐藏游戏引导
    hideGameGuide() {
        this.gameGuide.classList.add('opacity-0', 'pointer-events-none');
        this.guideHighlight.innerHTML = '';
    }
    
    // 初始化UI
    initUI() {
        // 清空游戏棋盘
        this.gameBoard.innerHTML = '';
        
        // 动态设置棋盘样式为5x7网格
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.game.cols}, minmax(0, 1fr))`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.game.rows}, minmax(0, 1fr))`;
        
        // 创建棋盘格子
        for (let i = 0; i < this.game.rows; i++) {
            for (let j = 0; j < this.game.cols; j++) {
                const cell = document.createElement('div');
                cell.className = 'bg-tile-0/80 rounded-lg relative overflow-hidden transition-all duration-200';
                cell.dataset.row = i;
                cell.dataset.col = j;
                this.gameBoard.appendChild(cell);
            }
        }
        
        // 更新分数显示
        this.updateScoreDisplay();
        
        // 隐藏游戏结束遮罩
        this.gameOverElement.classList.add('opacity-0', 'pointer-events-none');
        
        // 确保棋盘可见
        this.gameBoard.style.opacity = '1';
        this.gameBoard.style.pointerEvents = 'auto';
        this.gameBoard.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    // 添加事件监听
    addEventListeners() {
        // 键盘事件
        //不需要支持键盘事件
        // document.addEventListener('keydown', (event) => {
        //     if (this.game.isGameOver) return;
        //     
        //     switch (event.key) {
        //         case 'ArrowUp':
        //             event.preventDefault();
        //             this.game.moveUp();
        //             this.renderBoard();
        //             break;
        //         case 'ArrowDown':
        //             event.preventDefault();
        //             this.game.moveDown();
        //             this.renderBoard();
        //             break;
        //         case 'ArrowLeft':
        //             event.preventDefault();
        //             this.game.moveLeft();
        //             this.renderBoard();
        //             break;
        //         case 'ArrowRight':
        //             event.preventDefault();
        //             this.game.moveRight();
        //             this.renderBoard();
        //             break;
        //     }
        // });
        
        // 触摸事件 - 开始（只在游戏棋盘内响应）
        this.gameBoard.addEventListener('touchstart', (event) => {
            event.preventDefault(); // 防止页面滚动
            if (this.game.isGameOver) return;
            
            // 隐藏游戏引导
            this.hideGameGuide();
            
            this.touchStartX = event.touches[0].clientX;
            this.touchStartY = event.touches[0].clientY;
            
            // 获取触摸的方块信息，开始拖拽
            const touchedTile = this.getTileAtTouchPosition(this.touchStartX, this.touchStartY);
            if (touchedTile) {
                this.startDrag(touchedTile, event.touches[0]);
            }
        });
        
        // 触摸事件 - 移动（只在游戏棋盘内响应）
        this.gameBoard.addEventListener('touchmove', (event) => {
            event.preventDefault(); // 防止页面滚动
            if (this.isDragging && event.touches.length > 0) {
                this.handleDrag(event.touches[0]);
            }
        });
        
        // 触摸事件 - 结束（只在游戏棋盘内响应）
        this.gameBoard.addEventListener('touchend', (event) => {
            event.preventDefault(); // 防止页面滚动
            if (this.game.isGameOver) return;
            
            this.touchEndX = event.changedTouches[0].clientX;
            this.touchEndY = event.changedTouches[0].clientY;
            
            // 如果正在拖拽，结束拖拽并处理合并
            if (this.isDragging) {
                this.endDrag(event.changedTouches[0]);
            } else {
                // 否则执行普通的滑动操作
                this.handleSwipe();
            }
        });
        
        // 新游戏按钮
        // this.newGameButton.addEventListener('click', () => {
        //     this.restartGame();
        // });
        
        // 重新开始按钮
        this.restartGameButton.addEventListener('click', () => {
            // 上报点击再来一次事件
            trackGAEvent('game_restarted', {
                event_category: 'Game Flow',
                event_label: 'User restarted the game'
            });
            this.restartGame();
        });
        
        // 开始挑战按钮
        this.startChallengeButton.addEventListener('click', () => {
            // 上报点击开始挑战事件
            trackGAEvent('challenge_started', {
                event_category: 'Game Flow',
                event_label: 'User started the 2048 challenge'
            });

            trackChallengeStarted();
            this.startGameChallenge();
        });
        
        // 游戏结束遮罩中的下载按钮
        if (this.downloadAppButton) {
            this.downloadAppButton.addEventListener('click', () => {
                // 上报点击下载App事件
                trackGAEvent('app_download_clicked', {
                    event_category: 'Conversion',
                    event_label: 'User clicked download button in game over screen'
                });
            });
        }
        
        // 游戏下载区域中的下载按钮
        const downloadAppBtn = document.getElementById('download-app-btn');
        if (downloadAppBtn) {
            downloadAppBtn.addEventListener('click', () => {
                // 上报点击下载App事件
                trackGAEvent('app_download_clicked', {
                    event_category: 'Conversion',
                    event_label: 'User clicked download button in main area'
                });
            });
        }
    }
    
    // 开始游戏挑战流程
    startGameChallenge() {
        // 平滑隐藏欢迎弹窗
        this.welcomeScreen.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        this.welcomeScreen.style.transform = 'scale(0.95)';
        this.welcomeScreen.style.opacity = '0';
        this.welcomeScreen.style.pointerEvents = 'none';
        
        // 完全隐藏弹窗
        setTimeout(() => {
            this.welcomeScreen.style.display = 'none';
            // 显示准备倒计时并开始游戏
            this.startGameWithCountdown();
        }, 300);
    }
    
    // 显示准备倒计时并开始游戏（可被直接调用以跳过欢迎弹窗）
    startGameWithCountdown() {
        // 确保倒计时屏幕可见并重置样式
        this.countdownScreen.style.display = 'flex';
        this.countdownScreen.style.opacity = '1';
        this.countdownScreen.classList.remove('opacity-0', 'pointer-events-none');
        
        // 确保棋盘可见
        this.gameBoard.style.opacity = '1';
        this.gameBoard.style.pointerEvents = 'auto';
        this.gameBoard.classList.remove('opacity-0', 'pointer-events-none');
        
        // 执行3-2-1倒计时
        let readyCount = 3;
        this.readyCountdownElement.textContent = readyCount;
        
        // 确保动画正确触发
        this.readyCountdownElement.classList.remove('animate-ready-countdown');
        void this.readyCountdownElement.offsetWidth; // 强制重排
        this.readyCountdownElement.classList.add('animate-ready-countdown');
        
        const countdownInterval = setInterval(() => {
            readyCount--;
            if (readyCount > 0) {
                this.readyCountdownElement.textContent = readyCount;
                // 重置动画
                this.readyCountdownElement.classList.remove('animate-ready-countdown');
                void this.readyCountdownElement.offsetWidth; // 触发重排
                this.readyCountdownElement.classList.add('animate-ready-countdown');
            } else {
                clearInterval(countdownInterval);
                
                // 隐藏倒计时准备界面
                this.countdownScreen.classList.add('opacity-0', 'pointer-events-none');
                this.countdownScreen.style.display = 'none';
                
                // 确保游戏计时器正确启动
                setTimeout(() => {
                    // 显式重置游戏时间
                    this.game.remainingTime = this.game.timeLimit;
                    this.game.remainingMilliseconds = 0;
                    this.updateCountdown(this.game.remainingTime, this.game.remainingMilliseconds);
                    
                    // 确保游戏状态正确
                    this.game.isGameOver = false;
                    this.game.isWon = false;
                    
                    // 开始游戏计时器
                    this.game.startTimer();
                    
                    // 显示游戏引导（延迟1秒，让玩家先看到初始棋盘）
                    setTimeout(() => {
                        this.showGameGuide();
                    }, 1000);
                }, 300);
            }
        }, 1000);
    }
    
    // 更新倒计时显示 - 支持毫秒级显示
    updateCountdown(remainingTime, remainingMilliseconds) {
        // 格式化毫秒数，只显示前两位
        const formattedMilliseconds = Math.floor(remainingMilliseconds / 10).toString().padStart(2, '0');
        
        // 更新倒计时显示，格式为：秒.毫秒
        this.countdownElement.textContent = `${remainingTime}.${formattedMilliseconds}`;
        
        // 当剩余时间小于5秒时，添加警告动画
        if (remainingTime <= 5 && remainingTime > 0) {
            this.timerElement.classList.add('animate-countdown-warning');
        } else {
            this.timerElement.classList.remove('animate-countdown-warning');
        }
    }
    
    // 清理游戏状态 - 在游戏结束时调用，确保所有动画和拖拽状态都被重置
    cleanupGameState() {
        // 清除所有拖拽目标的视觉反馈
        this.clearDragTargetFeedback();
        
        // 如果正在拖拽，立即结束拖拽并清理拖拽元素
        if (this.isDragging && this.draggedTileElement) {
            // 恢复原始方块的可见性
            if (this.dragStartPosition) {
                const startCellIndex = this.dragStartPosition.row * this.game.cols + this.dragStartPosition.col;
                const startCell = this.gameBoard.children[startCellIndex];
                const originalTile = startCell.querySelector('div');
                if (originalTile) {
                    originalTile.style.transition = 'none';
                    originalTile.style.opacity = '1';
                }
            }
            
            // 移除拖拽元素
            if (this.draggedTileElement.parentNode) {
                this.draggedTileElement.parentNode.removeChild(this.draggedTileElement);
            }
            
            // 重置拖拽状态
            this.isDragging = false;
            this.draggedTile = null;
            this.draggedTileElement = null;
            this.dragStartPosition = null;
        }
        
        // 清除所有方块上的动画和样式
        this.clearAllTileAnimations();
        
        // 重新渲染棋盘，确保所有方块都显示在正确位置
        this.renderBoard();
    }
    
    // 显示游戏结果（成功或失败）
    showGameResult(isSuccess, reason = null) {
        // 在显示结果之前，清理所有游戏状态
        this.cleanupGameState();
        
        // 获取当前得分
        const currentScore = this.game.score || 0;
        
        // 上报挑战成功或失败事件
        const eventName = isSuccess ? 'challenge_success' : 'challenge_failed';
        trackGAEvent(eventName, {
            event_category: 'Game Result',
            event_label: isSuccess ? 'User successfully completed the challenge' : `Challenge failed due to ${reason || 'unknown'}`,
            value: currentScore
        });
        
        // 设置标题和消息
        if (isSuccess) {
            this.gameOverTitle.textContent = 'Challenge Complete!';
            this.gameOverMessage.textContent = 'Congratulations! You merged to 2048 within 30 seconds! You\'re a gaming master! Download the full app for more challenges!';
        } else {
            if (reason === 'no_moves') {
                this.gameOverTitle.textContent = 'Challenge Failed!';
                this.gameOverMessage.textContent = 'No more moves available! Download the full app to practice and challenge your limits!';
            } else {
                this.gameOverTitle.textContent = 'Time\'s Up!';
                this.gameOverMessage.textContent = '30 seconds are up! Download the full app to practice and challenge your limits!';
            }
        }
        
        // 显示游戏结束遮罩
        this.gameOverElement.classList.remove('opacity-0', 'pointer-events-none');
    }
    
    // 显示游戏结束或获胜
    showGameOver() {
        // 这个方法已被showGameResult方法替代，但保留以保持向后兼容性
        const isSuccess = this.game.isWon;
        this.showGameResult(isSuccess);
    }
    
    // 重新开始游戏 - 包含完整的倒计时流程
    restartGame() {
        // 重置游戏状态
        this.game.resetGame();
        
        // 隐藏所有界面
        this.gameOverElement.classList.add('opacity-0', 'pointer-events-none');
        this.countdownScreen.classList.add('opacity-0', 'pointer-events-none');
        this.welcomeScreen.classList.add('opacity-0', 'pointer-events-none');
        this.welcomeScreen.style.display = 'none';
        
        // 移除计时器警告动画
        this.timerElement.classList.remove('animate-countdown-warning');
        
        // 重置倒计时显示
        this.game.remainingMilliseconds = 0;
        this.updateCountdown(this.game.timeLimit, this.game.remainingMilliseconds);
        
        // 重新初始化UI
        this.initUI();
        
        // 重新初始化游戏事件回调（确保计时器和倒计时功能正常工作）
        this.initGameCallbacks();
        
        // 渲染游戏棋盘
        this.renderBoard();
        
        // 显示准备倒计时并开始游戏（跳过欢迎弹窗，直接进入倒计时）
        setTimeout(() => {
            this.startGameWithCountdown();
        }, 500);
    }

    // 根据触摸位置获取对应的数字方块
    getTileAtTouchPosition(touchX, touchY) {
        // 获取游戏棋盘的位置信息
        const gameBoardRect = this.gameBoard.getBoundingClientRect();
        
        // 检查触摸点是否在游戏棋盘内
        if (touchX < gameBoardRect.left || touchX > gameBoardRect.right ||
            touchY < gameBoardRect.top || touchY > gameBoardRect.bottom) {
            return null; // 触摸点不在棋盘内
        }
        
        // 计算触摸点在棋盘内的相对位置
        const relativeX = touchX - gameBoardRect.left;
        const relativeY = touchY - gameBoardRect.top;
        
        // 计算当前触摸的行和列
        const colWidth = gameBoardRect.width / this.game.cols;
        const rowHeight = gameBoardRect.height / this.game.rows;
        
        const col = Math.floor(relativeX / colWidth);
        const row = Math.floor(relativeY / rowHeight);
        
        // 确保行列索引在有效范围内
        if (row >= 0 && row < this.game.rows && col >= 0 && col < this.game.cols) {
            // 返回对应位置的数字值和行列信息
            return {
                value: this.game.board[row][col],
                row: row,
                col: col
            };
        }
        
        return null; // 无效的位置
    }

    // 使用示例（可以在触摸事件处理中调用）
    // this.gameBoard.addEventListener('touchstart', (event) => {
    //     event.preventDefault();
    //     if (this.game.isGameOver) return;
        
    //     const touchX = event.touches[0].clientX;
    //     const touchY = event.touches[0].clientY;
        
    //     // 获取当前触摸的数字方块
    //     const touchedTile = this.getTileAtTouchPosition(touchX, touchY);
    //     if (touchedTile) {
    //         console.log(`触摸了位置 (${touchedTile.row}, ${touchedTile.col}) 的数字: ${touchedTile.value}`);
    //         // 这里可以添加处理逻辑
    //     }
    // });

    // 开始拖拽
    startDrag(tileInfo, touch) {
        if (tileInfo.value === 0) return;
        
        this.isDragging = true;
        this.draggedTile = tileInfo;
        this.dragStartPosition = { row: tileInfo.row, col: tileInfo.col };
        
        // 获取游戏棋盘的位置
        const cellIndex = tileInfo.row * this.game.cols + tileInfo.col;
        const cell = this.gameBoard.children[cellIndex];
        const originalTile = cell.querySelector('div');
        
        if (originalTile) {
            // 创建拖拽的视觉元素
            this.draggedTileElement = originalTile.cloneNode(true);
            
            // 获取原始位置信息（保持在格子内）
            const cellRect = cell.getBoundingClientRect();
            const gameBoardRect = this.gameBoard.getBoundingClientRect();
            
            // 设置样式 - 保持原始位置的悬浮效果
            this.draggedTileElement.style.position = 'fixed';
            this.draggedTileElement.style.zIndex = '100';
            this.draggedTileElement.style.width = cell.offsetWidth + 'px';
            this.draggedTileElement.style.height = cell.offsetHeight + 'px';
            this.draggedTileElement.style.borderRadius = '8px';
            this.draggedTileElement.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
            
            // 设置初始位置（保持在原始格子位置）
            this.draggedTileElement.style.left = cellRect.left + 'px';
            this.draggedTileElement.style.top = cellRect.top + 'px';
            
            // 添加到body
            document.body.appendChild(this.draggedTileElement);
            
            // 添加选中动画：放大和抖动效果
            this.draggedTileElement.style.transition = 'all 200ms cubic-bezier(0.1, 0.8, 0.2, 1)';
            
            // 触发重排以确保动画生效
            void this.draggedTileElement.offsetWidth;
            
            // 应用缩小和抖动效果
            this.draggedTileElement.style.transform = 'scale(0.9)';
            
            // 轻微抖动效果
            setTimeout(() => {
                if (this.draggedTileElement) {
                    this.draggedTileElement.style.transition = 'transform 150ms ease-in-out';
                    this.draggedTileElement.style.transform = 'scale(0.95) rotate(-2deg)';
                    setTimeout(() => {
                        if (this.draggedTileElement) {
                            this.draggedTileElement.style.transform = 'scale(0.95) rotate(2deg)';
                            setTimeout(() => {
                                if (this.draggedTileElement) {
                                    this.draggedTileElement.style.transform = 'scale(0.95) rotate(0deg)';
                                }
                            }, 100);
                        }
                    }, 100);
                }
            }, 50);
            
            // 原始方块半透明显示
            originalTile.style.opacity = '0.5';
        }
    }
    
    // 处理拖拽移动
    handleDrag(touch) {
        if (!this.isDragging || !this.draggedTileElement) return;
        
        // 更新拖拽元素的位置
        this.updateDraggedElementPosition(touch.clientX, touch.clientY);
        
        // 检测当前拖拽下方的方块，并提供视觉反馈
        this.updateDragTargetFeedback(touch.clientX, touch.clientY);
    }
    
    // 更新拖拽目标的视觉反馈
    updateDragTargetFeedback(x, y) {
        // 清除之前的目标反馈
        this.clearDragTargetFeedback();
        
        // 获取当前拖拽位置下方的方块信息
        const currentTarget = this.getTileAtTouchPosition(x, y);
        
        if (currentTarget) {
            // 检查是否可以合并
            const canMerge = this.checkIfCanMerge(currentTarget);
            
            // 获取目标方块的DOM元素
            const cellIndex = currentTarget.row * this.game.cols + currentTarget.col;
            const cell = this.gameBoard.children[cellIndex];
            const targetElement = cell.querySelector('div');
            
            if (targetElement) {
                // 记录当前目标元素，便于后续清除反馈
                this.currentDragTarget = targetElement;
                this.currentDragTargetCanMerge = canMerge;
                
                if (canMerge) {
                    // 可合并时的视觉反馈：放大和抖动
                    this.applyMergeFeedback(targetElement);
                } else if (currentTarget.value !== 0) {
                    // 不可合并且不是空格子时的视觉反馈：拒绝和抖动
                    this.applyRejectFeedback(targetElement);
                }
            }
        }
    }
    
    // 检查是否可以与当前拖拽的方块合并
    checkIfCanMerge(targetTile) {
        if (!this.draggedTile) return false;
        
        // 检查值是否相同
        if (targetTile.value !== this.draggedTile.value) return false;
        
        // 检查是否是相邻格子
        const rowDiff = Math.abs(targetTile.row - this.dragStartPosition.row);
        const colDiff = Math.abs(targetTile.col - this.dragStartPosition.col);
        
        // 只允许相邻格子合并（上下左右）或同一格子
        return (rowDiff === 1 && colDiff === 0) || 
               (rowDiff === 0 && colDiff === 1) || 
               (rowDiff === 0 && colDiff === 0);
    }
    
    // 应用可合并的视觉反馈 - 改进版
    applyMergeFeedback(element) {
        // 保存原始样式，便于后续恢复
        if (!element.dataset.originalStyle) {
            element.dataset.originalStyle = element.style.cssText;
            element.dataset.originalTransform = getComputedStyle(element).transform;
            element.dataset.originalBoxShadow = element.style.boxShadow;
            element.dataset.originalBorder = element.style.border;
            element.dataset.originalZIndex = element.style.zIndex;
            // 保存字体相关样式
            element.dataset.originalFontSize = element.style.fontSize;
            element.dataset.originalFontWeight = element.style.fontWeight;
        }
        
        // 立即应用基础增强效果
        element.style.transition = 'transform 300ms cubic-bezier(0.1, 0.8, 0.2, 1), border 300ms ease, box-shadow 300ms ease';
        element.style.transform = (element.dataset.originalTransform || 'none') + ' scale(1.25)';
        element.style.zIndex = '50'; // 提高层级，让用户感觉浮起来
        element.style.border = '3px solid rgba(255, 255, 255, 0.8)'; // 添加白色边框
        element.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.6), ' + (element.dataset.originalBoxShadow || ''); // 添加金色发光效果
        
        // 增强的抖动和脉动效果
        this.startPulseAnimation(element);
    }
    
    // 启动脉动动画效果 - 修复版
    startPulseAnimation(element) {
        if (!element || element !== this.currentDragTarget || !this.currentDragTargetCanMerge) {
            // 如果状态无效，立即恢复原始样式
            if (element && element.dataset.originalTransform) {
                element.style.transition = 'transform 200ms ease-out';
                element.style.transform = element.dataset.originalTransform;
            }
            return;
        }
        
        // 清除之前的动画帧
        if (element.dataset.animationId) {
            cancelAnimationFrame(element.dataset.animationId);
            element.dataset.animationId = null;
        }
        
        let scale = 1.25;
        let increasing = false;
        const animate = () => {
            // 检查元素状态是否仍然有效
            if (!element || element !== this.currentDragTarget || !this.currentDragTargetCanMerge) {
                // 如果状态改变，立即恢复原始样式
                if (element && element.dataset.originalTransform) {
                    element.style.transition = 'transform 200ms ease-out';
                    element.style.transform = element.dataset.originalTransform;
                }
                return;
            }
            
            // 调整缩放比例，创建脉动效果
            if (increasing) {
                scale += 0.02;
                if (scale >= 1.35) increasing = false;
            } else {
                scale -= 0.02;
                if (scale <= 1.25) increasing = true;
            }
            
            // 同时添加轻微的旋转，增强动感
            const rotation = (Math.sin(Date.now() / 300) * 3); // 3度的正弦摆动
            
            // 应用变换 - 避免影响字体大小
            element.style.transform = (element.dataset.originalTransform || 'none') + 
                                     ` scale(${scale}) rotate(${rotation}deg)`;
            
            // 继续下一帧
            element.dataset.animationId = requestAnimationFrame(animate);
        };
        
        // 开始动画
        element.dataset.animationId = requestAnimationFrame(animate);
    }
    
    // 应用不可合并的视觉反馈
    applyRejectFeedback(element) {
        // 保存原始样式，便于后续恢复
        if (!element.dataset.originalStyle) {
            element.dataset.originalStyle = element.style.cssText;
            element.dataset.originalTransform = getComputedStyle(element).transform;
            element.dataset.originalBoxShadow = element.style.boxShadow;
            element.dataset.originalBorder = element.style.border;
            element.dataset.originalZIndex = element.style.zIndex;
        }
        
        // 添加拒绝动画（左右晃动）
        element.style.transition = 'transform 100ms ease-in-out';
        element.style.transform = (element.dataset.originalTransform || 'none') + ' translateX(-5px)';
        
        setTimeout(() => {
            if (element === this.currentDragTarget && !this.currentDragTargetCanMerge) {
                element.style.transform = (element.dataset.originalTransform || 'none') + ' translateX(5px)';
                setTimeout(() => {
                    if (element === this.currentDragTarget && !this.currentDragTargetCanMerge) {
                        element.style.transform = (element.dataset.originalTransform || 'none') + ' translateX(-3px)';
                        setTimeout(() => {
                            if (element === this.currentDragTarget && !this.currentDragTargetCanMerge) {
                                element.style.transform = (element.dataset.originalTransform || 'none') + ' translateX(3px)';
                                setTimeout(() => {
                                    if (element === this.currentDragTarget && !this.currentDragTargetCanMerge) {
                                        element.style.transform = element.dataset.originalTransform || 'none';
                                    }
                                }, 80);
                            }
                        }, 80);
                    }
                }, 80);
            }
        }, 80);
    }
    
    // 清除拖拽目标的视觉反馈 - 增强版
    clearDragTargetFeedback() {
        // 取消当前目标的动画
        if (this.currentDragTarget) {
            // 取消动画帧
            if (this.currentDragTarget.dataset.animationId) {
                cancelAnimationFrame(this.currentDragTarget.dataset.animationId);
                delete this.currentDragTarget.dataset.animationId;
            }
            
            // 强制恢复原始样式 - 使用即时应用而非过渡效果
            this.currentDragTarget.style.transition = 'none'; // 禁用过渡，确保立即恢复
            
            // 分别恢复重要样式
            if (this.currentDragTarget.dataset.originalTransform) {
                // 立即恢复原始变换，避免缩放影响字体
                this.currentDragTarget.style.transform = this.currentDragTarget.dataset.originalTransform;
            } else {
                this.currentDragTarget.style.transform = 'none';
            }
            
            if (this.currentDragTarget.dataset.originalBoxShadow) {
                this.currentDragTarget.style.boxShadow = this.currentDragTarget.dataset.originalBoxShadow;
            } else {
                this.currentDragTarget.style.boxShadow = '';
            }
            
            if (this.currentDragTarget.dataset.originalBorder) {
                this.currentDragTarget.style.border = this.currentDragTarget.dataset.originalBorder;
            } else {
                this.currentDragTarget.style.border = '';
            }
            
            if (this.currentDragTarget.dataset.originalZIndex) {
                this.currentDragTarget.style.zIndex = this.currentDragTarget.dataset.originalZIndex;
            } else {
                this.currentDragTarget.style.zIndex = '';
            }
            
            // 恢复字体相关样式
            if (this.currentDragTarget.dataset.originalFontSize) {
                this.currentDragTarget.style.fontSize = this.currentDragTarget.dataset.originalFontSize;
                delete this.currentDragTarget.dataset.originalFontSize;
            }
            
            if (this.currentDragTarget.dataset.originalFontWeight) {
                this.currentDragTarget.style.fontWeight = this.currentDragTarget.dataset.originalFontWeight;
                delete this.currentDragTarget.dataset.originalFontWeight;
            }
            
            // 清除所有dataset属性
            delete this.currentDragTarget.dataset.animationId;
            delete this.currentDragTarget.dataset.originalStyle;
            delete this.currentDragTarget.dataset.originalTransform;
            delete this.currentDragTarget.dataset.originalBoxShadow;
            delete this.currentDragTarget.dataset.originalBorder;
            delete this.currentDragTarget.dataset.originalZIndex;
            
            // 重置当前目标
            this.currentDragTarget = null;
            this.currentDragTargetCanMerge = false;
        }
        
        // 额外安全检查：遍历所有可能的方块，清除任何残留的动画和样式
        this.clearAllTileAnimations();
    }
    
    // 清除所有方块上的动画和样式 - 增强安全机制
    clearAllTileAnimations() {
        // 获取游戏棋盘上的所有方块元素
        const allTiles = document.querySelectorAll('#game-board > div > div');
        
        allTiles.forEach(tile => {
            // 取消任何正在运行的动画
            if (tile.dataset.animationId) {
                cancelAnimationFrame(tile.dataset.animationId);
                delete tile.dataset.animationId;
            }
            
            // 强制禁用过渡，确保立即恢复原始样式
            tile.style.transition = 'none';
            
            // 恢复默认样式，如果有被修改过
            if (tile.dataset.originalTransform) {
                // 立即恢复原始变换，避免缩放影响字体
                tile.style.transform = tile.dataset.originalTransform;
                delete tile.dataset.originalTransform;
            } else {
                // 如果没有保存的变换，显式设置为none
                tile.style.transform = 'none';
            }
            
            if (tile.dataset.originalBoxShadow) {
                tile.style.boxShadow = tile.dataset.originalBoxShadow;
                delete tile.dataset.originalBoxShadow;
            } else {
                tile.style.boxShadow = '';
            }
            
            if (tile.dataset.originalBorder) {
                tile.style.border = tile.dataset.originalBorder;
                delete tile.dataset.originalBorder;
            } else {
                tile.style.border = '';
            }
            
            if (tile.dataset.originalZIndex) {
                tile.style.zIndex = tile.dataset.originalZIndex;
                delete tile.dataset.originalZIndex;
            } else {
                tile.style.zIndex = '';
            }
            
            // 恢复字体相关样式
            if (tile.dataset.originalFontSize) {
                tile.style.fontSize = tile.dataset.originalFontSize;
                delete tile.dataset.originalFontSize;
            }
            
            if (tile.dataset.originalFontWeight) {
                tile.style.fontWeight = tile.dataset.originalFontWeight;
                delete tile.dataset.originalFontWeight;
            }
            
            // 清除所有与动画相关的dataset属性
            delete tile.dataset.originalStyle;
        });
    }
    
    // 更新拖拽元素的位置
    updateDraggedElementPosition(x, y) {
        if (!this.draggedTileElement) return;
        
        const rect = this.draggedTileElement.getBoundingClientRect();
        this.draggedTileElement.style.left = (x - rect.width / 2) + 'px';
        this.draggedTileElement.style.top = (y - rect.height / 2) + 'px';
    }
    
    // 结束拖拽
    endDrag(touch) {
        if (!this.isDragging || !this.draggedTileElement || !this.draggedTile) return;
        
        // 清除所有拖拽目标的视觉反馈
        this.clearDragTargetFeedback();
        
        // 获取释放位置的方块信息
        const releaseTile = this.getTileAtTouchPosition(touch.clientX, touch.clientY);
        
        // 恢复原始方块的可见性
        const startCellIndex = this.dragStartPosition.row * this.game.cols + this.dragStartPosition.col;
        const startCell = this.gameBoard.children[startCellIndex];
        const originalTile = startCell.querySelector('div');
        if (originalTile) {
            // 添加平滑过渡效果
            originalTile.style.transition = 'opacity 200ms ease-out';
            originalTile.style.opacity = '1';
        }
        
        // 检查是否可以合并
        let canMerge = false;
        if (releaseTile && releaseTile.value === this.draggedTile.value) {
            // 计算拖拽距离，判断是否相邻
            const rowDiff = Math.abs(releaseTile.row - this.dragStartPosition.row);
            const colDiff = Math.abs(releaseTile.col - this.dragStartPosition.col);
            
            // 只允许相邻格子合并（上下左右）或同一格子
            if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1) || (rowDiff === 0 && colDiff === 0)) {
                canMerge = true;
            }
        }
        
        // 处理合并或返回
        if (canMerge && releaseTile) {
            // 执行合并
            this.performDragMerge(this.draggedTile, releaseTile);
            
            // 合并成功后清理拖拽状态
            this.isDragging = false;
            this.draggedTile = null;
            
            // 移除拖拽元素
            if (this.draggedTileElement && this.draggedTileElement.parentNode) {
                this.draggedTileElement.parentNode.removeChild(this.draggedTileElement);
            }
            this.draggedTileElement = null;
        } else {
            // 返回原位（添加动画效果）
            // 注意：返回动画的清理操作已在animateReturnToOriginalPosition方法内部完成
            this.animateReturnToOriginalPosition();
        }
    }
    
    // 动画返回到原始位置 - 增强抖动效果
    animateReturnToOriginalPosition() {
        const gameBoardRect = this.gameBoard.getBoundingClientRect();
        const cellIndex = this.dragStartPosition.row * this.game.cols + this.dragStartPosition.col;
        const cell = this.gameBoard.children[cellIndex];
        
        if (cell && this.draggedTileElement) {
            const targetRect = cell.getBoundingClientRect();
            
            // 先添加一个更明显的缩放缩小效果表示拒绝
            this.draggedTileElement.style.transition = 'all 50ms ease-out';
            this.draggedTileElement.style.transform = 'scale(0.9)';
            
            // 然后添加增强的水平和垂直抖动效果
            // 
            
            // setTimeout(() => {
            //     // 第二次抖动 - 更大幅度
            //     if (this.draggedTileElement) {
            //         this.draggedTileElement.style.transform = 'scale(0.9) translate(-10px, 0)';
            //     }
            // }, 75);
            
            // setTimeout(() => {
            //     // 第三次抖动 - 更大垂直幅度
            //     if (this.draggedTileElement) {
            //         this.draggedTileElement.style.transform = 'scale(0.9) translate(0, -8px)';
            //     }
            // }, 100);
            
            // setTimeout(() => {
            //     // 第四次抖动 - 更大垂直幅度
            //     if (this.draggedTileElement) {
            //         this.draggedTileElement.style.transform = 'scale(0.9) translate(0, 8px)';
            //     }
            // }, 125);
            
            // setTimeout(() => {
            //     // 第五次抖动 - 综合方向
            //     if (this.draggedTileElement) {
            //         this.draggedTileElement.style.transform = 'scale(0.9) translate(7px, -7px)';
            //     }
            // }, 150);
            
            // setTimeout(() => {
            //     // 第六次抖动 - 相反综合方向
            //     if (this.draggedTileElement) {
            //         this.draggedTileElement.style.transform = 'scale(0.9) translate(-7px, 7px)';
            //     }
            // }, 175);
            
            setTimeout(() => {
                // 返回到原始位置并恢复原始大小，添加一个轻微的回弹效果
                if (this.draggedTileElement) {
                    this.draggedTileElement.style.transition = 'all 200ms cubic-bezier(0.1, 0.8, 0.2, 1.2)';
                    this.draggedTileElement.style.left = (targetRect.left + targetRect.width / 2 - this.draggedTileElement.offsetWidth / 2) + 'px';
                    this.draggedTileElement.style.top = (targetRect.top + targetRect.height / 2 - this.draggedTileElement.offsetHeight / 2) + 'px';
                    this.draggedTileElement.style.transform = 'scale(1.05)';
                    
                    // 轻微的缩放回弹
                    setTimeout(() => {
                        if (this.draggedTileElement) {
                            this.draggedTileElement.style.transition = 'transform 100ms ease-out';
                            this.draggedTileElement.style.transform = 'scale(1)';
                            
                            // 动画结束后移除元素并清除所有样式
                            setTimeout(() => {
                                if (this.draggedTileElement && this.draggedTileElement.parentNode) {
                                    this.draggedTileElement.parentNode.removeChild(this.draggedTileElement);
                                }
                                this.draggedTileElement = null;
                                
                                // 确保所有方块恢复到默认状态
                                this.clearAllTileAnimations();
                            }, 100);
                        }
                    }, 200);
                }
            }, 200);
        } else {
            // 如果没有拖拽元素，直接清除所有动画
            this.clearAllTileAnimations();
        }
    }
    
    // 执行拖拽合并
    performDragMerge(sourceTile, targetTile) {
        // 调用相应的移动方法来触发合并
        const rowDiff = targetTile.row - sourceTile.row;
        const colDiff = targetTile.col - sourceTile.col;
        
        let moved = false;
        
        // 根据方向调用相应的移动方法
        if (rowDiff === 1) {
            // 向下移动
            moved = this.game.moveDown(sourceTile);
        } else if (rowDiff === -1) {
            // 向上移动
            moved = this.game.moveUp(sourceTile);
        } else if (colDiff === 1) {
            // 向右移动
            moved = this.game.moveRight(sourceTile);
        } else if (colDiff === -1) {
            // 向左移动
            moved = this.game.moveLeft(sourceTile);
        }
        
        // 如果有移动，渲染棋盘
        if (moved) {
            this.renderBoard();
        }
    }
    
    // 处理滑动（修复版 - 确保动画显示）
    handleSwipe() {
        const dx = this.touchEndX - this.touchStartX;
        const dy = this.touchEndY - this.touchStartY;
        
        // 获取当前触摸的数字方块
        const touchedTile = this.getTileAtTouchPosition(this.touchStartX, this.touchStartY);
        
        // 判断滑动方向（以绝对值较大的方向为准）
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 50) {
                // 向右滑动
                this.game.moveRight(touchedTile);
            } else if (dx < -50) {
                // 向左滑动
                this.game.moveLeft(touchedTile);
            }
        } else {
            // 垂直滑动
            if (dy > 50) {
                // 向下滑动
                this.game.moveDown(touchedTile);
            } else if (dy < -50) {
                // 向上滑动
                this.game.moveUp(touchedTile);
            }
        }
        
        // 无论是否moved，都立即渲染棋盘以确保动画显示
        if (this.game.moved) {
            this.renderBoard();
        }
    }
    
    // 渲染游戏棋盘（优化版 - 避免闪烁）
    renderBoard() {
        const gameState = this.game.getGameState();
        const cells = this.gameBoard.children;
        
        // 先保存当前棋盘状态
        const currentTiles = {};
        for (let i = 0; i < cells.length; i++) {
            const tile = cells[i].querySelector('div');
            if (tile) {
                currentTiles[i] = tile;
            }
        }
        
        // 保存需要创建动画的方块位置
        const animatedSpawnCells = new Set();
        const animatedMergeCells = new Set();
        
        // 检查是否有动画队列，只提取需要生成和合并动画的单元格
        if (gameState.animationQueue && gameState.animationQueue.length > 0) {
            gameState.animationQueue.forEach(anim => {
                if (anim.type === 'spawn' || anim.type === 'drop') {
                    // 只记录新生成方块的动画
                    const toIndex = anim.toRow * gameState.cols + anim.toCol;
                    animatedSpawnCells.add(toIndex);
                } else if (anim.type === 'merge') {
                    // 只记录合并后的目标方块动画
                    const toIndex = anim.toRow * gameState.cols + anim.toCol;
                    animatedMergeCells.add(toIndex);
                }
                // 不再记录移动相关的单元格动画，以避免整列闪烁
            });
        }
        
        // 更新或创建方块，避免完全清除和重建
        for (let i = 0; i < gameState.rows; i++) {
            for (let j = 0; j < gameState.cols; j++) {
                const cellIndex = i * gameState.cols + j;
                const cell = cells[cellIndex];
                const value = gameState.board[i][j];
                
                // 检查是否已有方块
                let tile = currentTiles[cellIndex];
                
                if (tile) {
                    // 更新现有方块
                    // 完全禁用过渡效果，避免任何闪烁
                    tile.style.transition = 'none';
                    
                    tile.textContent = value;
                    this.setTileColor(tile, value);
                    
                    // 更新文字颜色
                    if (value <= 4) {
                        tile.classList.add('text-gray-700');
                        tile.classList.remove('text-white');
                    } else {
                        tile.classList.add('text-white');
                        tile.classList.remove('text-gray-700');
                    }
                    
                    // 更新文字大小
                    let fontSize = 'text-xl';
                    if (value >= 1024) {
                        fontSize = 'text-sm';
                    } else if (value >= 128) {
                        fontSize = 'text-base';
                    }
                    // 移除所有字体大小类
                    tile.classList.remove('text-sm', 'text-base', 'text-xl');
                    tile.classList.add(fontSize, 'font-bold');
                    
                    // 从currentTiles中移除，表示已处理
                    delete currentTiles[cellIndex];
                } else if (value !== 0) {
                    // 创建新方块
                    tile = document.createElement('div');
                    
                    // 设置基础样式
                    tile.className = `absolute inset-0 flex items-center justify-center rounded-lg`;
                    tile.textContent = value;
                    
                    // 完全禁用过渡效果
                    tile.style.transition = 'none';
                    tile.style.transform = 'scale(1)';
                    tile.style.opacity = '1';
                    
                    // 设置方块属性
                    this.setTileColor(tile, value);
                    
                    if (value <= 4) {
                        tile.classList.add('text-gray-700');
                    } else {
                        tile.classList.add('text-white');
                    }
                    
                    let fontSize = 'text-xl';
                    if (value >= 1024) {
                        fontSize = 'text-sm';
                    } else if (value >= 128) {
                        fontSize = 'text-base';
                    }
                    tile.classList.add(fontSize, 'font-bold');
                    
                    // 添加到格子
                    cell.appendChild(tile);
                }
            }
        }
        
        // 直接移除所有未使用的方块，不添加任何动画
        Object.values(currentTiles).forEach(tile => {
            if (tile.parentNode) {
                tile.parentNode.removeChild(tile);
            }
        });
        
        // 如果有动画队列，只执行生成和合并动画，不执行移动动画
        if (gameState.animationQueue && gameState.animationQueue.length > 0) {
            // 过滤掉移动动画，只保留生成和合并动画
            const filteredAnimations = gameState.animationQueue.filter(anim => 
                anim.type === 'spawn' || anim.type === 'drop' || anim.type === 'merge'
            );
            
            if (filteredAnimations.length > 0) {
                this.executeAnimations(filteredAnimations);
            }
        }
        
        // 更新分数显示
        this.updateScoreDisplay();
        
        // 检查游戏是否结束
        if (gameState.isGameOver) {
            this.showGameOver();
        }
        
        // 检查是否获胜
        if (gameState.isWon) {
            // 可以添加获胜提示
            this.game.isWon = false; // 重置获胜状态，避免重复提示
        }
    }
    
    // 设置方块颜色（更鲜明的配色方案）
    setTileColor(tile, value) {
        // 移除所有可能的颜色类
        tile.className = tile.className.replace(/bg-tile-\d+/g, '');
        
        // 根据值设置更鲜艳的颜色
        const colors = {
            2: 'bg-green-400',
            4: 'bg-blue-400',
            8: 'bg-purple-400',
            16: 'bg-pink-400',
            32: 'bg-red-400',
            64: 'bg-orange-400',
            128: 'bg-yellow-400',
            256: 'bg-green-500',
            512: 'bg-blue-500',
            1024: 'bg-purple-500',
            2048: 'bg-pink-500'
        };
        
        // 添加选中的颜色类
        if (value === 0) {
            tile.classList.add('bg-gray-100');
        } else if (colors[value]) {
            tile.classList.add(colors[value]);
        } else {
            // 大于2048的数字使用特殊颜色
            tile.classList.add('bg-gradient-to-br', 'from-red-500', 'to-orange-500');
        }
    }
    
    // 执行动画（优化版 - 不延迟，确保动画显示）
    executeAnimations(animationQueue) {
        // 立即执行动画，不添加延迟
        animationQueue.forEach(anim => {
            if (anim.type === 'move') {
                this.animateMove(anim);
            } else if (anim.type === 'merge') {
                this.animateMerge(anim);
            } else if (anim.type === 'spawn') {
                this.animateSpawn(anim);
            } else if (anim.type === 'drop') {
                this.animateDrop(anim);
            }
        });
    }
    
    // 下落动画 - 完全移除所有缩放效果
    animateDrop(anim) {
        const cells = this.gameBoard.children;
        const toIndex = anim.toRow * this.game.cols + anim.toCol;
        
        if (cells[toIndex]) {
            const toCell = cells[toIndex];
            
            // 获取目标格子
            const tile = toCell.querySelector('div');
            if (tile) {
                // 创建一个临时方块用于动画
                const tempTile = tile.cloneNode(true);
                tempTile.style.position = 'absolute';
                tempTile.style.zIndex = '10';
                tempTile.style.width = toCell.offsetWidth + 'px';
                tempTile.style.height = toCell.offsetHeight + 'px';
                tempTile.style.opacity = '1';
                // 明确禁用transform属性，确保没有任何缩放效果
                tempTile.style.transform = 'none';
                tempTile.style.transformProperty = 'none';
                
                let startTop;
                
                if (anim.isNew) {
                    // 新生成的数字从顶部外部下落
                    startTop = -toCell.offsetHeight;
                    tempTile.style.left = toCell.offsetLeft + 'px';
                    tempTile.style.top = startTop + 'px';
                    
                    // 添加到父容器
                    this.gameBoard.parentNode.appendChild(tempTile);
                    
                    // 暂时隐藏原方块，不使用过渡效果
                    tile.style.transition = 'none';
                    tile.style.opacity = '0';
                    tile.style.transform = 'none';
                } else if (anim.isExisting) {
                    // 现有数字在列内下落
                    const fromIndex = anim.fromRow * this.game.cols + anim.fromCol;
                    if (cells[fromIndex]) {
                        const fromCell = cells[fromIndex];
                        tempTile.style.left = fromCell.offsetLeft + 'px';
                        tempTile.style.top = fromCell.offsetTop + 'px';
                        
                        // 添加到父容器
                        this.gameBoard.parentNode.appendChild(tempTile);
                        
                        // 暂时隐藏原方块，不使用过渡效果
                        tile.style.transition = 'none';
                        tile.style.opacity = '0';
                        tile.style.transform = 'none';
                        const fromTile = fromCell.querySelector('div');
                        if (fromTile) {
                            fromTile.style.transition = 'none';
                            fromTile.style.opacity = '0';
                            fromTile.style.transform = 'none';
                        }
                    }
                }
                
                // 动画下落
                setTimeout(() => {
                    // 只对需要变化的属性设置过渡，严格限定为top和left
                    tempTile.style.transition = 'top 300ms cubic-bezier(0.1, 0.8, 0.2, 1), left 300ms cubic-bezier(0.1, 0.8, 0.2, 1)';
                    tempTile.style.transitionProperty = 'top, left';
                    tempTile.style.top = toCell.offsetTop + 'px';
                    tempTile.style.left = toCell.offsetLeft + 'px';
                    
                    // 动画结束后移除临时方块，显示原方块
                    setTimeout(() => {
                        // 严格禁用过渡效果恢复原方块
                        tile.style.transition = 'none';
                        tile.style.transitionProperty = 'none';
                        tile.style.opacity = '1';
                        tile.style.transform = 'none';
                        
                        // 如果是现有数字下落，恢复原位置的透明度
                        if (anim.isExisting) {
                            const fromIndex = anim.fromRow * this.game.cols + anim.fromCol;
                            if (cells[fromIndex]) {
                                const fromTile = cells[fromIndex].querySelector('div');
                                if (fromTile) {
                                    fromTile.style.transition = 'none';
                                    fromTile.style.transitionProperty = 'none';
                                    fromTile.style.opacity = '1';
                                    fromTile.style.transform = 'none';
                                }
                            }
                        }
                        
                        // 移除临时方块
                        if (tempTile.parentNode) {
                            this.gameBoard.parentNode.removeChild(tempTile);
                        }
                    }, 300);
                }, 10);
            }
        }
    }
    
    // 移动动画 - 移除缩放效果
    animateMove(anim) {
        const cells = this.gameBoard.children;
        const fromIndex = anim.fromRow * this.game.cols + anim.fromCol;
        const toIndex = anim.toRow * this.game.cols + anim.toCol;
        
        if (cells[fromIndex] && cells[toIndex]) {
            const fromCell = cells[fromIndex];
            const toCell = cells[toIndex];
            
            // 获取移动的方块
            const tile = fromCell.querySelector('div');
            if (tile) {
                // 创建一个临时方块用于动画
                const tempTile = tile.cloneNode(true);
                tempTile.style.position = 'absolute';
                tempTile.style.zIndex = '10';
                tempTile.style.width = fromCell.offsetWidth + 'px';
                tempTile.style.height = fromCell.offsetHeight + 'px';
                tempTile.style.left = fromCell.offsetLeft + 'px';
                tempTile.style.top = fromCell.offsetTop + 'px';
                // 移除transform属性，避免任何缩放效果
                tempTile.style.transform = 'none';
                
                // 添加到父容器
                this.gameBoard.parentNode.appendChild(tempTile);
                
                // 动画移动
                setTimeout(() => {
                    // 只对需要变化的属性设置过渡，避免'all'导致的副作用
                    tempTile.style.transition = 'left 200ms ease-out, top 200ms ease-out';
                    tempTile.style.left = toCell.offsetLeft + 'px';
                    tempTile.style.top = toCell.offsetTop + 'px';
                    
                    // 动画结束后移除临时方块
                    setTimeout(() => {
                        this.gameBoard.parentNode.removeChild(tempTile);
                    }, 200);
                }, 10);
            }
        }
    }
    
    // 合并动画
    animateMerge(anim) {
        const cells = this.gameBoard.children;
        const fromIndex = anim.fromRow * this.game.cols + anim.fromCol;
        const toIndex = anim.toRow * this.game.cols + anim.toCol;
        
        if (cells[toIndex]) {
            const toCell = cells[toIndex];
            
            // 获取目标方块
            const tile = toCell.querySelector('div');
            if (tile) {
                // 添加合并动画效果
                tile.style.transition = 'all 200ms ease-out';
                tile.style.transform = 'scale(1.2)';
                
                // 添加闪烁效果
                tile.classList.add('animate-pulse');
                
                // 动画结束后恢复
                setTimeout(() => {
                    tile.style.transform = 'scale(1)';
                    tile.classList.remove('animate-pulse');
                }, 200);
            }
        }
    }
    
    // 生成动画
    animateSpawn(anim) {
        const cells = this.gameBoard.children;
        const cellIndex = anim.row * this.game.cols + anim.col;
        
        if (cells[cellIndex]) {
            const cell = cells[cellIndex];
            
            // 获取生成的方块
            const tile = cell.querySelector('div');
            if (tile) {
                // 添加生成动画效果
                tile.style.transform = 'scale(0.5)';
                tile.style.opacity = '0';
                
                // 动画出现
                setTimeout(() => {
                    tile.style.transition = 'all 200ms ease-out';
                    tile.style.transform = 'scale(1)';
                    tile.style.opacity = '1';
                }, 10);
            }
        }
    }
    
    // 更新分数显示
    updateScoreDisplay() {
        const gameState = this.game.getGameState();
        
        // 添加分数动画
        this.scoreElement.textContent = gameState.score;
        this.bestScoreElement.textContent = gameState.bestScore;
        
        // 添加分数变化动画
        this.scoreElement.classList.add('scale-125');
        setTimeout(() => {
            this.scoreElement.classList.remove('scale-125');
        }, 200);
    }
    
    // 显示游戏结束或获胜
    showGameOver() {
        const gameState = this.game.getGameState();
        const titleElement = this.gameOverElement.querySelector('h2');
        const messageElement = this.gameOverElement.querySelector('p');
        
        // 根据游戏状态显示不同的消息
        if (gameState.isWon) {
            titleElement.textContent = '恭喜获胜！';
            messageElement.textContent = '太棒了！你成功合成了2048！你真是个游戏天才！下载App解锁更多玩法和关卡！';
        } else {
            titleElement.textContent = '游戏结束！';
            messageElement.textContent = '挑战失败了？下载完整游戏体验更多精彩内容！';
        }
        
        this.gameOverElement.classList.remove('opacity-0', 'pointer-events-none');
    }
    
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const gameUI = new GameUI();
});