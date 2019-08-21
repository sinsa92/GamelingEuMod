const Discord = require('discord.js');
const Sequelize = require('sequelize');
const cl = new Discord.client();
const { prefix, altprefix, token, botowner } = require('./config.json');
const fs = require(fs);
cl.commands = new Discord.Collection();
const allCommands = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Discord.Collection();

for(const file of allCommands) {
    const cmd = require(`./commands/${file}`);
    cl.commands.set(cmd.name, cmd);
}

cl.once('ready', () => {
    console.log(`Logged in as ${cl.user.tag}!`);
    console.log('Successfully started up!\n\n')
})

cl.on('message', msg => {
    if(msg.author.bot) return;
    if((!msg.content.startsWith(prefix) && !msg.content.startsWith(altprefix))) autoreplies(msg);

    const args = msg.content.slice(prefix.length).split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const cmd = cl.commands.get(cmdName) ||cl.commands.find(cmd2 => cmd2.aliases && cmd2.aliases.includes(cmdName));

    //Autoreply Section
    if(!cmd) autoreplies();

    // Falls Command nicht existiert
    if(cmd.disabled) return;

    // Falls command OwnerOnly ist
    if(cmd.ownerOnly && !(msg.author.id === botowner)) return;

    // Falls der Command nicht in Direktnachrichten ausgeführt werden kann
    if(cmd.guildOnly && msg.channel.type !== 'text') return msg.reply('Ich kann diesen Befehl nicht in Direktnachrichten ausführen!');

    // Falls keine oder falsche Parameter mitgegeben wurden
    if(cmd.args && !args.length) {
        let reply = `Du hast ungültige oder keine Parameter eingegeben ${msg.author}!`;
        if(cmd.usage) {
            reply += `\nSyntax: ${prefix}${cmd.name} ${cmd.usage}`;
        }
        return msg.channel.send(reply);
    }

    // Falls zu wenige Parameter mitgegeben wurden
    if(cmd.minparams > args.length) {
        let reply = `Du hast zu wenige Parameter eingegeben ${msg.author}!`;
        if(cmd.usage) {
            reply += `\nSyntax: ${prefix}${cmd.name} ${cmd.usage}`;
        }
        return msg.channel.send(reply);
    }

    //Falls der Command eine Erwähnung benötigt
    if(cmd.args && cmd.mention && (msg.mentions.users.size == 0)) {
        let reply = `Du musst jemanden erwähnen um diesen Command ausführen zu können ${msg.author}!`;
        if(cmd.usage) {
            reply += `\nSyntax: ${prefix}${cmd.name} ${cmd.usage}`;
        }
    }

    //Führt den Command aus falls kein Cooldown aktiv ist
    if(!cooldowns.has(cmd.name)) {
        cooldowns.set(cmd.name, new Discord.Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(cmd.name);
    //Falls der Command einen Cooldown-Schutz hat, wird er hier gesetzt, ansonsten wird keiner gesetzt.
    const cooldownAmount = (cmd.cooldown || 0) * 1000;
    if(timestamps.has(msg.author.id)) {
        const expTime = timestamps.get(msg.author.id) + cooldownAmount;
        if(now < expTime) {
            const timeLeft = (expTime - now) / 1000;
            return msg.reply(`Du kannst diesen Command erst wieder in ${timeLeft.toFixed(1)} Sekunde(n) benutzen.`);
        }
    }

    //Prüft ob der Cooldown abgelaufen ist
    timestamps.set(msg.author.id, now);
    setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

    //Führt die Commands aus
    try{
        cmd.execute(msg, args, cl);
    }catch (error) {
        console.error(error);
        msg.reply('Ein Fehler ist aufgetreten, bitte versuche es später erneut.')
    }

});

//Event Member Joint
cl.on('guildMemberAdd', async member => {
    const channel = member.guild.channel.find(c => c.id == '438772337358405642');
    if (!channel) return;
    const newmem = await cl.fetchUser(member.id);
    channel.send(`\`[Join]\`📥 ${newmem.tag} (ID:${newmem.id}) hat soeben unseren Server betreten.`);

});

//Event Member Leavt
cl.on('guildMemberAdd', async member => {
    const channel = member.guild.channel.find(c => c.id == '438772337358405642');
    if (!channel) return;
    const oldmem = await cl.fetchUser(member.id);
    channel.send(`\`[Leave]\`📤 ${oldmem.tag} (ID:${oldmem.id}) hat soeben unseren Server verlassen.`);

});

function autoreplies() {
    //Hier Autoreplies einfügen
}