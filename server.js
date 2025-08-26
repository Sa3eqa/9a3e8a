const express = require('express');

const { Client, GatewayIntentBits } = require('discord.js');

const cors = require('cors');

const path = require('path');

require('dotenv').config();

const app = express();

const port = process.env.PORT || 3000;

// إعداد Discord Bot

const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMembers

  ]

});

// تفعيل CORS

app.use(cors());

app.use(express.json());

app.use(express.static('public'));

// متغيرات لحفظ بيانات السيرفرات

let serversData = {

  shop: {

    title: 'صاعقة شوب',

    inviteLink: 'https://discord.gg/37gSK7JjEf',

    guildId: '1240498933034389615',

    members: 0,

    reviews: 0

  },

  service: {

    title: 'صاعقة للخدمات',

    inviteLink: 'https://discord.gg/nbRKgdBuYP',

    guildId: '1404225981706928168',

    members: 0,

    reviews: 0

  }

};

// دالة لتحديث عدد الأعضاء

async function updateMemberCounts() {

  try {

    for (const [key, server] of Object.entries(serversData)) {

      const guild = client.guilds.cache.get(server.guildId);

      if (guild) {

        // جلب عدد الأعضاء الحقيقي (بدون البوتات)

        const memberCount = guild.memberCount;

        const members = await guild.members.fetch();

        const humanMembers = members.filter(member => !member.user.bot).size;

        

        serversData[key].members = humanMembers;

        console.log(`تم تحديث عدد أعضاء ${server.title}: ${humanMembers}`);

      }

    }

  } catch (error) {

    console.error('خطأ في تحديث عدد الأعضاء:', error);

  }

}

// تسجيل دخول البوت

client.once('ready', async () => {

  console.log(`تم تسجيل دخول البوت: ${client.user.tag}`);

  

  // تحديث عدد الأعضاء عند بدء البوت

  await updateMemberCounts();

  

  // تحديث عدد الأعضاء كل 5 دقائق

  setInterval(updateMemberCounts, 5 * 60 * 1000);

});

// تحديث عدد الأعضاء عند انضمام عضو جديد

client.on('guildMemberAdd', async (member) => {

  if (!member.user.bot) {

    const serverKey = Object.keys(serversData).find(key => 

      serversData[key].guildId === member.guild.id

    );

    

    if (serverKey) {

      serversData[serverKey].members++;

      console.log(`عضو جديد انضم لـ ${serversData[serverKey].title}`);

    }

  }

});

// تحديث عدد الأعضاء عند مغادرة عضو

client.on('guildMemberRemove', async (member) => {

  if (!member.user.bot) {

    const serverKey = Object.keys(serversData).find(key => 

      serversData[key].guildId === member.guild.id

    );

    

    if (serverKey) {

      serversData[serverKey].members = Math.max(0, serversData[serverKey].members - 1);

      console.log(`عضو غادر من ${serversData[serverKey].title}`);

    }

  }

});

// API لجلب بيانات السيرفرات

app.get('/api/servers', (req, res) => {

  res.json(serversData);

});

// API لجلب عدد أعضاء سيرفر محدد

app.get('/api/servers/:serverId/members', (req, res) => {

  const serverId = req.params.serverId;

  const server = serversData[serverId];

  

  if (server) {

    res.json({ members: server.members });

  } else {

    res.status(404).json({ error: 'السيرفر غير موجود' });

  }

});

// API لإضافة تقييم

app.post('/api/reviews', (req, res) => {

  const { server, text } = req.body;

  

  if (!server || !text) {

    return res.status(400).json({ error: 'البيانات غير مكتملة' });

  }

  

  const serverKey = Object.keys(serversData).find(key => 

    serversData[key].title === server

  );

  

  if (serverKey) {

    serversData[serverKey].reviews++;

    res.json({ success: true, reviews: serversData[serverKey].reviews });

  } else {

    res.status(404).json({ error: 'السيرفر غير موجود' });

  }

});

// تقديم الملف الرئيسي

app.get('/', (req, res) => {

  res.sendFile(path.join(__dirname, 'public', 'index.html'));

});

// بدء الخادم

app.listen(port, () => {

  console.log(`الخادم يعمل على البورت ${port}`);

});

// تسجيل دخول البوت

if (process.env.DISCORD_BOT_TOKEN) {

  client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);

} else {

  console.error('يرجى إضافة DISCORD_BOT_TOKEN في ملف .env');

}