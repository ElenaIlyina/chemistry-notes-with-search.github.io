const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// URL вашего Cloudflare Worker прокси
const DEEPSEEK_PROXY_URL = 'https://ваш-воркер.workers.dev/api/deepseek';

let messages = [
  { role: 'system', content: 'Прими на себя роль эксперта в химии' }
];
let waitResponse = false;

/**
 * Форматирование текста (Markdown → HTML)
 */
function formater(text) {
  let strongClose = false;
  for (let i = 0; i < text.length - 1; ++i) {
    if (text[i] === '*') {
      if (text[i + 1] === '*') {
        // <strong></strong>
        text = text.slice(0, i) + (!strongClose ? '<strong>' : '</strong>') + text.slice(i + 2);
        strongClose = !strongClose;
      } else {
        text = text.slice(0, i) + '•' + text.slice(i + 1);
      }
    }
  }
  
  return text;
}

/**
 * Отправка запроса к DeepSeek через прокси
 * @param {string} message - Сообщение пользователя
 * @returns {Promise<string>} - Ответ от нейросети
 */
async function askDeepSeek(message) {
  try {
    // Добавляем сообщение пользователя в историю
    messages.push({ role: 'user', content: message });
    
    // Отправляем запрос к прокси
    const response = await fetch(DEEPSEEK_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // или 'deepseek-coder', 'deepseek-reasoner'
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Проверяем формат ответа
    if (data.choices?.[0]?.message?.content) {
      const aiResponse = data.choices[0].message.content;
      
      // Добавляем ответ в историю
      messages.push({ role: 'assistant', content: aiResponse });
      
      return aiResponse;
    }
    
    throw new Error('Неожиданный формат ответа от API');
    
  } catch (error) {
    console.error('Ошибка при работе с DeepSeek:', error);
    throw error;
  }
}

/**
 * Добавление сообщения в чат
 */
function addMessage(text, isUser) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
  messageDiv.innerHTML = text;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return messageDiv;
}

/**
 * Отправка сообщения
 */
function sendMessage() {
  const message = userInput.value.trim();
  if (message === '' || waitResponse) return;

  // Добавляем сообщение пользователя
  addMessage(message, true);
  userInput.value = '';

  // Показываем "..." от ИИ
  const placeholder = addMessage('...', false);
  waitResponse = true;

  // Отправляем запрос к DeepSeek
  askDeepSeek(message)
    .then(response => {
      placeholder.innerHTML = formater(response);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    })
    .catch(error => {
      placeholder.innerHTML = `❌ Ошибка: ${error.message}`;
      console.error('Ошибка:', error);
    })
    .finally(() => {
      waitResponse = false;
    });
}

// Отправка по клику и по Enter
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Автофокус на поле ввода при загрузке
userInput.focus();
