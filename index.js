const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Substitua 'SEU_CANAL_ID' pelo ID do canal em que você quer que o bot responda
const ALLOWED_CHANNEL_ID = '1292654075996799026';

client.once('ready', () => {
    console.log('Bot está online!');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Verifica se a mensagem foi enviada no canal correto
    if (message.channel.id !== ALLOWED_CHANNEL_ID) return;

    if (message.content.startsWith('!pokemon')) {
        try {
            // Faz uma requisição para a API de radar
            const radarResponse = await axios.get('https://api.pokemon.sistemaweb.com.br/radar?lc=us&iv=100');
            const radarData = radarResponse.data;

            // Pega um Pokémon aleatório da lista
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

            // Calcula o IV (baseado em ataque, defesa e stamina)
            const totalIV = ((attack + defense + stamina) / 45) * 100;
            const ivPercentage = totalIV.toFixed(2);

            // Requisição para a Pokedex API para obter nome e tipo do Pokémon
            const pokedexResponse = await axios.get(`https://sg.portal-pokemon.com/play/pokedex/api/v1?key_word=${pokemonId}`);
            const pokedexData = pokedexResponse.data;

            const pokemonName = pokedexData.pokemons[0].pokemon_name;
            const pokemonType = pokedexData.pokemons[0].pokemon_type_name;

            // Obtenção da imagem do Pokémon (usando PokéAPI)
            const pokeApiResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const pokemonImage = pokeApiResponse.data.sprites.front_default;

            // Cria o embed com as informações
            const pokemonEmbed = new EmbedBuilder()
                .setColor('#fffa00')  // Cor definida
                .setTitle(`${pokemonName} (${pokemonType})`)
                .setImage(pokemonImage)  // Adiciona a imagem do Pokémon
                .addFields(
                    { name: 'Coordenadas', value: `${latitude}, ${longitude}`, inline: false },
                    { name: 'IV', value: `${ivPercentage}% (ATK: ${attack}/DEF: ${defense}/STA: ${stamina})`, inline: false },
                    { name: 'CP', value: `${cp}`, inline: true },
                    { name: 'Level', value: `${level}`, inline: true }
                )
                .setFooter({ text: 'Dados do Pokémon via Radar' });

            await message.channel.send({ embeds: [pokemonEmbed] });
            
            // Adicionando botão de copiar coordenadas
            const copyCoordinatesMessage = `**Copie as coordenadas abaixo:**
\`\`\`${latitude}, ${longitude}\`\`\``;
            
            await message.channel.send(copyCoordinatesMessage);

        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            message.channel.send('Desculpe, não consegui buscar as informações do Pokémon.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);