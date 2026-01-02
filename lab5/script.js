// Глобальная переменная для хранения истории чата
let chatHistory = [];

// Обновление значения температуры при изменении слайдера
document.getElementById('temperature-slider').addEventListener('input', function() {
  const temp = parseFloat(this.value).toFixed(1);
  document.getElementById('temp-value').textContent = temp;
});

// Функция для добавления сообщения в историю и отображение
function addToChat(role, content) {
  const chatHistoryDiv = document.getElementById('chat-history');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${role}`;
  msgDiv.textContent = content;
  chatHistoryDiv.appendChild(msgDiv);
  chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // Прокрутка вниз
}

// Очистка истории (опционально)
function clearChat() {
  chatHistory = [];
  document.getElementById('chat-history').innerHTML = '';
}

// Функция отправки запроса
document.getElementById('send-btn').onclick = async function () {
  const input = document.getElementById('user-input').value.trim();
  if (!input) return;

  // Добавляем запрос пользователя в историю
  addToChat('user', input);

  // Показываем "думает..."
  const responseDiv = document.createElement('div');
  responseDiv.className = 'message assistant';
  responseDiv.id = 'current-response';
  document.getElementById('chat-history').appendChild(responseDiv);
  responseDiv.textContent = "Консультант думает...";
  
  // Получаем настройки из интерфейса
  const temperature = parseFloat(document.getElementById('temperature-slider').value);
  const maxTokens = parseInt(document.getElementById('max-tokens').value) || 50;

  // Подготавливаем запрос с историей
  const request = {
    "model": "gemma3:1b",
    "messages": [
      {
        "role": "system",
        "content": `Ты консультант фирмы по продаже квартир. 
        Отвечай вежливо и профессионально. 
        В наличии квартира по адресу "ул. Примерная, д. 1, кв. 10",
        стоимостью 10 миллионов рублей. 
        Постарайся продать ее.`
      },
      ...chatHistory, // Добавляем всю историю
      {
        "role": "user",
        "content": input
      }
    ],
    'max_tokens': maxTokens,
    "temperature": temperature
  };

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    const reader = response.body.getReader();
    let result = '';
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      try {
        let chunk = decoder.decode(value, { stream: true });
        let response_chunk = JSON.parse(chunk);
        if (response_chunk.message.content) {
          result += response_chunk.message.content;
          document.getElementById('current-response').textContent = result;
        }
      } catch (e) {
        console.log(e);
      }
    }

    // Сохраняем ответ в историю
    chatHistory.push({ role: "assistant", content: result });

    // Убираем временный текст "думает..."
    document.getElementById('current-response').id = '';

  } catch (e) {
    document.getElementById('current-response').textContent = "Ошибка связи с AI сервисом.";
    console.log(e);
  }

  // Очищаем поле ввода
  document.getElementById('user-input').value = '';
};

// Обработка Enter
document.getElementById('user-input').addEventListener('keydown', function(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    document.getElementById('send-btn').click();
  }
});