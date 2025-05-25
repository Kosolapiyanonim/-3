import express from 'express';
import cors from 'cors';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

const app = express();
app.use(cors());
app.use(express.json());

// Настройки для проверки подписки
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME; // например, '@NONTAGency'

// Запуск Telegram-бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    // Отправляем запрос к нашему же API на этом сервере
    const url = `http://localhost:${process.env.PORT || 3000}/check-subscription`;
    const response = await axios.post(url, { user_id: userId });
    if (response.data.subscribed) {
      bot.sendMessage(chatId, 'Ты подписан на канал! Добро пожаловать 😊');
    } else {
      bot.sendMessage(chatId, `Пожалуйста, подпишись на канал: https://t.me/${CHANNEL_USERNAME.replace('@', '')}`);
    }
  } catch (error) {
    console.error('Ошибка проверки подписки:', error.message);
    bot.sendMessage(chatId, 'Ошибка проверки подписки. Попробуй позже.');
  }
});

// API для проверки подписки
app.post('/check-subscription', async (req, res) => {
  const { user_id } = req.body;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember?chat_id=${CHANNEL_USERNAME}&user_id=${user_id}`;
    const response = await axios.get(url);

    const status = response.data.result.status;
    const isSubscribed = ['member', 'administrator', 'creator'].includes(status);

    res.json({ subscribed: isSubscribed });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.json({ subscribed: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
