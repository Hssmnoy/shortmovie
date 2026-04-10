const axios = require("axios");
const fs = require("fs");

// 🔥 server ทั้งหมด
const BASES = [
  "https://love.sikoyo3159.workers.dev",
  "https://love.tivov68423.workers.dev",
  "https://love.tecobo5568.workers.dev"
];

// 🔥 แยก 2 URL
const urls = [
  "https://embed.bananacake.org/dooball66v2/ajax_channels.php?api_key=hmcb4rf66f&sportsonly=1", // กีฬา
  "https://embed.bananacake.org/dooball66v2/ajax_channels.php?api_key=hmcb4rf66f" // ทั้งหมด
];

const regex = /src\s*=\s*'([^']+)'.*?loadPlayer\('([^']+)'\)/gs;

async function main() {
  const map = {};

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];

    // 🏷️ แยกกลุ่ม
    const groupName = i === 0 ? "🏟️ กีฬา" : "📺 ทั่วไป";

    const res = await axios.get(url);

    let match;
    while ((match = regex.exec(res.data)) !== null) {
      const logo = match[1];
      const id = match[2];

      // 🔥 กันซ้ำ (เอาจาก sport ก่อน)
      if (!map[id]) {
        console.log("⏳", id);

        const qualities = ["_720", "_480"];
        const servers = [];

        // 🔥 ไม่เช็ค → สร้างทุกลิงก์
        qualities.forEach(q => {
          BASES.forEach((base, idx) => {
            servers.push({
              name: `${q.replace("_", "")} ${idx === 0 ? "Main" : `Backup ${idx}`}`,
              url: `${base}/lx-origin/${id}${q}/chunks.m3u8`
            });
          });
        });

        map[id] = {
          title: id,
          group: groupName,
          logo: logo,
          servers: servers
        };

        console.log("✅", id);
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

  const groupMap = {};

  playlist.forEach(ch => {
    if (!groupMap[ch.group]) {
      groupMap[ch.group] = {
        name: ch.group,
        image: ch.logo,
        groups: []
      };
    }

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
        isHost: false
      });
    });

    groupMap[ch.group].groups.push(matchGroup);
  });

  wiseplay.groups = Object.values(groupMap);

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
