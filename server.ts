const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3000;
const api_key = process.env.API_KEY;


app.use(express.static(__dirname + '/public/public'));
app.use((req: any, res: any, next: any) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; connect-src 'self'");
  next();
});


function get_weather_json(postal_code: string) {
  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${postal_code},JP&units=metric&lang=ja&appid=${api_key}`;
  return axios.get(url)
    .then((response: any) => {
      const data = response.data as any;
      return {
        エリア: data.name,
        天候: data.weather[0].icon,
        気温: data.main.temp,
        風向: data.wind.deg,
        降水量: data.rain?.['1h'] ?? 0
      };
    });
}

function get_forecast_json(postal_code: string) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?zip=${postal_code},JP&units=metric&lang=ja&appid=${api_key}`;
  type ForecastItem = {
    時間: string;
    天候: string;
    気温: number;
    風向: number;
    降水確率: number;
  };
  type RawForecastItem = {
    dt_txt: string;
    weather: [{ icon: string }];
    main: { temp: number };
    wind: { deg: number };
    pop: number;
  };
  return axios.get(url)
    .then((response: any) => {
      return response.data.list.slice(0, 16).map((item: RawForecastItem): ForecastItem => ({
        時間: item.dt_txt,
        天候: item.weather[0].icon,
        気温: item.main.temp,
        風向: item.wind.deg,
        降水確率: Math.round(item.pop * 100)
      }));
    });
}

app.get('/weather', async (req: any, res: any) => {
  const zip = req.query.zipcode as string;
  if (!zip || isNaN(Number(zip)) || zip.length !== 7) {
    return res.status(400).json({ error: '有効な7桁の郵便番号を入力してください' });
  }

  const postal_code = `${zip.slice(0, 3)}-${zip.slice(3)}`;
  console.log(`天気情報取得リクエスト受信`)
//   console.log(`取得中： ${postal_code}`);

  try {
    const currentWeather = await get_weather_json(postal_code);
    const forecast = await get_forecast_json(postal_code);

    res.json({
      '現在の天気情報': currentWeather,
      '2日分の予報（3時間ごと）': forecast
    });
  } catch (err: any) {
    console.error('エラーが発生しました:', err.message);
    res.status(500).json({ error: '天気情報の取得に失敗しました' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 サーバー起動中：http://localhost:${PORT}`);
});