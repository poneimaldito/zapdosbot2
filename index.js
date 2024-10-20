const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Inicializa o cliente do Discord com as intenções necessárias
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Substitua 'SEU_CANAL_ID' pelo ID do canal onde você quer que o bot envie os dados automaticamente
const ALLOWED_CHANNEL_ID = '1292654075996799026';

// Intervalo em milissegundos para verificar as APIs (ex: 60 segundos)
const CHECK_INTERVAL = 60000; // 1 minuto

let lastPokemonId = null; // Para armazenar o último Pokémon processado e evitar repetição

client.once('ready', () => {
    console.log('Bot está online!');

    // Função para verificar as APIs e enviar o Pokémon
    const checkForPokemon = async () => {
        try {
            // Primeira API: Radar Pokémon
            const radarResponse = await axios.get('https://api.pokemon.sistemaweb.com.br/radar?lc=us&iv=90');
            const radarData = radarResponse.data;
            
            // Segunda API: Verifica se há Pokémon disponível
            let pokemon = null;

            if (radarData.pokemons && radarData.pokemons.length > 0) {
                const randomIndex = Math.floor(Math.random() * radarData.pokemons.length);
                pokemon = radarData.pokemons[randomIndex];
            }

            // Caso a primeira API não retorne resultados, tenta a segunda API
            if (!pokemon) {
                const radarResponse2 = await axios.get('https://api.pokemon.sistemaweb.com.br/radar?lc=global&iv=90');
                const radarData2 = radarResponse2.data;
                if (radarData2.pokemons && radarData2.pokemons.length > 0) {
                    const randomIndex2 = Math.floor(Math.random() * radarData2.pokemons.length);
                    pokemon = radarData2.pokemons[randomIndex2];
                }
            }

            // Se nenhum Pokémon foi encontrado, retorna
            if (!pokemon) return;

            // Verifica se o Pokémon encontrado é novo (para evitar repetição)
            if (pokemon.pokemon_id === lastPokemonId) return;
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

            // Requisição para a Pokedex API para obter nome e tipo do Pokémon
            const pokedexResponse = await axios.get(`https://sg.portal-pokemon.com/play/pokedex/api/v1?key_word=${pokemonId}`);
            const pokedexData = pokedexResponse.data;

            const pokemonName = pokedexData.pokemons[0].pokemon_name;
            const pokemonType = pokedexData.pokemons[0].pokemon_type_name;

            // Obtenção da imagem do Pokémon (usando PokéAPI)
            const pokeApiResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            const pokemonImage = pokeApiResponse.data.sprites.front_default;

            // Cria o embed com as informações visuais e detalhadas
            const pokemonEmbed = new EmbedBuilder()
                .setColor('#fffa00')  // Cor amarela para combinar com Pokémon
                .setTitle(`${pokemonName} (${pokemonType})`) // Nome e tipo do Pokémon
                .setImage(pokemonImage)  // Imagem do Pokémon
                .addFields(
                    { name: 'Coordenadas', value: `[${latitude}, ${longitude}](https://maps.google.com/?q=${latitude},${longitude})`, inline: false },
                    { name: 'IV', value: `${ivPercentage}% (ATK: ${attack}/DEF: ${defense}/STA: ${stamina})`, inline: false },
                    { name: 'CP', value: `${cp}`, inline: true },
                    { name: 'Level', value: `${level}`, inline: true }
                )
                .setFooter({ text: 'Dados obtidos via Radar Pokémon' });

            // Envia a mensagem no canal específico
            const channel = await client.channels.fetch(ALLOWED_CHANNEL_ID);
            await channel.send({ embeds: [pokemonEmbed] });

            // Adicionando botão de copiar coordenadas
            const copyCoordinatesMessage = `**Copie as coordenadas abaixo:**
\`\`\`${latitude}, ${longitude}\`\`\``;

            await channel.send(copyCoordinatesMessage);

        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
        }
    };

    // Define um intervalo para verificar as APIs periodicamente
    setInterval(checkForPokemon, CHECK_INTERVAL);
});

// Faz login no bot do Discord
client.login(process.env.DISCORD_TOKEN);