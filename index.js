const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Substitua 'SEU_CANAL_ID' pelo ID do canal em que você quer que o bot responda
const ALLOWED_CHANNEL_ID = '1292654075996799026'; // Canal para !pokemon
const COORDENADAS_CHANNEL_ID = '1291433025933934637'; // Canal para !coordenadas

client.once('ready', () => {
    console.log('Bot está online!');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Verifica se a mensagem foi enviada no canal correto para !pokemon
    if (message.content.startsWith('!pokemon') && message.channel.id !== ALLOWED_CHANNEL_ID) {
        const replyMessage = await message.channel.send(`Este comando não pode ser executado aqui, vá no chat: <#${ALLOWED_CHANNEL_ID}> para conseguir executar o comando.`);
        setTimeout(() => {
            message.delete().catch(console.error);
        }, 1000);
        setTimeout(() => {
            replyMessage.delete().catch(console.error);
        }, 30000);
        return;
    }

    // Verifica se a mensagem foi enviada no canal correto para !coordenadas
    if (message.content === '!coordenadas' && message.channel.id !== COORDENADAS_CHANNEL_ID) {
        const replyMessage = await message.channel.send(`Este comando só pode ser executado no canal <#${COORDENADAS_CHANNEL_ID}>.`);
        setTimeout(() => {
            message.delete().catch(console.error);
        }, 1000);
        setTimeout(() => {
            replyMessage.delete().catch(console.error);
        }, 30000);
        return;
    }

    // Comando !pokemon
    if (message.content.startsWith('!pokemon')) {
        try {
            const radarResponse = await axios.get('https://api.pokemon.sistemaweb.com.br/radar?lc=us&iv=90');
            const radarData = radarResponse.data;
            const randomIndex = Math.floor(Math.random() * radarData.pokemons.length);
            const pokemon = radarData.pokemons[randomIndex];

            const pokemonId = pokemon.pokemon_id;
            const latitude = pokemon.lat;
            const longitude = pokemon.lng;
            const attack = pokemon.attack;
            const defense = pokemon.defence;
            const stamina = pokemon.stamina;
            const cp = pokemon.cp;
            const level = pokemon.level;
            const totalIV = ((attack + defense + stamina) / 45) * 100;
            const ivPercentage = totalIV.toFixed(2);

            const pokedexResponse = await axios.get(`https://sg.portal-pokemon.com/play/pokedex/api/v1?key_word=${pokemonId}`);
            const pokedexData = pokedexResponse.data;
            const pokemonName = pokedexData.pokemons[0].pokemon_name;
            const pokemonType = pokedexData.pokemons[0].pokemon_type_name;

            const pokeApiResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const pokemonImage = pokeApiResponse.data.sprites.front_default;

            const pokemonEmbed = new EmbedBuilder()
                .setColor('#fffa00')
                .setTitle(`${pokemonName} (${pokemonType})`)
                .setImage(pokemonImage)
                .addFields(
                    { name: 'Coordenadas', value: `${latitude}, ${longitude}`, inline: false },
                    { name: 'IV', value: `${ivPercentage}% (ATK: ${attack}/DEF: ${defense}/STA: ${stamina})`, inline: false },
                    { name: 'CP', value: `${cp}`, inline: true },
                    { name: 'Level', value: `${level}`, inline: true }
                )
                .setFooter({ text: 'Dados do Pokémon via Radar' });

            await message.channel.send({ embeds: [pokemonEmbed] });
            await message.channel.send(`**Copie as coordenadas abaixo:**
\`\`\`${latitude}, ${longitude}\`\`\``);

        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            message.channel.send('Desculpe, não consegui buscar as informações do Pokémon.');
        }
    }

    // Comando !coordenadas
    if (message.content === '!coordenadas') {
        const coordenadasEmbed = new EmbedBuilder()
            .setColor('#fffa00')
            .setTitle('Melhores Coordenadas')
            .setDescription('Selecione uma região para obter as coordenadas:')
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('espanha')
                    .setEmoji('🇪🇸')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('estados_unidos')
                    .setEmoji('🇺🇸')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('japao')
                    .setEmoji('🇯🇵')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('hungria')
                    .setEmoji('🇭🇺')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('brasil')
                    .setEmoji('🇧🇷')
                    .setStyle(ButtonStyle.Primary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('argentina')
                    .setEmoji('🇦🇷')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('uruguai')
                    .setEmoji('🇺🇾')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('dinamarca')
                    .setEmoji('🇩🇰')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('peru')
                    .setEmoji('🇵🇪')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('canada')
                    .setEmoji('🇨🇦')
                    .setStyle(ButtonStyle.Primary)
            );

        await message.channel.send({ embeds: [coordenadasEmbed], components: [row1, row2] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    let coordenadas;

    switch (interaction.customId) {
        case 'espanha':
            coordenadas = 'Zaragoza: 41.661012,-0.893407\nSevilha: 37.418611,-5.995285';
            break;
        case 'estados_unidos':
            coordenadas = 'Pier 39, Califórnia: 37.808600,-122.409800\nNova York: 40.755200,-73.983000\nHonolulu: 21.27150,-157.82267\nJoy Walk, Texas: 29.364105,-94.810475\nAlasca: 61.216768,-149.892350';
            break;
        case 'japao':
            coordenadas = 'Tokyo: 35.669590,139.699690\nOsaka: 34.650110,135.510500\nOkinawa: 26.69144,127.87655\nNagoya: 35.155300,136.919780';
            break;
        case 'hungria':
            coordenadas = 'Budapeste: 47.531300,19.052800';
            break;
        case 'brasil':
            coordenadas = 'Consolação, São Paulo: -23.551200,-46.658400\nParque Ibirapuera, São Paulo: -23.587713,-46.658521\nPraça XV, Rio de Janeiro: -22.902745,-43.171821\nSão Luís, Maranhão: -2.555763,-44.308336\nSanta Catarina: -26.892929,-49.229217 / -26.893355,-49.230638';
            break;
        case 'argentina':
            coordenadas = 'Buenos Aires: -34.617777,-58.432851';
            break;
        case 'uruguai':
            coordenadas = 'Montevidéu: -34.913694,-56.165400';
            break;
        case 'dinamarca':
            coordenadas = 'Copenhagen: 55.662500,12.561800';
            break;
        case 'peru':
            coordenadas = 'Chancay: -11.562800,-77.270000\nParque de la Exposição, Lima: -12.062746,-77.03627';
            break;
        case 'canada':
            coordenadas = '47.564991,-52.707432';
            break;
    }

    await interaction.reply(coordenadas);
});

client.login(process.env.DISCORD_TOKEN);