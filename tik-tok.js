import fetch from 'node-fetch';

let autopostData;
let accessToken = 'act.RqO15v5ZRK5RYUCEmBYKJsp8TrUNXwFD0NJeTx0fBqgMJ4rzKIrWtyHel6fW!6268.va';
let refresh_Token = 'rft.iRa3csG5tI9eMkWspyk3x0CG2IRPUxdgDlA2AZRt35s1QcXZNKLPfoJiuUv9!6287.va';

//refresh Token
function refreshTikTokToken(refreshToken) {
    const url = 'https://open.tiktokapis.com/v2/oauth/token/';
    const params = new URLSearchParams({
        client_key: 'awtk9q11ll2kqoe1',
        client_secret: 'Frrdb0ZJUjCh7hXtEc9VinH1rr6ysnjk',
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    });

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
        },
        body: params
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }).then(data => {
        console.log('data : ',data);
        accessToken = data.access_token;
        refresh_Token = data.refresh_token;
    }).catch(error => {
        console.error('Error fetching token:', error);
    });
}

setInterval(() => refreshTikTokToken(refresh_Token), 12 * 60 * 60 * 1000);

//create tik-tok post
async function publishTikTokContent(accessToken, title, description, photo) {
    const url = 'https://open.tiktokapis.com/v2/post/publish/content/init/';
    const postData = {
        post_info: {
            title: title,
            description: description,
            disable_comment: true,
            privacy_level: "PUBLIC_TO_EVERYONE",
            auto_add_music: true
        },
        source_info: {
            source: "PULL_FROM_URL",
            photo_cover_index: 0,
            photo_images: [
                photo
            ]
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO"
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        });

        return await response.json();
    } catch (error) {
        console.error('Error publishing content:', error);
    }
}

//Start post tiktik
async function processItem(item, match) {
  if (Number(item.state_display) && Number(item.state_display) < 2) {
      const homeTeamName = item.home_team?.name || '';
      const awayTeamName = item.away_team?.name || '';
      const competitionName = match.competition?.name || '';
      const venueName = item.venue?.name || '';
    
      const title = `🎌Match Started!🎌 \n\n💥⚽️💥 ${homeTeamName} vs ${awayTeamName} League: ${competitionName} 💥⚽️💥`;
      const description = `${item.url} #${homeTeamName.replace(/[^a-zA-Z]/g, "")} #${awayTeamName.replace(/[^a-zA-Z]/g, "")} #${competitionName.replace(/[^a-zA-Z]/g, "")} ${venueName ? '#' + venueName.replace(/[^a-zA-Z]/g, "") : ''}`

      await publishTikTokContent(accessToken, title, description, item.social_picture)
        .then(data => console.log(data))
        .catch(error => console.error(error));
  }
}

//Get autopost is on or off
async function fetchAutopost() {
    try {
        const response = await fetch('https://sportscore.io/api/v1/autopost/settings/tiktok/', {
            method: 'GET',
            headers: {
                "accept": "application/json",
                'X-API-Key': 'uqzmebqojezbivd2dmpakmj93j7gjm',
            },
        });
        const data = await response.json();
        console.log(data);
        return data; 
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// ===== MAKE POST ON PAGE =====
async function getMatch(matches) {
    autopostData = await fetchAutopost();
    
    if (autopostData.some(item => item.enabled === true)) {
        for (const match of matches) {
            for (const item of match.matches) {
          
                await processItem(item, match);
            }
        }
    }
}

// get data from Sport Score
function fetchData() {
    fetch('https://sportscore.io/api/v1/football/matches/?match_status=live&sort_by_time=false&page=0', {
        method: 'GET',
        headers: {
            "accept": "application/json",
            'X-API-Key': 'uqzmebqojezbivd2dmpakmj93j7gjm',
        },
    })
    .then(response => response.json())
    .then(data => {
        getMatch(data.match_groups);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// start every 1 minute
setInterval(fetchData, 60000);

fetchData();