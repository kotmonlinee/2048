// 游戏核心逻辑
export class Game2048 {
    constructor() {
        this.rows = 7; // 行数（高度7行）
        this.cols = 5; // 列数（宽度5列）
        this.board = []; // 棋盘数据
        this.score = 0; // 当前分数
        this.bestScore = 0; // 最高分（不使用本地存储，每次打开都是全新开始）
        this.isGameOver = false; // 游戏是否结束
        this.isWon = false; // 是否获胜
        this.won = false; // 是否已获胜
        this.moved = false; // 是否有移动
        this.animationQueue = []; // 动画队列
        this.possibleValues = [2, 4, 8, 16, 32];
        
        // 限时挑战模式变量
        this.timeLimit = 30; // 30秒限时挑战
        this.remainingTime = this.timeLimit; // 剩余时间
        this.remainingMilliseconds = 0; // 剩余毫秒数
        this.timerInterval = null; // 计时器间隔
        this.onTimeUpdate = null; // 时间更新回调
        this.onGameComplete = null; // 游戏完成回调（成功/失败）
        
        // 初始化棋盘（所有方格都已填充数字）
        this.initBoard();
        // 更新分数显示
        this.updateScoreDisplay();
    }
    
    // 初始化棋盘
    initBoard() {
        this.board = [];
        // 初始化时所有方格都显示数字，而不是0
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                // 随机生成2, 4, 8, 16, 32中的一个，但确保相邻的数字不会相同（避免初始就有可合并的方块）
                let value = this.possibleValues[Math.floor(Math.random() * this.possibleValues.length)];
                if (value === 0) {
                    this.board[i][j] = 2;
                }
                this.board[i][j] = value;
            }
        }
        this.score = 0;
        this.isGameOver = false;
        this.isWon = false;
        this.won = false;
        this.animationQueue = [];
        this.remainingTime = this.timeLimit;
    }
    
    // 生成随机方块
    generateTile() {
        // 找到所有空位置
        const emptyCells = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }
        
        // 如果没有空位置，返回
        if (emptyCells.length === 0) {
            return;
        }
        
        // 随机选择一个空位置
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = this.possibleValues[Math.floor(Math.random() * this.possibleValues.length)];
        this.board[randomCell.row][randomCell.col] = value === 0 ? 2 : value;
        // 添加生成动画
        this.animationQueue.push({
            type: 'spawn',
            row: randomCell.row,
            col: randomCell.col,
            value: this.board[randomCell.row][randomCell.col]
        });
        
        // 检查游戏是否结束
        this.checkGameOver();
    }
    
    // 整列下落填补空白 - 支持从合并位置开始下滑的逻辑
    fillFromTop(touchedTile) {
        const emptyRow = touchedTile.row;
        const emptyCol = touchedTile.col;
                
        // 检查是否是最上面的格子被合并
        if (emptyRow === 0) {
            // 最上面格子被合并，原地生成新数字
            const weights = [0.5, 0.3, 0.1, 0.05, 0.05]; // 2出现概率最高，32出现概率最低
            let value;
            
            // 使用加权随机选择
            const random = Math.random();
            let cumulativeWeight = 0;
            for (let j = 0; j < this.possibleValues.length; j++) {
                cumulativeWeight += weights[j];
                if (random < cumulativeWeight) {
                    value = this.possibleValues[j];
                    break;
                }
            }
            
            // 在合并位置的上方生成新数字（这里就是最顶部）
            this.board[0][emptyCol] = value;
            
            // 添加原地生成的动画（带有缩放效果）
            this.animationQueue.push({
                type: 'spawn',
                row: 0,
                col: emptyCol,
                value: value
            });
        } else {
            // 从被合并方格的上一格开始，整列往下下滑
            // 收集从被合并方格的上一格开始的所有非空值
            const valuesToDrop = [];
            for (let i = 0; i < emptyRow; i++) {
                if (this.board[i][emptyCol] !== 0) {
                    valuesToDrop.push(this.board[i][emptyCol]);
                    this.board[i][emptyCol] = 0; // 临时清空原位置
                }
            }
            
            // 记录下落动画
            for (let i = 0; i < valuesToDrop.length; i++) {
                const fromRow = i;
                const toRow = i + 1; // 向下移动一格
                this.board[toRow][emptyCol] = valuesToDrop[i];
                
                // 添加下落动画
                this.animationQueue.push({
                    type: 'drop',
                    fromRow: fromRow,
                    fromCol: emptyCol,
                    toRow: toRow,
                    toCol: emptyCol,
                    value: valuesToDrop[i],
                    isExisting: true
                });
            }
            // 在最顶部生成一个新数字
            const weights = [0.5, 0.3, 0.1, 0.05, 0.05]; // 2出现概率最高，32出现概率最低
            let value;
            
            // 使用加权随机选择
            const random = Math.random();
            let cumulativeWeight = 0;
            for (let j = 0; j < this.possibleValues.length; j++) {
                cumulativeWeight += weights[j];
                if (random < cumulativeWeight) {
                    value = this.possibleValues[j];
                    break;
                }
            }
            
            // 将新数字放在最顶部
            this.board[0][emptyCol] = value;
            
            // 添加从顶部外部下落的动画
            this.animationQueue.push({
                type: 'drop',
                fromRow: -1, // 表示从顶部外部开始
                fromCol: emptyCol,
                toRow: 0,
                toCol: emptyCol,
                value: value,
                isNew: true
            });
        }
    }

    // 设置分数
    setScore(score) {
        if (score > this.score) {
            this.score = score;
        }
        if (score === 2048) {
            this.won = true;
            this.isWon = true;
            this.stopTimer();
            if (this.onGameComplete) {
                this.onGameComplete(true); // 挑战成功
            }
        }
    }
    
    // 开始计时器
    startTimer() {
        this.remainingTime = this.timeLimit;
        this.remainingMilliseconds = 0; // 新增毫秒级计时器变量
        this.stopTimer(); // 确保之前的计时器已停止
        
        // 立即更新一次时间
        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.remainingTime, this.remainingMilliseconds);
        }
        
        // 设置新的计时器 - 改为每10毫秒更新一次以支持毫秒显示
        this.timerInterval = setInterval(() => {
            this.remainingMilliseconds -= 10;
            
            // 毫秒数小于0时，减少一秒并重置毫秒数
            if (this.remainingMilliseconds < 0) {
                this.remainingTime--;
                this.remainingMilliseconds = 990; // 接近1000毫秒但避免整数问题
            }
            
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.remainingTime, this.remainingMilliseconds);
            }
            
            // 时间用完，挑战失败
            if (this.remainingTime <= 0 && this.remainingMilliseconds <= 0) {
                this.stopTimer();
                this.isGameOver = true;
                if (this.onGameComplete) {
                    this.onGameComplete(false); // 挑战失败
                }
            }
        }, 10);
    }
    
    // 停止计时器
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // 重置游戏（用于重新开始挑战）
    resetGame() {
        this.stopTimer();
        this.initBoard();
        this.updateScoreDisplay();
    }
    
    // 设置时间更新回调
    setTimeUpdateCallback(callback) {
        this.onTimeUpdate = callback;
    }
    
    // 设置游戏完成回调
    setGameCompleteCallback(callback) {
        this.onGameComplete = callback;
    }
    // 向左移动
    moveLeft(touchedTile) {
        this.moved = false;
        this.animationQueue = [];
       let i = touchedTile.row ;
       let j = touchedTile.col;
        let hasMerged = false; // 该行是否有合并
        let mergedValue = 0;
        if (((j - 1) >= 0) && this.board[i][j - 1] === this.board[i][j]) {
            // 确保合并后的数字不超过2048
            mergedValue = Math.min(this.board[i][j] * 2, 2048);
            this.board[i][j - 1] = mergedValue;
            this.board[i][j] = null;
            this.setScore(mergedValue);
            //mergedRow[j] = null; // 使用null标记需要被填补的位置
            hasMerged = true;
            this.moved = true;

            // 添加合并动画
            this.animationQueue.push({
                type: 'merge',
                fromRow: i,
                fromCol: j,
                toRow: i,
                toCol: j - 1,
                value: mergedValue
            });
            
            // 检查是否达到目标值（现在是2048）
            if (mergedValue === 2048 && !this.won) {
                this.won = true;
                this.isWon = true;
            }
        }
        
        // 处理移动和填补逻辑
        if (hasMerged) {
            this.animationQueue.push({
                            type: 'move',
                            fromRow: i,
                            fromCol: j,
                            toRow: i,
                            toCol: j - 1,
                            value: mergedValue
                        });
        }
        
        // 处理从顶部下落的新数字
        if ( hasMerged) {
            this.fillFromTop(touchedTile);
        }
        
        // 更新分数显示
        if (this.moved) {
            this.updateScoreDisplay();
        }
        
        return this.moved;
    }
   moveRight(touchedTile) {
        this.moved = false;
        this.animationQueue = [];
        let i = touchedTile.row ;
        let j = touchedTile.col;
        let hasMerged = false; // 该行是否有合并
        let mergedValue = 0;
        // 检查右侧是否有相同数字且不越界
        if (((j + 1) < this.cols) && this.board[i][j + 1] === this.board[i][j]) {
            // 确保合并后的数字不超过2048
            mergedValue = Math.min(this.board[i][j] * 2, 2048);
            this.board[i][j + 1] = mergedValue;
            this.board[i][j] = null;
            this.setScore(mergedValue);
            //mergedRow[j] = null; // 使用null标记需要被填补的位置
            hasMerged = true;
            this.moved = true;

            // 添加合并动画
            this.animationQueue.push({
                type: 'merge',
                fromRow: i,
                fromCol: j,
                toRow: i,
                toCol: j + 1,
                value: mergedValue
            });
            
            // 检查是否达到目标值（现在是2048）
            if (mergedValue === 2048 && !this.won) {
                this.won = true;
                this.isWon = true;
            }
        }
        
        // 处理移动和填补逻辑
        if (hasMerged) {
            this.animationQueue.push({
                            type: 'move',
                            fromRow: i,
                            fromCol: j,
                            toRow: i,
                            toCol: j + 1,
                            value: mergedValue
                        });
        }
        
        // 处理从顶部下落的新数字
        if ( hasMerged) {
            this.fillFromTop(touchedTile);
        }
        
        // 更新分数显示
        if (this.moved) {
            this.updateScoreDisplay();
        }
        
        return this.moved;
    }

    moveUp(touchedTile) {
        this.moved = false;
        this.animationQueue = [];
        let i = touchedTile.row ;
        let j = touchedTile.col;
        let hasMerged = false; // 该行是否有合并
        let mergedValue = 0;
        // 检查右侧是否有相同数字且不越界
        if (((i - 1) >= 0) && this.board[i - 1][j] === this.board[i][j]) {
            // 确保合并后的数字不超过2048
            mergedValue = Math.min(this.board[i][j] * 2, 2048);
            this.board[i - 1][j] = mergedValue;
            this.board[i][j] = null;
            this.setScore(mergedValue);
            //mergedRow[j] = null; // 使用null标记需要被填补的位置
            hasMerged = true;
            this.moved = true;

            // 添加合并动画
            this.animationQueue.push({
                type: 'merge',
                fromRow: i,
                fromCol: j,
                toRow: i - 1,
                toCol: j,
                value: mergedValue
            });
            
            // 检查是否达到目标值（现在是2048）
            if (mergedValue === 2048 && !this.won) {
                this.won = true;
                this.isWon = true;
            }
        }
        
        // 处理移动和填补逻辑
        if (hasMerged) {
            this.animationQueue.push({
                            type: 'move',
                            fromRow: i,
                            fromCol: j,
                            toRow: i - 1,
                            toCol: j,
                            value: mergedValue
                        });
        }
        
        // 处理从顶部下落的新数字
        if ( hasMerged) {
            this.fillFromTop(touchedTile);
        }
        
        // 更新分数显示
        if (this.moved) {
            this.updateScoreDisplay();
        }
        
        return this.moved;
    }

    moveDown(touchedTile) {
        this.moved = false;
        this.animationQueue = [];
        let i = touchedTile.row ;
        let j = touchedTile.col;
        let hasMerged = false; // 该行是否有合并
        let mergedValue = 0;
        // 检查右侧是否有相同数字且不越界
        if (((i + 1) < this.rows) && this.board[i + 1][j] === this.board[i][j]) {
            // 确保合并后的数字不超过2048
            mergedValue = Math.min(this.board[i][j] * 2, 2048);
            this.board[i + 1][j] = mergedValue;
            this.board[i][j] = null;
            this.setScore(mergedValue);
            //mergedRow[j] = null; // 使用null标记需要被填补的位置
            hasMerged = true;
            this.moved = true;

            // 添加合并动画
            this.animationQueue.push({
                type: 'merge',
                fromRow: i,
                fromCol: j,
                toRow: i + 1,
                toCol: j,
                value: mergedValue
            });
            
            // 检查是否达到目标值（现在是2048）
            if (mergedValue === 2048 && !this.won) {
                this.won = true;
                this.isWon = true;
            }
        }
        
        // 处理移动和填补逻辑
        if (hasMerged) {
            this.animationQueue.push({
                            type: 'move',
                            fromRow: i,
                            fromCol: j,
                            toRow: i + 1,
                            toCol: j,
                            value: mergedValue
                        });
        }
        
        // 处理从顶部下落的新数字
        if ( hasMerged) {
            this.fillFromTop(touchedTile);
        }
        
        // 更新分数显示
        if (this.moved) {
            this.updateScoreDisplay();
        }
        
        return this.moved;
    }
    
    // 查找原始位置
    findOriginalPosition(originalRow, valueIndex) {
        let count = 0;
        for (let j = 0; j < originalRow.length; j++) {
            if (originalRow[j] !== 0) {
                if (count === valueIndex) {
                    return j;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 查找值在新行中的位置
    findValuePosition(newRow, value, originalCol) {
        let count = 0;
        for (let j = 0; j < newRow.length; j++) {
            if (newRow[j] === value) {
                if (count === this.getOccurrenceCount(this.board[0], value, originalCol)) {
                    return j;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 获取值在原始行中的出现次数
    getOccurrenceCount(row, value, maxCol) {
        let count = 0;
        for (let j = 0; j <= maxCol; j++) {
            if (row[j] === value) {
                count++;
            }
        }
        return count;
    }
    
    // // 向右移动
    // moveRight() {
    //     this.moved = false;
    //     this.animationQueue = [];
        
    //     // 记录需要从顶部下落的新数字
    //     const newNumbers = [];
        
    //     for (let i = 0; i < this.rows; i++) {
    //         let row = [...this.board[i]]; // 复制当前行
    //         let mergedRow = [...row]; // 用于合并后的行
    //         let merged = new Array(this.cols).fill(false); // 记录是否已合并
    //         let hasMerged = false; // 该行是否有合并
    //         let mergePositions = []; // 记录合并的位置
            
    //         // 合并相同数字（从右到左）
    //         for (let j = this.cols - 1; j > 0; j--) {
    //             if (!merged[j] && mergedRow[j] === mergedRow[j - 1]) {
    //                 // 确保合并后的数字不超过2048
    //                 const mergedValue = Math.min(mergedRow[j] * 2, 2048);
    //                 mergedRow[j] = mergedValue;
    //                 this.score += mergedValue;
    //                 mergedRow[j - 1] = null; // 使用null标记需要被填补的位置
    //                 merged[j] = true;
    //                 hasMerged = true;
    //                 this.moved = true;
                    
    //                 // 记录合并位置
    //                 mergePositions.push({mergeRow: i, mergeCol: j, emptyRow: i, emptyCol: j - 1});
                    
    //                 // 添加合并动画
    //                 this.animationQueue.push({
    //                     type: 'merge',
    //                     fromRow: i,
    //                     fromCol: j - 1,
    //                     toRow: i,
    //                     toCol: j,
    //                     value: mergedValue
    //                 });
                    
    //                 // 检查是否达到目标值（现在是2048）
    //                 if (mergedValue === 2048 && !this.won) {
    //                     this.won = true;
    //                     this.isWon = true;
    //                 }
    //             }
    //         }
            
    //         // 处理移动和填补逻辑
    //         if (hasMerged) {
    //             // 收集需要从顶部下落的新数字位置，并记录合并信息
    //             mergePositions.forEach(pos => {
    //                 newNumbers.push({
    //                     row: pos.emptyRow,
    //                     col: pos.emptyCol,
    //                     isMergedPosition: true,
    //                     mergedRow: 0, // 对于左右移动，我们也从顶部开始下滑
    //                     originalRow: pos.emptyRow
    //                 });
    //             });
                
    //             // 移动方块到右侧
    //             let newRow = new Array(this.cols).fill(null);
    //             let newRowIndex = this.cols - 1;
    //             for (let j = this.cols - 1; j >= 0; j--) {
    //                 if (mergedRow[j] !== null) {
    //                     newRow[newRowIndex] = mergedRow[j];
    //                     newRowIndex--;
    //                 }
    //             }
                
    //             // 移除null值
    //             newRow = newRow.filter(cell => cell !== null);
                
    //             // 记录移动动画
    //             for (let j = 0; j < this.cols; j++) {
    //                 if (row[j] !== null && newRow.includes(row[j])) {
    //                     const newJ = newRow.indexOf(row[j]);
    //                     if (j !== newJ) {
    //                         this.animationQueue.push({
    //                             type: 'move',
    //                             fromRow: i,
    //                             fromCol: j,
    //                             toRow: i,
    //                             toCol: newJ,
    //                             value: row[j]
    //                         });
    //                     }
    //                 }
    //             }
                
    //             // 更新行
    //             this.board[i] = newRow;
    //         }
    //     }
        
    //     // 处理从顶部下落的新数字
    //     if (newNumbers.length > 0) {
    //         this.fillFromTop(newNumbers);
    //     }
        
    //     // 更新分数显示
    //     if (this.moved) {
    //         this.updateScoreDisplay();
    //     }
    // }
    
    // 从右侧查找原始位置
    findOriginalPositionRight(originalRow, valueIndex) {
        let count = 0;
        for (let j = originalRow.length - 1; j >= 0; j--) {
            if (originalRow[j] !== 0) {
                if (count === originalRow.filter(cell => cell !== 0).length - 1 - valueIndex) {
                    return j;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 从右侧查找值在新行中的位置
    findValuePositionRight(newRow, value, originalCol) {
        let count = 0;
        for (let j = newRow.length - 1; j >= 0; j--) {
            if (newRow[j] === value) {
                const occurrenceCount = this.getOccurrenceCountRight(this.board[0], value, originalCol);
                if (count === occurrenceCount) {
                    return j;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 从右侧获取值在原始行中的出现次数
    getOccurrenceCountRight(row, value, minCol) {
        let count = 0;
        for (let j = row.length - 1; j >= minCol; j--) {
            if (row[j] === value) {
                count++;
            }
        }
        return count - 1;
    }
    
    // 向上移动
    // moveUp() {
    //     this.moved = false;
    //     this.animationQueue = [];
        
    //     // 记录需要从顶部下落的新数字
    //     const newNumbers = [];
        
    //     for (let j = 0; j < this.cols; j++) {
    //         let col = [];
    //         // 获取当前列的复制
    //         for (let i = 0; i < this.rows; i++) {
    //             col.push(this.board[i][j]);
    //         }
            
    //         let mergedCol = [...col]; // 用于合并后的列
    //         let merged = new Array(this.rows).fill(false); // 记录是否已合并
    //         let hasMerged = false; // 该列是否有合并
    //         let mergePositions = []; // 记录合并的位置
            
    //         // 合并相同数字（从上到下）
    //         for (let i = 0; i < this.rows - 1; i++) {
    //             if (!merged[i] && mergedCol[i] === mergedCol[i + 1]) {
    //                 // 确保合并后的数字不超过2048
    //                 const mergedValue = Math.min(mergedCol[i] * 2, 2048);
    //                 mergedCol[i] = mergedValue;
    //                 this.score += mergedValue;
    //                 mergedCol[i + 1] = null; // 使用null标记需要被填补的位置
    //                 merged[i] = true;
    //                 hasMerged = true;
    //                 this.moved = true;
                    
    //                 // 记录合并位置
    //                 mergePositions.push({mergeRow: i, emptyRow: i + 1});
                    
    //                 // 添加合并动画
    //                 this.animationQueue.push({
    //                     type: 'merge',
    //                     fromRow: i + 1,
    //                     fromCol: j,
    //                     toRow: i,
    //                     toCol: j,
    //                     value: mergedValue
    //                 });
                    
    //                 // 检查是否达到目标值（现在是2048）
    //                 if (mergedValue === 2048 && !this.won) {
    //                     this.won = true;
    //                     this.isWon = true;
    //                 }
    //             }
    //         }
            
    //         // 处理移动和填补逻辑
    //         if (hasMerged) {
    //             // 收集需要从顶部下落的新数字位置，并记录合并信息
    //             mergePositions.forEach(pos => {
    //                 newNumbers.push({
    //                     row: pos.emptyRow,
    //                     col: j,
    //                     isMergedPosition: true,
    //                     mergedRow: pos.mergeRow,
    //                     originalRow: pos.emptyRow
    //                 });
    //             });
                
    //             // 移动方块到上方
    //             let newCol = [];
    //             for (let i = 0; i < this.rows; i++) {
    //                 if (mergedCol[i] !== null) {
    //                     newCol.push(mergedCol[i]);
    //                 }
    //             }
                
    //             // 记录移动动画
    //             for (let i = 0; i < this.rows; i++) {
    //                 if (col[i] !== null && newCol.includes(col[i])) {
    //                     const newI = newCol.indexOf(col[i]);
    //                     if (i !== newI) {
    //                         this.animationQueue.push({
    //                             type: 'move',
    //                             fromRow: i,
    //                             fromCol: j,
    //                             toRow: newI,
    //                             toCol: j,
    //                             value: col[i]
    //                         });
    //                     }
    //                 }
    //             }
                
    //             // 更新列
    //             for (let i = 0; i < this.rows; i++) {
    //                 this.board[i][j] = newCol[i] || 0;
    //             }
    //         }
    //     }
        
    //     // 处理从顶部下落的新数字
    //     if (newNumbers.length > 0) {
    //         this.fillFromTop(newNumbers);
    //     }
        
    //     // 更新分数显示
    //     if (this.moved) {
    //         this.updateScoreDisplay();
    //     }
    // }
    
    // 向上查找原始位置
    findOriginalPositionUp(originalCol, valueIndex) {
        let count = 0;
        for (let i = 0; i < originalCol.length; i++) {
            if (originalCol[i] !== 0) {
                if (count === valueIndex) {
                    return i;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 向上查找值在新列中的位置
    findValuePositionUp(newCol, value, originalRow) {
        let count = 0;
        for (let i = 0; i < newCol.length; i++) {
            if (newCol[i] === value) {
                const occurrenceCount = this.getOccurrenceCountUp(this.board, value, originalRow);
                if (count === occurrenceCount) {
                    return i;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 向上获取值在原始列中的出现次数
    getOccurrenceCountUp(board, value, maxRow) {
        let count = 0;
        for (let i = 0; i <= maxRow; i++) {
            if (board[i][0] === value) {
                count++;
            }
        }
        return count - 1;
    }
    
    // // 向下移动
    // moveDown() {
    //     this.moved = false;
    //     this.animationQueue = [];
        
    //     // 记录需要从顶部下落的新数字
    //     const newNumbers = [];
        
    //     for (let j = 0; j < this.cols; j++) {
    //         let col = [];
    //         // 获取当前列的复制
    //         for (let i = 0; i < this.rows; i++) {
    //             col.push(this.board[i][j]);
    //         }
            
    //         let mergedCol = [...col]; // 用于合并后的列
    //         let merged = new Array(this.rows).fill(false); // 记录是否已合并
    //         let hasMerged = false; // 该列是否有合并
    //         let mergePositions = []; // 记录合并的位置
            
    //         // 合并相同数字（从下到上）
    //         for (let i = this.rows - 1; i > 0; i--) {
    //             if (!merged[i] && mergedCol[i] === mergedCol[i - 1]) {
    //                 // 确保合并后的数字不超过2048
    //                 const mergedValue = Math.min(mergedCol[i] * 2, 2048);
    //                 mergedCol[i] = mergedValue;
    //                 this.score += mergedValue;
    //                 mergedCol[i - 1] = null; // 使用null标记需要被填补的位置
    //                 merged[i] = true;
    //                 hasMerged = true;
    //                 this.moved = true;
                    
    //                 // 记录合并位置
    //                 mergePositions.push({mergeRow: i, emptyRow: i - 1});
                    
    //                 // 添加合并动画
    //                 this.animationQueue.push({
    //                     type: 'merge',
    //                     fromRow: i - 1,
    //                     fromCol: j,
    //                     toRow: i,
    //                     toCol: j,
    //                     value: mergedValue
    //                 });
                    
    //                 // 检查是否达到目标值（现在是2048）
    //                 if (mergedValue === 2048 && !this.won) {
    //                     this.won = true;
    //                     this.isWon = true;
    //                 }
    //             }
    //         }
            
    //         // 处理移动和填补逻辑
    //         if (hasMerged) {
    //             // 收集需要从顶部下落的新数字位置，并记录合并信息
    //             mergePositions.forEach(pos => {
    //                 newNumbers.push({
    //                     row: pos.emptyRow,
    //                     col: j,
    //                     isMergedPosition: true,
    //                     mergedRow: pos.mergeRow,
    //                     originalRow: pos.emptyRow
    //                 });
    //             });
                
    //             // 移动方块到下方
    //             let newCol = new Array(this.rows).fill(null);
    //             let newColIndex = this.rows - 1;
    //             for (let i = this.rows - 1; i >= 0; i--) {
    //                 if (mergedCol[i] !== null) {
    //                     newCol[newColIndex] = mergedCol[i];
    //                     newColIndex--;
    //                 }
    //             }
                
    //             // 移除null值
    //             newCol = newCol.filter(cell => cell !== null);
                
    //             // 记录移动动画
    //             for (let i = 0; i < this.rows; i++) {
    //                 if (col[i] !== null && newCol.includes(col[i])) {
    //                     const newI = newCol.indexOf(col[i]);
    //                     if (i !== newI) {
    //                         this.animationQueue.push({
    //                             type: 'move',
    //                             fromRow: i,
    //                             fromCol: j,
    //                             toRow: newI,
    //                             toCol: j,
    //                             value: col[i]
    //                         });
    //                     }
    //                 }
    //             }
                
    //             // 更新列
    //             for (let i = 0; i < this.rows; i++) {
    //                 this.board[i][j] = newCol[i] || 0;
    //             }
    //         }
    //     }
        
    //     // 处理从顶部下落的新数字
    //     if (newNumbers.length > 0) {
    //         this.fillFromTop(newNumbers);
    //     }
        
    //     // 更新分数显示
    //     if (this.moved) {
    //         this.updateScoreDisplay();
    //     }
    // }
    
    // 向下查找原始位置
    findOriginalPositionDown(originalCol, valueIndex) {
        let count = 0;
        for (let i = originalCol.length - 1; i >= 0; i--) {
            if (originalCol[i] !== 0) {
                if (count === originalCol.filter(cell => cell !== 0).length - 1 - valueIndex) {
                    return i;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 向下查找值在新列中的位置
    findValuePositionDown(newCol, value, originalRow) {
        let count = 0;
        for (let i = newCol.length - 1; i >= 0; i--) {
            if (newCol[i] === value) {
                const occurrenceCount = this.getOccurrenceCountDown(this.board, value, originalRow);
                if (count === occurrenceCount) {
                    return i;
                }
                count++;
            }
        }
        return -1;
    }
    
    // 向下获取值在原始列中的出现次数
    getOccurrenceCountDown(board, value, minRow) {
        let count = 0;
        for (let i = board.length - 1; i >= minRow; i--) {
            if (board[i][0] === value) {
                count++;
            }
        }
        return count - 1;
    }
    
    // 检查游戏是否结束
    checkGameOver() {
        // 由于所有方格都显示数字，不需要检查空位置
        // 只需检查是否有可合并的方块
        
        // 检查是否有可合并的方块（水平方向）
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols - 1; j++) {
                if (this.board[i][j] === this.board[i][j + 1]) {
                    return false;
                }
            }
        }
        
        // 检查是否有可合并的方块（垂直方向）
        for (let j = 0; j < this.cols; j++) {
            for (let i = 0; i < this.rows - 1; i++) {
                if (this.board[i][j] === this.board[i + 1][j]) {
                    return false;
                }
            }
        }
        
        // 没有可合并的方块，游戏结束
        this.isGameOver = true;
        
        // 如果游戏不是因为时间到结束的，而是因为没有可合并方块结束的，触发游戏完成回调
        if (this.onGameComplete && this.remainingTime > 0) {
            this.stopTimer();
            this.onGameComplete(false, 'no_moves'); // 传递失败原因
        }
        
        return true;
    }
    
    // 更新分数显示
    updateScoreDisplay() {
        // 更新最高分
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
        }
        
        // 这里不直接操作DOM，由UI层处理
    }
    
    // 获取游戏状态
    getGameState() {
        return {
            board: this.board,
            score: this.score,
            bestScore: this.bestScore,
            isGameOver: this.isGameOver,
            isWon: this.isWon,
            rows: this.rows,
            cols: this.cols,
            animationQueue: this.animationQueue
        };
    }
}