const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// IDs dos canais permitidos
const POKEMON_CHANNEL_ID = '1292654075996799026'; // Canal para comando !pokemon
const COORDENADAS_CHANNEL_ID = '1291433025933934637'; // Canal para !coordenadas, !status, !tipo e !evolucao

client.once('ready', () => {
    console.log('Bot está online!');
});

// Função para verificar o canal
const isCorrectChannel = (message, allowedChannelId) => message.channel.id === allowedChannelId;

// Comando !pokemon com botão de "Mostrar coordenadas"
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!pokemon') && !isCorrectChannel(message, POKEMON_CHANNEL_ID)) {
        const replyMessage = await message.channel.send(`Este comando não pode ser executado aqui. Vá para o chat correto: <#${POKEMON_CHANNEL_ID}>.`);
        return;
    }

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

            const pokeApiResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const pokemonImage = pokeApiResponse.data.sprites.front_default;
            const pokemonName = pokeApiResponse.data.name;
            const pokemonType = pokeApiResponse.data.types.map(type => type.type.name).join(', ');

            const pokemonEmbed = new EmbedBuilder()
                .setColor('#fffa00')
                .setTitle(`${pokemonName} (${pokemonType})`)
                .setImage(pokemonImage)
                .addFields(
                    { name: 'Coordenadas', value: `Latitude, Longitude`, inline: false },
                    { name: 'IV', value: `${ivPercentage}% (ATK: ${attack}/DEF: ${defense}/STA: ${stamina})`, inline: false },
                    { name: 'CP', value: `${cp}`, inline: true },
                    { name: 'Level', value: `${level}`, inline: true }
                )
                .setFooter({ text: 'Dados do Pokémon via Radar' });

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('show-coordinates')
                        .setLabel('Mostrar Coordenadas')
                        .setStyle(ButtonStyle.Primary)
                );

            const sentMessage = await message.channel.send({ embeds: [pokemonEmbed], components: [buttonRow] });

            // Botão para mostrar as coordenadas
            const collector = sentMessage.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 });

            collector.on('collect', async i => {
                if (i.customId === 'show-coordinates') {
                    await i.reply({ content: `Coordenadas: \`${latitude}, ${longitude}\``, ephemeral: true });
                }
            });

        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            message.channel.send('Desculpe, não consegui buscar as informações do Pokémon.');
        }
    }

    // Verifica o canal para os outros comandos
    if (!isCorrectChannel(message, COORDENADAS_CHANNEL_ID)) {
        return;
    }

    // Comando !status
    if (message.content.startsWith('!status')) {
        const pokemonNameOrId = message.content.split(' ')[1];

        try {
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId}`);
            const pokemonData = response.data;

            const embed = new EmbedBuilder()
                .setTitle(`${pokemonData.name} - Status`)
                .addFields(
                    { name: 'HP', value: `${pokemonData.stats[0].base_stat}`, inline: true },
                    { name: 'Attack', value: `${pokemonData.stats[1].base_stat}`, inline: true },
                    { name: 'Defense', value: `${pokemonData.stats[2].base_stat}`, inline: true }
                );

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            message.channel.send('Erro ao obter os dados de status.');
        }
    }

    // Comando !tipo
    if (message.content.startsWith('!tipo')) {
        const pokemonNameOrId = message.content.split(' ')[1];

        try {
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonNameOrId}`);
            const pokemonData = response.data;
            const types = pokemonData.types.map(type => type.type.name).join(', ');

            const embed = new EmbedBuilder()
                .setTitle(`${pokemonData.name} - Tipos`)
                .setDescription(`Tipo(s): ${types}`);

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            message.channel.send('Erro ao obter os dados de tipos.');
        }
    }

    // Comando !evolucao
    if (message.content.startsWith('!evolucao')) {
        const pokemonNameOrId = message.content.split(' ')[1];

        try {
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemonNameOrId}`);
            const speciesData = response.data;
            const evolutionChainUrl = speciesData.evolution_chain.url;
            const evolutionResponse = await axios.get(evolutionChainUrl);
            const evolutionData = evolutionResponse.data;

            const evolutions = [];
            let currentEvolution = evolutionData.chain;

            while (currentEvolution) {
                evolutions.push(currentEvolution.species.name);
                currentEvolution = currentEvolution.evolves_to[0];
            }

            const embed = new EmbedBuilder()
                .setTitle(`${speciesData.name} - Evoluções`)
                .setDescription(`Evoluções: ${evolutions.join(' -> ')}`);

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            message.channel.send('Erro ao obter os dados de evolução.');
        }
    }

    // Comando !coordenadas
    if (message.content.startsWith('!coordenadas')) {
        const embed = new EmbedBuilder()
            .setTitle('Selecione uma região')
            .setDescription('Escolha uma região para ver as coordenadas:')
            .addFields(
                { name: 'Espanha', value: 'Zaragoza, Sevilha', inline: true },
                { name: 'Estados Unidos', value: 'Pier 39, Nova York, etc.', inline: true },
                { name: 'Japão', value: 'Tokyo, Osaka, etc.', inline: true }
                // Adicione mais regiões conforme necessário
            );

        await message.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);