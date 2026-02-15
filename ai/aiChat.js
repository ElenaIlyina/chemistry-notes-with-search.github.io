/**
 * Функция для общения с GenAPI через Cloudflare Worker
 * @param {string} message - Ваше сообщение для нейросети
 * @param {string} modelId - ID модели (по умолчанию gemini-2-5-flash-lite)
 * @returns {Promise<string>} - Ответ нейросети
 */
async function AIFeedback(message, modelId = 'gemini-2-5-flash-lite') {
    try {
        // Добавляем сообщение пользователя в историю
        messages.push({ "role": "user", "content": message });
        
        // URL вашего Cloudflare Worker
        const WORKER_URL = 'https://lingering-tooth-e666.elena-ilyina.workers.dev/api/genapi';
        
        // Отправляем запрос к прокси
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                modelId: modelId,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Добавляем ответ в историю
        if (data.response) {
            messages.push({ "role": "assistant", "content": data.response });
        }
        
        return data.response;
        
    } catch (error) {
        console.error('Ошибка при работе с GenAPI:', error.message);
        throw error;
    }
}
