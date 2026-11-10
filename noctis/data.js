(() => {
  const stars = [
    ['sirius','Sírius',6.7525,-16.7161,-1.46,8.6,'Cão Maior','A estrela mais brilhante do céu noturno.'],
    ['canopus','Canopus',6.3992,-52.6957,-0.74,310,'Carina','Uma das estrelas mais brilhantes vistas do hemisfério sul.'],
    ['arcturus','Arcturo',14.2610,19.1825,-0.05,36.7,'Boieiro','Gigante alaranjada relativamente próxima do Sol.'],
    ['vega','Vega',18.6156,38.7837,0.03,25,'Lira','Uma das estrelas que formam o Triângulo de Verão.'],
    ['capella','Capella',5.2782,45.9980,0.08,42.9,'Cocheiro','Sistema estelar múltiplo muito brilhante.'],
    ['rigel','Rigel',5.2423,-8.2016,0.12,860,'Órion','Supergigante azulada que marca um dos pés de Órion.'],
    ['procyon','Procyon',7.6550,5.2250,0.34,11.5,'Cão Menor','Uma das estrelas mais próximas e brilhantes.'],
    ['achernar','Achernar',1.6286,-57.2367,0.46,139,'Erídano','Estrela azulada de rotação muito rápida.'],
    ['betelgeuse','Betelgeuse',5.9195,7.4070,0.50,550,'Órion','Supergigante vermelha com brilho variável.'],
    ['hadar','Hadar',14.0637,-60.3730,0.61,390,'Centauro','Estrela brilhante próxima ao Cruzeiro do Sul.'],
    ['acrux','Acrux',12.4433,-63.0991,0.76,320,'Cruzeiro do Sul','A estrela mais brilhante da constelação do Cruzeiro do Sul.'],
    ['altair','Altair',19.8464,8.8683,0.77,16.7,'Águia','Estrela próxima que integra o Triângulo de Verão.'],
    ['aldebaran','Aldebarã',4.5987,16.5093,0.85,65,'Touro','Gigante alaranjada que marca o olho do Touro.'],
    ['spica','Spica',13.4199,-11.1613,0.98,250,'Virgem','Sistema de estrelas azuis muito quentes.'],
    ['antares','Antares',16.4901,-26.4320,1.06,550,'Escorpião','Supergigante vermelha conhecida como o coração do Escorpião.'],
    ['pollux','Pólux',7.7553,28.0262,1.14,34,'Gêmeos','Gigante alaranjada na constelação de Gêmeos.'],
    ['fomalhaut','Fomalhaut',22.9608,-29.6222,1.16,25,'Peixe Austral','Estrela rodeada por um disco de detritos.'],
    ['deneb','Deneb',20.6905,45.2803,1.25,2600,'Cisne','Supergigante luminosa do Triângulo de Verão.'],
    ['mimosa','Mimosa',12.7953,-59.6888,1.25,280,'Cruzeiro do Sul','Estrela azul que marca um dos braços do Cruzeiro.'],
    ['regulus','Régulo',10.1395,11.9672,1.35,79,'Leão','Estrela brilhante da constelação de Leão.'],
    ['castor','Castor',7.5767,31.8883,1.60,51,'Gêmeos','Sistema estelar múltiplo visível como uma estrela.'],
    ['gacrux','Gacrux',12.5194,-57.1132,1.60,88,'Cruzeiro do Sul','Gigante vermelha na parte superior da cruz.'],
    ['shaula','Shaula',17.5601,-37.1038,1.62,570,'Escorpião','Estrela azulada próxima à cauda do Escorpião.'],
    ['bellatrix','Bellatrix',5.4189,6.3497,1.64,250,'Órion','Estrela que marca um dos ombros de Órion.'],
    ['elnath','Elnath',5.4382,28.6075,1.65,131,'Touro','Estrela azul na ponta de um dos chifres do Touro.'],
    ['alnilam','Alnilam',5.6036,-1.2019,1.69,2000,'Órion','Estrela central do cinturão de Órion.'],
    ['alnitak','Alnitak',5.6793,-1.9426,1.74,1260,'Órion','Uma das Três Marias, no cinturão de Órion.'],
    ['alnair','Alnair',22.1372,-46.9609,1.74,101,'Grou','Estrela brilhante do céu austral.'],
    ['alioth','Alioth',12.9005,55.9598,1.76,82,'Ursa Maior','Uma das estrelas do asterismo Grande Carro.'],
    ['dubhe','Dubhe',11.0621,61.7508,1.79,123,'Ursa Maior','Ajuda a apontar a direção da estrela Polar.'],
    ['kaus','Kaus Australis',18.4029,-34.3846,1.79,143,'Sagitário','Estrela brilhante que marca o arco de Sagitário.'],
    ['alkaid','Alkaid',13.7923,49.3133,1.86,104,'Ursa Maior','Estrela que marca a extremidade do Grande Carro.'],
    ['polaris','Polar',2.5303,89.2641,1.98,433,'Ursa Menor','Próxima do polo norte celeste, importante para orientação.'],
    ['saiph','Saiph',5.7959,-9.6696,2.06,720,'Órion','Marca um dos pés de Órion.'],
    ['kochab','Kochab',14.8451,74.1555,2.08,130,'Ursa Menor','Estrela alaranjada do céu norte.'],
    ['mizar','Mizar',13.3987,54.9254,2.23,83,'Ursa Maior','Famosa estrela dupla visual do Grande Carro.'],
    ['mintaka','Mintaka',5.5334,-0.2991,2.25,1200,'Órion','Uma das Três Marias, no cinturão de Órion.'],
    ['merak','Merak',11.0307,56.3824,2.37,79,'Ursa Maior','Uma das estrelas que apontam para a Polar.'],
    ['phecda','Phecda',11.8972,53.6948,2.40,83,'Ursa Maior','Estrela no corpo do asterismo Grande Carro.'],
    ['dschubba','Dschubba',16.0056,-22.6227,2.30,400,'Escorpião','Uma das estrelas da cabeça de Escorpião.'],
    ['megrez','Megrez',12.2571,57.0326,3.30,81,'Ursa Maior','Estrela que une a cauda ao corpo do Grande Carro.']
  ].map(([id, name, ra, dec, mag, distance, constellation, description]) => ({id,name,ra,dec,mag,distance,constellation,description,type:'estrela'}));

  const lines = [
    ['Órion', [['betelgeuse','bellatrix'],['bellatrix','mintaka'],['mintaka','alnilam'],['alnilam','alnitak'],['alnitak','betelgeuse'],['alnitak','saiph'],['saiph','rigel'],['rigel','mintaka']]],
    ['Cruzeiro do Sul', [['gacrux','acrux'],['mimosa','gacrux'],['mimosa','acrux']]],
    ['Ursa Maior', [['dubhe','merak'],['merak','phecda'],['phecda','megrez'],['megrez','alioth'],['alioth','mizar'],['mizar','alkaid'],['megrez','dubhe']]],
    ['Gêmeos', [['castor','pollux']]],
    ['Escorpião', [['dschubba','antares'],['antares','shaula']]]
  ];

  const deep = [
    {id:'m42',name:'Nebulosa de Órion',designation:'M42',kind:'Nebulosa de emissão',constellation:'Órion',distance:'~1.350 anos-luz',description:'Uma região de formação estelar, visível como uma pequena mancha difusa sob o cinturão de Órion em boas condições.',art:'nebula',source:'https://science.nasa.gov/universe/stars/',query:'Orion Nebula'},
    {id:'m31',name:'Galáxia de Andrômeda',designation:'M31',kind:'Galáxia espiral',constellation:'Andrômeda',distance:'~2,5 milhões de anos-luz',description:'A grande galáxia espiral vizinha da Via Láctea, perceptível a olho nu em céus escuros.',art:'galaxy',source:'https://science.nasa.gov/universe/galaxies/',query:'Andromeda Galaxy'},
    {id:'m45',name:'Plêiades',designation:'M45',kind:'Aglomerado aberto',constellation:'Touro',distance:'~440 anos-luz',description:'Aglomerado estelar jovem, famoso pelo agrupamento de estrelas azuladas.',art:'cluster',source:'https://science.nasa.gov/universe/stars/',query:'Pleiades'},
    {id:'m13',name:'Grande Aglomerado de Hércules',designation:'M13',kind:'Aglomerado globular',constellation:'Hércules',distance:'~22.000 anos-luz',description:'Concentração de centenas de milhares de estrelas gravitacionalmente associadas.',art:'globular',source:'https://science.nasa.gov/universe/stars/',query:'Messier 13'},
    {id:'m57',name:'Nebulosa do Anel',designation:'M57',kind:'Nebulosa planetária',constellation:'Lira',distance:'~2.500 anos-luz',description:'Camadas de gás ejetadas por uma estrela em uma fase avançada da evolução.',art:'ring',source:'https://science.nasa.gov/universe/stars/',query:'Ring Nebula'},
    {id:'ngc7293',name:'Nebulosa da Hélice',designation:'NGC 7293',kind:'Nebulosa planetária',constellation:'Aquário',distance:'~650 anos-luz',description:'Nebulosa planetária relativamente próxima, com estrutura complexa de gás em expansão.',art:'helix',source:'https://science.nasa.gov/universe/stars/',query:'Helix Nebula'}
  ].map(o => ({...o,type:'profundo'}));

  const meteorShowers = [
    {month:1,day:3,name:'Quadrântidas',period:'Início de janeiro',description:'Chuva de meteoros com pico geralmente breve; favorece observadores do hemisfério norte.'},
    {month:4,day:22,name:'Líridas',period:'Final de abril',description:'Meteoros associados a detritos do cometa Thatcher.'},
    {month:5,day:5,name:'Eta Aquáridas',period:'Início de maio',description:'Partículas associadas ao cometa Halley, frequentemente bem observáveis nos trópicos.'},
    {month:8,day:12,name:'Perseidas',period:'Meados de agosto',description:'Chuva de meteoros associada ao cometa Swift–Tuttle, mais favorável ao hemisfério norte.'},
    {month:10,day:21,name:'Oriônidas',period:'Segunda metade de outubro',description:'Outra chuva relacionada a material deixado pelo cometa Halley.'},
    {month:11,day:17,name:'Leônidas',period:'Meados de novembro',description:'Meteoros ligados ao cometa Tempel–Tuttle.'},
    {month:12,day:13,name:'Geminídeas',period:'Meados de dezembro',description:'Uma das chuvas anuais mais conhecidas; tem origem no asteroide 3200 Phaethon.'},
    {month:12,day:22,name:'Ursídeas',period:'Final de dezembro',description:'Chuva de meteoros tipicamente mais favorável a latitudes setentrionais.'}
  ];

  const locations = {
    salvador:{name:'Salvador, Brasil',lat:-12.9777,lon:-38.5016,tz:'America/Bahia'},
    saopaulo:{name:'São Paulo, Brasil',lat:-23.5505,lon:-46.6333,tz:'America/Sao_Paulo'},
    riodejaneiro:{name:'Rio de Janeiro, Brasil',lat:-22.9068,lon:-43.1729,tz:'America/Sao_Paulo'},
    recife:{name:'Recife, Brasil',lat:-8.0476,lon:-34.8770,tz:'America/Recife'},
    brasilia:{name:'Brasília, Brasil',lat:-15.7939,lon:-47.8828,tz:'America/Sao_Paulo'},
    portoalegre:{name:'Porto Alegre, Brasil',lat:-30.0346,lon:-51.2177,tz:'America/Sao_Paulo'},
    lisboa:{name:'Lisboa, Portugal',lat:38.7223,lon:-9.1393,tz:'Europe/Lisbon'},
    novayork:{name:'Nova York, EUA',lat:40.7128,lon:-74.0060,tz:'America/New_York'},
    toquio:{name:'Tóquio, Japão',lat:35.6762,lon:139.6503,tz:'Asia/Tokyo'}
  };

  const planets = [
    {name:'Mercúrio',body:'Mercury',color:'#d8c4ab'},
    {name:'Vênus',body:'Venus',color:'#ffe3b5'},
    {name:'Marte',body:'Mars',color:'#f7a687'},
    {name:'Júpiter',body:'Jupiter',color:'#ead5aa'},
    {name:'Saturno',body:'Saturn',color:'#f4ddb3'},
    {name:'Urano',body:'Uranus',color:'#b6edef'},
    {name:'Netuno',body:'Neptune',color:'#98b2ff'},
    {name:'Lua',body:'Moon',color:'#eaf3ff'}
  ];

  globalThis.NoctisData = {stars,lines,deep,meteorShowers,locations,planets};
})();
