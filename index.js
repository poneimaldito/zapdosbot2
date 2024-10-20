const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Inicializa o cliente do Discord com as intenções necessárias
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Substitua 'SEU_CANAL_ID' pelo ID do canal onde você quer que o bot envie os dados automaticamente
const ALLOWED_CHANNEL_ID = '1292654075996799026';

// Intervalo em milissegundos para verificar a API (por exemplo, 60 segundos)
const CHECK_INTERVAL = 9000; // 15 segundos

let lastPokemonId = null; // Para armazenar o último Pokémon processado e evitar repetição

client.once('ready', () => {
    console.log('Bot está online!');

    // Função para verificar a API e enviar o Pokémon
    const checkForPokemon = async () => {
        try {
            // Faz a requisição para a API de radar (usando 90% IV como exemplo)
            const radarResponse = await axios.get('https://api.pokemon.sistemaweb.com.br/radar?lc=global&iv=90');
            const radarData = radarResponse.data;

            // Pega um Pokémon aleatório da lista
            if (radarData.pokemons.length > 0) {
                const randomIndex = Math.floor(Math.random() * radarData.pokemons.length);
                const pokemon = radarData.pokemons[randomIndex];

                // Verifica se é um Pokémon novo (evita repetição)
                if (pokemon.pokemon_id !== lastPokemonId) {
                    lastPokemonId = pokemon.pokemon_id; // Atualiza o último Pokémon encontrado

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

                    // Envia a mensagem no canal específico
                    const channel = await client.channels.fetch(ALLOWED_CHANNEL_ID);
                    await channel.send({ embeds: [pokemonEmbed] });

                    // Adicionando botão de copiar coordenadas
                    const copyCoordinatesMessage = `**Copie as coordenadas abaixo:**
\`\`\`${latitude}, ${longitude}\`\`\``;

                    await channel.send(copyCoordinatesMessage);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
        }
    };

    // Define um intervalo para verificar a API periodicamente
    setInterval(checkForPokemon, CHECK_INTERVAL);
});

// Faz login no bot do Discord
client.login(process.env.DISCORD_TOKEN);