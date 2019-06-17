const Telegraf = require('telegraf');
const fetch = require('node-fetch');
const { TELEGRAM_BOT_TOKEN, API, KINOTEATR_API_KEY } = require('./constants');
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

const getMonth = (date) => Number(date.split('-')[1]);

const languageMenu = Telegraf.Extra
    .markdown()
    .markup((m) => m.inlineKeyboard([
        m.callbackButton('Русский', 'ru'),
        m.callbackButton('Украинский', 'ua')
    ]));

bot.command('start', ctx => {
    return ctx.reply('Пожалуйста, укажите язык интерфейса', languageMenu);
});

bot.command('help', ctx => {
    return ctx.reply('help');
});

function predicateFn (callbackData) {
    return callbackData === 'ru' || callbackData === 'ua'
}

bot.action(predicateFn, ctx => {
    ctx.reply('Укажите город, в которым Вы находитесь');
});

bot.hears(/харьков|Харьков/, ctx => {
    return ctx.reply('Отлично! Теперь мы можем начать поиск!');
});

bot.command('search_today', async ctx => {
    const response = await fetch(
        `${API}/rest/city/13/shows?apiKey=${KINOTEATR_API_KEY}&size=10&date=2019-06-17&detalization=FULL`
    ).then(response => response.json());

    const { films } = response;
    const userMessage = films.map(({ title }, index) => `${index + 1}. ${title}`).join('\n');

    ctx.reply(userMessage);
});

bot.command('search_week', async ctx => {
    const response = await fetch(
        `${API}/rest/city/13/shows?apiKey=${KINOTEATR_API_KEY}&size=10&detalization=FULL`
    ).then(response => response.json());

    const { films } = response;
    const userMessage = films.map(({ title }, index) => `${index + 1}. ${title}`).join('\n');

    ctx.reply(userMessage);
});

bot.command('top', async ctx => {
    const response = await fetch(
        `${API}/rest/city/13/shows?apiKey=${KINOTEATR_API_KEY}&size=10&detalization=FULL`
    ).then(response => response.json());

    const { films } = response;
    const userMessage = films
        .sort((f1, f2) => f2.imdb_rating - f1.imdb_rating)
        .map(({ title, imdb_rating }, index) => `${index + 1}. ${title}, рейтинг - ${imdb_rating}`)
        .join('\n');

    ctx.reply(userMessage);
});

bot.command('upcoming', async ctx => {
    const response = await fetch(
        `${API}/rest/films/premieres?apiKey=${KINOTEATR_API_KEY}&size=100`
    ).then(response => response.json());

    const { content } = response;
    const userMessage = content
        .filter(({ year }) => year === 2019)
        .sort((f1, f2 ) => getMonth(f1.premiere_ukraine) - getMonth(f2.premiere_ukraine))
        .map(({ title, premiere_ukraine }, index) => `${index + 1}. ${title}, дата выхода - ${premiere_ukraine}`)
        .join('\n');

    ctx.reply(userMessage);
});

bot.command('change_city', ctx => {

});

bot.command('change_language', ctx => {

});

bot.hears(/genre.[a-z\u0400-\u04FF]/, async ctx => {
    const genre = ctx.update.message.text.split(' ')[1];
    const response = await fetch(
        `${API}/rest/genres?apiKey=${KINOTEATR_API_KEY}&size=100`, {
            headers: { 'Accept-Language': 'ru-ru' }
        }
    ).then(response => response.json());

    const res = await fetch(
        `${API}/rest/city/13/shows?apiKey=${KINOTEATR_API_KEY}&size=10&detalization=FULL`
    ).then(response => response.json());

    const { content } = response;
    const { films } = res;

    const genreId = content.find(({ name }) => name === genre).id;

    const userMessage = films
        .filter(({ genre_ids}) => genre_ids.includes(genreId))
        .map(({ title }, index) => `${index + 1}. ${title}`)
        .join('\n');


    return ctx.reply(userMessage ? userMessage : 'К сожалению, фильмов в указанном жаенре нет в прокате');
});

bot.hears(/price.[a-z\u0400-\u04FF]/, async ctx => {
    let filmName = ctx.update.message.text.split(' ');
    filmName.shift();
    filmName = filmName.join(' ');

    const response = await fetch(
        `${API}/rest/city/13/shows?apiKey=${KINOTEATR_API_KEY}&size=10&detalization=FULL`
    ).then(response => response.json());

    const { content, films } = response;

    const film = films.find(({ title }) => title.toLowerCase() === filmName.toLowerCase());
    if (film) {
        console.log(film.id);
        const filmInfo = content.find(({ film_id }) => film_id === film.id);
        const price = filmInfo.times[0].prices;
        ctx.reply(`Средняя цена на ${filmName} - ${price}`);

    } else {
        ctx.reply('К сожалению, фильм не был найден, попробуйте еще раз.');
    }
});

bot.hears(/seance_today.[a-z\u0400-\u04FF]/, async ctx => {
    const response = await fetch(
        `${API}/rest/city/13/film/47915/?apiKey=${KINOTEATR_API_KEY}&size=10&detalization=FULL`
    ).then(response => response.json());

    console.log(response);
});

bot.command(/cheapest.[a-z\u0400-\u04FF]/, ctx => {

});



bot.launch();
