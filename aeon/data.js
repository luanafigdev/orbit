export const eras = [
  {
    id: 'origem', index: '01', name: 'A Origem', period: 'HÁ CERCA DE 13,8 BILHÕES DE ANOS',
    chapter: 'Tudo começa em transformação.',
    lead: 'Antes das estrelas, havia um cosmos extremamente quente e denso. A expansão e o resfriamento tornaram possíveis as primeiras partículas e os núcleos dos elementos mais leves.',
    detail: 'O modelo do Big Bang descreve a evolução inicial do Universo, não uma explosão num ponto do espaço. Nas primeiras etapas, a matéria e a radiação se transformaram rapidamente. Cerca de 380 mil anos depois, a formação de átomos permitiu que a luz viajasse mais livremente.',
    fact: 'O fundo cósmico de micro-ondas é uma das evidências mais importantes dessa história.',
    label: 'MATÉRIA PRIMORDIAL', metric: '≈ 380 mil anos', metricLabel: 'até a recombinação',
    controls: [{type:'range',id:'density',title:'Intensidade primordial',min:10,max:100,value:66,unit:'%'}]
  },
  {
    id: 'aurora', index: '02', name: 'A Aurora Estelar', period: 'NAS PRIMEIRAS CENTENAS DE MILHÕES DE ANOS',
    chapter: 'A escuridão conheceu a luz.',
    lead: 'A gravidade reuniu nuvens de gás. Depois de uma longa era escura, as primeiras estrelas iluminaram o cosmos e começaram a transformar sua composição.',
    detail: 'A época exata do nascimento das primeiras estrelas ainda é estudada. Sua radiação contribuiu para a reionização do gás entre as galáxias, processo que avançou ao longo de centenas de milhões de anos.',
    fact: 'A aurora cósmica antecedeu a formação das grandes estruturas que vemos hoje.',
    label: 'PRIMEIRAS FONTES DE LUZ', metric: '≈ 200–400 milhões', metricLabel: 'de anos após o início · referência aproximada',
    controls: [{type:'range',id:'birth',title:'Nascimento estelar',min:15,max:100,value:70,unit:'%'},{type:'action',id:'spark',title:'Acender o céu'}]
  },
  {
    id: 'teia', index: '03', name: 'A Teia Cósmica', period: 'BILHÕES DE ANOS DE EVOLUÇÃO',
    chapter: 'O Universo aprende a se organizar.',
    lead: 'A gravidade amplia pequenas diferenças de densidade, reunindo matéria em filamentos, aglomerados e galáxias. No espaço entre eles, vastas regiões quase vazias.',
    detail: 'A estrutura em grande escala do Universo forma uma rede de filamentos e vazios. As imagens aqui são representações artísticas procedurais, não um mapa de dados observacionais.',
    fact: 'Os padrões cósmicos resultam de uma longa evolução gravitacional.',
    label: 'ESTRUTURAS EM ESCALA', metric: 'Bilhões de anos', metricLabel: 'de crescimento e transformação',
    controls: [{type:'range',id:'web',title:'Conexões visíveis',min:10,max:100,value:72,unit:'%'},{type:'action',id:'fly',title:'Atravessar os filamentos'}]
  },
  {
    id: 'forja', index: '04', name: 'A Forja Cósmica', period: 'GERAÇÕES DE ESTRELAS',
    chapter: 'Somos feitos de transformações.',
    lead: 'Nas estrelas, a fusão nuclear produz elementos mais pesados. Outros processos, incluindo explosões estelares e colisões de objetos compactos, enriquecem o meio interestelar.',
    detail: 'O hidrogênio e a maior parte do hélio surgiram cedo na história cósmica. Carbono e oxigênio podem ser produzidos nas estrelas; parte do ferro e muitos elementos mais pesados dependem de processos astrofísicos adicionais. Não existe uma única estrela responsável por todos os elementos.',
    fact: 'A matéria que forma novos sistemas carrega a história de gerações anteriores.',
    label: 'ELEMENTO EM DESTAQUE', metric: 'Carbono', metricLabel: 'forjado em estrelas',
    controls: [{type:'elements',id:'element',title:'Siga a matéria'}]
  },
  {
    id: 'luz', index: '05', name: 'Luz em Trânsito', period: 'A DISTÂNCIA TAMBÉM É TEMPO',
    chapter: 'O passado ainda nos alcança.',
    lead: 'Olhar para longe é receber luz que saiu de sua origem há muito tempo. Em escalas cósmicas, o presente chega até nós acompanhado de histórias antigas.',
    detail: 'Um ano-luz mede distância: é o caminho percorrido pela luz no vácuo durante um ano. Para objetos cosmologicamente distantes, a expansão do Universo torna o cálculo da viagem da luz mais complexo. Este painel usa uma equivalência didática simplificada.',
    fact: 'A luz que vemos agora não precisa ter partido agora.',
    label: 'TEMPO DE VIAGEM · MODELO SIMPLES', metric: '120 milhões de anos', metricLabel: 'para 120 milhões de anos-luz',
    controls: [{type:'range',id:'distance',title:'Distância ilustrativa',min:1,max:800,value:120,unit:'M al'},{type:'action',id:'photon',title:'Enviar um pulso de luz'},{type:'action',id:'late',title:'Abrir Luz Tardia'}]
  },
  {
    id: 'futuros', index: '06', name: 'Futuros Possíveis', period: 'ALÉM DO NOSSO PRESENTE',
    chapter: 'O tempo continua.',
    lead: 'As estrelas têm ciclos de vida. A expansão cósmica altera as distâncias entre grandes estruturas. O futuro distante depende de propriedades do Universo que ainda investigamos.',
    detail: 'Uma expansão acelerada prolongada pode levar a um Universo cada vez mais frio e rarefeito. Há hipóteses alternativas para a evolução futura da energia escura. As cenas apresentam possibilidades de forma ilustrativa, não previsões observacionais exatas.',
    fact: 'O destino do cosmos permanece uma questão científica aberta.',
    label: 'CENÁRIO ILUSTRADO', metric: 'Expansão contínua', metricLabel: 'hipótese, não certeza',
    controls: [{type:'scenario',id:'scenario',title:'Qual futuro explorar?'}]
  }
];

export const elements = [
  {symbol:'H',name:'Hidrogênio',kind:'Origem primordial',tone:'#9bd2ff',description:'Formado nas etapas iniciais do Universo.'},
  {symbol:'He',name:'Hélio',kind:'Origem primordial e fusão estelar',tone:'#c6b2ff',description:'Grande parte surgiu cedo; também é produzido pela fusão do hidrogênio nas estrelas.'},
  {symbol:'C',name:'Carbono',kind:'Nucleossíntese estelar',tone:'#ffbd9a',description:'Produzido em estrelas por processos de fusão de hélio.'},
  {symbol:'O',name:'Oxigênio',kind:'Nucleossíntese estelar',tone:'#c5d9ef',description:'Produzido principalmente no interior de estrelas massivas.'},
  {symbol:'Fe',name:'Ferro',kind:'Evolução e explosões estelares',tone:'#ffc97b',description:'Sua origem cósmica envolve processos em estrelas evoluídas e supernovas.'}
];

export const references = [
  {label:'NASA · História e evolução do Universo',url:'https://science.nasa.gov/universe/overview/'},
  {label:'NASA · Primeiras estrelas',url:'https://science.nasa.gov/asset/webb/first-stars-timeline-of-the-universe/'},
  {label:'NASA · Energia escura e futuro cósmico',url:'https://science.nasa.gov/dark-energy/'}
];
