// URL参数处理逻辑和Google Analytics事件上报

/**
 * 检测当前环境是否为正式环境
 * @returns {boolean} - 是否为正式环境
 */
function isProductionEnvironment() {
    // 在开发环境中，我们使用 localhost 或 127.0.0.1
    // 在正式环境中，URL 通常是生产域名
    const hostname = window.location.hostname;
    return !['localhost', '127.0.0.1'].includes(hostname) && 
           !hostname.startsWith('192.168.') && 
           !hostname.startsWith('10.');
}

/**
 * 上报Google Analytics事件（仅在正式环境生效）
 * @param {string} eventName - 事件名称
 * @param {Object} eventParams - 事件参数
 */
export function trackGAEvent(eventName, eventParams = {}) {
    // 检查是否为正式环境
    if (!isProductionEnvironment()) {
        return; // 在开发环境中完全不进行任何GA相关操作
    }
    
    try {
        // 仅在正式环境中检查gtag函数并上报事件
        if (window.gtag && typeof window.gtag === 'function') {
            window.gtag('event', eventName, eventParams);
        }
    } catch (error) {
        // 在开发环境中完全静默，正式环境中也不输出错误日志，避免暴露GA相关信息
    }
}

/**
 * 解析URL中的查询参数
 * @returns {Object} 包含所有查询参数的对象
 */
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // 遍历所有参数并添加到结果对象中
    for (const [key, value] of urlParams.entries()) {
        params[key] = value;
    }
    
    return params;
}

/**
 * 创建包含正确参数的下载链接
 * @param {Object} params - URL查询参数对象
 * @returns {string} 带有正确参数的下载链接
 */
function createDownloadLink(params) {
    // 基础URL
    const baseUrl = 'https://app.appsflyer.com/com.inspiredsquare.jupiter';
    
    // 创建URLSearchParams对象来构建查询字符串
    const downloadParams = new URLSearchParams();
    
    // 设置固定参数
    downloadParams.append('pid', 'taurus_int');
    downloadParams.append('af_siteid', params.af_siteid || '');
    downloadParams.append('c', params.c || '');
    downloadParams.append('af_channel', params.af_channel || '');
    downloadParams.append('af_c_id', params.af_c_id || '');
    downloadParams.append('af_adset', params.af_adset || '');
    downloadParams.append('af_adset_id', params.af_adset_id || '');
    downloadParams.append('af_ad', params.af_ad || '');
    downloadParams.append('af_ad_id', params.af_ad_id || '');
    downloadParams.append('af_cost_value', params.af_cost_value || '1.7');
    downloadParams.append('af_click_lookback', params.af_click_lookback || '7d');
    downloadParams.append('clickid', params.clickid || '');
    downloadParams.append('advertising_id', params.advertising_id || '');
    downloadParams.append('idfa', params.idfa || '');
    downloadParams.append('af_ip', params.af_ip || '');
    downloadParams.append('af_ua', params.af_ua || navigator.userAgent);
    downloadParams.append('af_lang', params.af_lang || navigator.language);
    downloadParams.append('af_prt', 'mocaglobal');
    
    // 构建完整的下载链接
    return `${baseUrl}?${downloadParams.toString()}`;
}

export function trackChallengeStarted() {

    // 获取URL参数
    const urlParams = getUrlParams();
    const clickId = urlParams.clickid;
    if (!clickId) return; // 确保click_id存在

    // 获取当前时间戳（精确到秒）
    const timestamp = Math.floor(Date.now() / 1000);

    // 构建打点URL
    const trackingUrl = `https://pb.taurusx.com/general/event?click_id=${clickId}&event_name=start_challenge&event_time=${timestamp}`;

    // 使用Image对象发送GET请求
    const img = new Image();
    img.src = trackingUrl;
      // 可选：添加请求状态监听
    img.onload = () => console.log('Tracking request sent successfully');
    img.onerror = () => console.error('Tracking request failed');
}

/**
 * 更新页面上的所有下载链接
 */
function updateDownloadLinks() {
    try {
        // 获取URL参数
        const urlParams = getUrlParams();
        
        // 创建新的下载链接
        const downloadLink = createDownloadLink(urlParams);
        
        // 更新游戏结束遮罩中的下载按钮
        const gameOverDownloadButton = document.getElementById('download-app');
        if (gameOverDownloadButton) {
            gameOverDownloadButton.href = downloadLink;
        }
        
        // 更新游戏下载区域中的下载按钮
        const downloadButton = document.getElementById('download-app-btn');
        if (downloadButton) {
            downloadButton.href = downloadLink;
        }

        console.log('Download links updated successfully with params:', urlParams);
    } catch (error) {
        console.error('Error updating download links:', error);
        // 即使出错也不要阻止用户使用游戏，继续使用默认链接
    }
}

// 当页面加载完成后更新下载链接
document.addEventListener('DOMContentLoaded', updateDownloadLinks);

export { updateDownloadLinks };