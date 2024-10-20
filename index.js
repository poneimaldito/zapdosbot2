const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Inicializa o cliente do Discord com as intenções necessárias
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Substitua 'SEU_CANAL_ID' pelo ID do canal onde você quer que o bot responda ao comando
const ALLOWED_CHANNEL_ID = '1292654075996799026';

let lastPokemonId = null; // Para armazenar o último Pokémon processado e evitar repetição

client.once('ready', () => {
    console.log('Bot está online!');

    // Função para verificar a API e enviar o Pokémon
    const checkForPokemon = async (message) => {
        try {
            console.log('Verificando API para novos Pokémons...');

            // API: Radar Pokémon (somente a URL fornecida)
            const radarResponse = await axios.get('https://api.pokemon.sistemaweb.com.br/radar?lc=gb&iv=90');
            const radarData = radarResponse.data;

            // Verifica se há Pokémon disponível
            if (!radarData.pokemons || radarData.pokemons.length === 0) {
                console.log('Nenhum Pokémon encontrado.');
                message.reply('Nenhum Pokémon disponível no momento.');
                return;
            }

            // Seleciona um Pokémon aleatório da lista
            const randomIndex = Math.floor(Math.random() * radarData.pokemons.length);
            const pokemon = radarData.pokemons[randomIndex];

            // Verifica se o Pokémon encontrado é novo (para evitar repetição)
            if (pokemon.pokemon_id === lastPokemonId) {
                console.log('Pokémon repetido. Ignorando...');
                message.reply('O último Pokémon encontrado foi repetido. Tente novamente.');
                return;
            }
            lastPokemonId = pokemon.pokemon_id;

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

            // Requisição para a PokéAPI para obter nome e imagem do Pokémon
            const pokeApiResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const pokemonImage = pokeApiResponse.data.sprites.front_default;
            const pokemonName = pokeApiResponse.data.name;

            // Cria o embed com as informações visuais e detalhadas
            const pokemonEmbed = new EmbedBuilder()
                .setColor('#fffa00')  // Cor amarela para combinar com Pokémon
                .setTitle(`${pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1)}`) // Nome do Pokémon
                .setImage(pokemonImage)  // Imagem do Pokémon
                .addFields(
                    { name: 'Coordenadas', value: `[${latitude}, ${longitude}](https://maps.google.com/?q=${latitude},${longitude})`, inline: false },
                    { name: 'IV', value: `${ivPercentage}% (ATK: ${attack}/DEF: ${defense}/STA: ${stamina})`, inline: false },
                    { name: 'CP', value: `${cp}`, inline: true },
                    { name: 'Level', value: `${level}`, inline: true }
                )
                .setFooter({ text: 'Dados obtidos via Radar Pokémon' });

            // Envia a mensagem no canal onde o comando foi executado
            await message.channel.send({ embeds: [pokemonEmbed] });

            // Adicionando botão de copiar coordenadas
            const copyCoordinatesMessage = `**Copie as coordenadas abaixo:**
\`\`\`${latitude}, ${longitude}\`\`\``;

            await message.channel.send(copyCoordinatesMessage);

        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            message.reply('Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.');
        }
    };

    // Listener para o comando !pokemon
    client.on('messageCreate', async message => {
        if (message.content === '!pokemon' && message.channel.id === ALLOWED_CHANNEL_ID) {
            console.log('Comando !pokemon recebido.');
            await checkForPokemon(message);
        }
    });
});

// Faz login no bot do Discord
client.login(process.env.DISCORD_TOKEN);