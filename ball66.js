const axios = require("axios");
const fs = require("fs");

// 🔥 server ทั้งหมด
const BASES = [
  "https://love.sikoyo3159.workers.dev",
  "https://love.tivov68423.workers.dev",
  "https://love.tecobo5568.workers.dev",
  "https://love.uh6wzyncw9.workers.dev"
];

const urls = [
  "https://embed.bananacake.org/dooball66v2/ajax_channels.php?api_key=hmcb4rf66f&sportsonly=1",
  "https://embed.bananacake.org/dooball66v2/ajax_channels.php?api_key=hmcb4rf66f"
];

const regex = /src\s*=\s*'([^']+)'.*?loadPlayer\('([^']+)'\)/gs;

async function checkStream(url) {
  try {
    const res = await axios.get(url, { timeout: 5000 });
    return res.status === 200;
  } catch {
    return false;
  }
}

// 🔥 หา path ที่ใช้ได้ (ใช้ server แรกเช็ค)
async function getPath(id) {
  const qualities = ["_720", "_1080", "_480"];

  for (const q of qualities) {
    const testUrl = `${BASES[0]}/lx-origin/${id}${q}/chunks.m3u8`;
    if (await checkStream(testUrl)) {
      return `${id}${q}`;
    }
  }

  return null;
}

async function main() {
  const map = {};

  for (const url of urls) {
    const res = await axios.get(url);

    let match;
    while ((match = regex.exec(res.data)) !== null) {
      const logo = match[1];
      const id = match[2];

      if (!map[id]) {
        console.log("⏳", id);

        const path = await getPath(id);

        if (path) {
          // 🔥 สร้างหลาย server
          const servers = BASES.map((base, i) => ({
            name: i === 0 ? "Main" : `Backup ${i}`,
            url: `${base}/lx-origin/${path}/chunks.m3u8`
          }));

          map[id] = {
            title: id,
            group: "Dooball",
            logo: logo,
            servers: servers
          };

          console.log("✅", id);
        } else {
          console.log("❌", id);
        }
      }
    }
  }

  const playlist = Object.values(map);

  // ---------------- JSON ----------------
  fs.writeFileSync(
    "playlist.json",
    JSON.stringify(playlist, null, 2),
    "utf-8"
  );

  // ---------------- Wiseplay Nested Groups ----------------
const wiseplay = {
  name: "Dooball66",
  author: "Dooball66 " + new Date().toLocaleString(),
  image: "https://dooball66ad.com/wp-content/uploads/2020/07/cropped-logo.png",
  groups: []
};

// 🔥 group ตาม category (เช่น Dooball)
const groupMap = {};

playlist.forEach(ch => {
  if (!groupMap[ch.group]) {
    groupMap[ch.group] = {
      name: ch.group,
      image: ch.logo,
      groups: []
    };
  }

  // 🔥 match = 1 channel
  const matchGroup = {
    name: ch.title,
    image: ch.logo,
    stations: []
  };

  ch.servers.forEach((server, i) => {
    matchGroup.stations.push({
      name: i === 0 ? "🟢 MAIN" : `🟡 BACKUP ${i}`,
      info: ch.title,
      image: ch.logo,
      url: server.url,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
      referer: "https://embed-xs.bananacake.org/",
      isHost: false // 🔥 m3u8 ต้อง false
    });
  });

  groupMap[ch.group].groups.push(matchGroup);
});

// 🔥 แปลงเป็น array
wiseplay.groups = Object.values(groupMap);

// 🔥 save file
fs.writeFileSync(
  "playlist_wiseplay.json",
  JSON.stringify(wiseplay, null, 2),
  "utf-8"
);
  
  // ---------------- M3U ----------------
  let m3u = "#EXTM3U\n";

  playlist.forEach(ch => {
    ch.servers.forEach(server => {
      m3u += `#EXTINF:-1 tvg-logo="${ch.logo}" group-title="${ch.group}",${ch.title} (${server.name})\n`;
      m3u += `${server.url}\n`;
    });
  });

  fs.writeFileSync("playlist.m3u", m3u, "utf-8");

  console.log("\n🎉 DONE:", playlist.length);
}

main();
