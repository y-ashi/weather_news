function getWeather() {
  const zipcode = document.getElementById('zipcode').value;
  if (!/^\d{7}$/.test(zipcode)) {
    alert('郵便番号は半角数字7桁で入力してください');
    return;
  }

  const formattedZip = `${zipcode.slice(0, 3)}-${zipcode.slice(3)}`;
  document.getElementById('loading').innerText = `取得中： ${formattedZip}`;
  document.getElementById('current-weather').innerText = '';
  document.querySelector('#forecast-table tbody').innerHTML = '';

  fetch(`/weather?zipcode=${zipcode}`)
    .then(res => res.json())
    .then(data => {
      const current = data['現在の天気情報'];
      const forecast = data['2日分の予報（3時間ごと）'];
      const iconCode = current['天候'].replace('n', 'd'); // 夜コードを昼に変換
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

      // 背景色変更
      const weatherClassMap = {
        '01d': 'sunny',
        '02d': 'cloudy',
        '03d': 'cloudy',
        '04d': 'cloudy',
        '09d': 'rainy',
        '10d': 'rainy',
        '11d': 'stormy',
        '13d': 'snowy',
        '50d': 'foggy'
      };

     const unifiedCode = current['天候'].replace('n', 'd');
     const weatherClass = weatherClassMap[unifiedCode] || 'default';
     document.body.className = weatherClass;
     console.log('天気コード:', current['天候']);
     console.log('背景クラス:', weatherClass);

      // アドバイス生成
      let advice = '';
      if (current['気温'] < 10) advice += '🧥 寒いので上着を忘れずに！';
      else if (current['気温'] > 28) advice += '🌞 暑いので熱中症に注意！';
      if (current['降水量'] > 0 || forecast.some(f => f['降水確率'] > 50)) {
        advice += '☔ 傘を持っていきましょう。';
      }

      document.getElementById('current-weather').innerHTML = `
        <div class="weather-card">
          <img src="${iconUrl}" alt="天気アイコン"><br>
          <strong>${current['エリア']}</strong><br>
          ${Math.round(current['気温'])}℃<br>
          降水量: ${current['降水量']} mm
          <p>${advice}</p>
        </div>
      `;

      // 日付・時間整形
      function getDateAndHour(datetimeStr) {
        const date = new Date(datetimeStr);
        return {
          date: `${date.getMonth() + 1}月${date.getDate()}日`,
          hour: `${date.getHours()}時`
        };
      }

      // 風向変換
      function getDirection(degree) {
        const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東',
                            '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
        const index = Math.round(degree / 22.5) % 16;
        return directions[index];
      }

      // テーブル表示
      let previousDate = '';
      const tbody = document.querySelector('#forecast-table tbody');

      forecast.forEach(item => {
        const { date, hour } = getDateAndHour(item['時間']);
        const showDate = date === previousDate ? '　' : date;
        previousDate = date;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${showDate}</td>
          <td>${hour}</td>
          <td>
            <img src="https://openweathermap.org/img/wn/${item['天候']}@2x.png"
                 alt="天気アイコン"
                 title="天気"
                 width="40">
          </td>
          <td style="color:${item['気温'] > 30 ? 'red' : item['気温'] < 10 ? 'blue' : 'black'}">
            ${Math.round(item['気温'])}℃
          </td>
          <td>${getDirection(item['風向'])}</td>
          <td style="color:${item['降水確率'] > 50 ? 'blue' : 'gray'}">${item['降水確率']}%</td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(err => {
      document.getElementById('loading').innerText = '';
      alert('天気情報の取得に失敗しました');
    });
}