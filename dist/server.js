"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = 3000;
const api_key = process.env.API_KEY;
app.disable('x-powered-by');
app.use(express_1.default.static(__dirname + '/dist/public'));
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; connect-src 'self'");
    next();
});
function get_weather_json(postal_code) {
    const url = `https://api.openweathermap.org/data/2.5/weather?zip=${postal_code},JP&units=metric&lang=ja&appid=${api_key}`;
    return axios_1.default.get(url)
        .then((response) => {
        const data = response.data;
        return {
            エリア: data.name,
            天候: data.weather[0].icon,
            気温: data.main.temp,
            風向: data.wind.deg,
            降水量: data.rain?.['1h'] ?? 0
        };
    });
}
function get_forecast_json(postal_code) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?zip=${postal_code},JP&units=metric&lang=ja&appid=${api_key}`;
    return axios_1.default.get(url)
        .then((response) => {
        return response.data.list.slice(0, 16).map((item) => ({
            時間: item.dt_txt,
            天候: item.weather[0].icon,
            気温: item.main.temp,
            風向: item.wind.deg,
            降水確率: Math.round(item.pop * 100)
        }));
    });
}
app.get('/weather', async (req, res) => {
    const zip = req.query.zipcode;
    if (!zip || isNaN(Number(zip)) || zip.length !== 7) {
        return res.status(400).json({ error: '有効な7桁の郵便番号を入力してください' });
    }
    const postal_code = `${zip.slice(0, 3)}-${zip.slice(3)}`;
    console.log(`天気情報取得リクエスト受信`);
    //   console.log(`取得中： ${postal_code}`);
    try {
        const currentWeather = await get_weather_json(postal_code);
        const forecast = await get_forecast_json(postal_code);
        res.json({
            '現在の天気情報': currentWeather,
            '2日分の予報（3時間ごと）': forecast
        });
    }
    catch (err) {
        console.error('エラーが発生しました:', err.message);
        res.status(500).json({ error: '天気情報の取得に失敗しました' });
    }
});
app.listen(PORT, () => {
    console.log(`🌐 サーバー起動中：http://localhost:${PORT}`);
});
