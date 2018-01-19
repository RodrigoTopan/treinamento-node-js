// instalamos o Heroku tollbelt, para manipular aplicações Web
// heroku login - para logar,
// heroku apps - para ver aplicoes,
// heroku apps:create nome-do-app
// heroku apps:delete nome-do-app
// heroku logs - log da aplicaçÃo

// ---- Publicando aplicação
// 1o criar o projeto git, git init na pasta
// caso esquecer de iniar o projeto, precisa linkar a aplicação
// 2o criar o .gitignore, que são que não versionaremos
// > .gitignore recebe o node_modules (nunca versione o node_modules)
// heroku apps:create nome-do-app -> adicionar o endereco do heroku no seu git
// 3o Criar o Procfile -> arquivo que informa como nossa aplicação será executada
//executar
// 4O git add . && git commit -m "primeiro commit" && git push heroku master




//adicionamos no package.json
//dois scripts
// 1 start -> para rodar nonodemon em ambiente dev
// 2 prod -> para rodar com node_env production
// 3 preinstall -> para instalar as dependecias globais antes de instalar as dependencias do projeto
//Se esquecer o Heroku não vai saber que é o pm2
//


//no terminal
//npm start => start, test são default do npm , então só escrevemos esse comando
//nom rund prod => prod,prod não é default, então precisamos adicionar o RUN para executar

//instalamos o pm2
//para gerenciar nossa aplicação
// precisou escalar (subir 10 novas instancias)
//precisou verificar quantto está gastande de memoria
//usa o PM2(nodemon é debug, nodemon é o kct)
// pm2 start api.js -i 10 --name api-herois
//instancias
// pm2 keymetrics => plano pago(mas usar um de gratis)
// para gerenciar aplicações a partir da web
// deu excerção -> dispara email sozinho
// da pra gerenciar memoria, gerenciar disco



// Para subir instancias de nossas aplicação passamos o -i com a quantiade de instancias
//pm2 para ambiente de produção
//npm i -g pm2
//pm2 start api.js --name api-herois
// -> listar processos: pm2 list
// -> monitor api especifica : pm2 monit id (0)
// -> pm2 dash
// -> pm2 restart 0
// -> pm2 stop 0
// -> pm2 kill = mata todos os processos
// -> pm2 logs 0 

/* Para adicionar o pm2 em produção
    precisamos manter a aplicação ativa, pois o servidor pensa que
    aplicações em segundo plano, não estão rodando
    para rodar em produção precismaos executar o comando abaixo
    pm2-docker api.js --name api-herois
*/

//nodemon para testes
//instalamos o nodemon npm i -g nodemon para qualquer alteração ele fazer o restart automático
// para executar nodemon api.js
// INSTALAMOS O HAPI JS NA VERSAO 15
// npm i --save hapi@15
//Hapi é o responsável por cuidar das rotas
//das nossas apis


//instalamos o joi para validar os objetos na requisição
//npm i --save joi

//Para trabalhar com JWT instalamos dois pacotes 
//abstração do Hapi para web -> hapi -auth-jwt2
//json web token -> jsonwebtoken;
//npm i --save jsonwebtoken hapi-auth-jwt2;




/*
    Toda vez que precisar obter dados GET -> /users
    Toda vez que precisar obter um item GET -> /users/id
    Precisou cadastrar POST /users
    Remover itens DELETE /users/id
    Atualizar PATH ou PUT /users/id
    
*/

//Para rodar em ambiente de dev
//nodemon api.js
//para rodar em prod
// NODE_ENV=production nodemon api.js
//npm i --save dotenv
const { config } = require('dotenv');
if (process.env.NODE_ENV === 'production') config({ path: 'config/.env.prod' });
else config({ path: 'config/.env.dev' });



const Hapi = require('hapi');
const Database = require('./databaseSQL');
const Joi = require('joi');

/*
    Para documentar nossas apis a partir do código 
    já existente, não precisa gerar aquele Doc antigo
    fica muito mais  simples, com o proprio plugin
    Vision e Inert => responsáveis por gerar o HTML e a página Web da documentação
    automaticamente
    e o hapi-swagger por verificar as rotar e gerar o arquivo de documentação
*/
const Vision = require('vision');
const Inert = require('inert');
const HapiSwagger = require('hapi-swagger');


/*
    3 passos para o Swagger
    1 registrar os plugins
    2 informar nas rotas a descrição daquele endpoint(url)
*/

const databaseSQL = new Database();

const USUARIO_VALIDO = {
    username: 'Rodrigo',
    password: '123',
};
const SECRET_KEY = process.env.SECRET_KEY;
const ID_TOKEN = process.env.ID_TOKEN;
const HapiJwt = require('hapi-auth-jwt2');
const Jwt = require('jsonwebtoken');

//inicializamos o nosso servidor WEB
const app = new Hapi.Server();
//definimos a porta
app.connection({ port: process.env.PORT });

async function registrarRotas() {
    try {
        await databaseSQL.conectar();
        app.route([
            {
                //definir o caminho da url localhost:3000/heroes
                path: '/login',
                //definir o method http
                method: 'POST',
                //Para desabilitar o jwt
                config: {
                    auth: false,
                    description: 'Rota para gerar token, a partir de login e senha',
                    notes: 'Token para acessar outras apis',
                    tags: ['api'],
                    validate: {
                        payload: {
                            username: Joi.string().required(),
                            password: Joi.string().required(),
                        }
                    },
                    handler: (req, reply) => {
                        try {
                            const loginSenha = req.payload;
                            //Aqui seria o momento de valiar
                            //database.login() caso fosse um usuario valido
                            //ai sim, voce gera o token e deixa ele passar
                            if (
                                !(loginSenha.username === USUARIO_VALIDO.username &&
                                    loginSenha.password === USUARIO_VALIDO.password)
                            )

                                return reply('Usuario ou senha, inválidos');

                            const { username } = loginSenha;

                            const token = Jwt.sign({ username, idToken: ID_TOKEN }, SECRET_KEY);

                            return reply({ token });
                        } catch (e) {
                            console.log('deu ruim', e);
                            return reply('DEU RUIM');
                        }
                    }
                },
            },
            {
                //definir o caminho da url localhost:3000/heroes
                path: '/heroes',
                //definir o method http
                method: 'GET',
                config: {
                    auth: 'jwt',
                    description: 'Retorna todos os herois do sistema',
                    notes: 'Retorna herois',
                    tags: ['api'],
                    validate: {
                        headers: Joi.object({
                            authorization: Joi.string().required(),
                        }).unknown(),
                    },


                    // O handler é parecido com uma controller
                    //quando um usuario chamar a url especificada,
                    //ele é o responsável por retornar informações
                    handler: async (req, reply) => {
                        try {
                            const result = await databaseSQL.listarHerois();
                            return reply(result);
                        } catch (e) {
                            console.log('deu ruim', e);
                            return reply('DEU RUIM');
                        }
                    }
                }
            },
            {

                path: '/heroes',
                method: 'POST',
                config: {
                    description: 'Rota para cadastrar heróis',
                    notes: 'Cadastrar herois',
                    tags: ['api'],
                    auth: 'jwt',
                    //criamos uma validação para a requisição
                    validate: {
                        //informamos o que queremos validar
                        // query -> url?nome=123 querystring
                        //payload -> corpo da requisição
                        //params /id que vem na url
                        payload: {
                            nome: Joi.string()
                                .max(20)
                                .min(2)
                                .required(),
                            dataNascimento: Joi.date().required(),
                            poder: Joi.string().required(),
                            classe: Joi.string().default('warrior').required(),
                        },
                        headers: Joi.object({
                            authorization: Joi.string().required(),
                        }).unknown(),
                    },
                    handler: async (req, reply) => {
                        try {
                            //PARA RECEBER OS DADOS VIA CORPO DA REQUISIÇÃO 
                            // USAMOS O OBJETO PAYLOAD DA REQUISIÇÃO 
                            const dados = req.payload;
                            const result = await databaseSQL.cadastrar(dados);
                            return reply(result);
                        } catch (e) {
                            console.log('deu ruim', e);
                            return reply('DEU RUIM');
                        }
                    }
                }
            },
            {
                path: '/heroes/{id}',
                method: 'DELETE',
                config: {
                    auth: 'jwt',
                    description: 'Rota para deletar herois por nome',
                    notes: 'Deleta por nome um heroi',
                    tags: ['api'],
                    validate: {
                        params: {
                            id: Joi.string().required(),
                        },
                        headers: Joi.object({
                            authorization: Joi.string().required(),
                        }).unknown(),
                    },
                    handler: async (req, reply) => {
                        try {
                            const id = req.params.id;
                            const result = await databaseSQL.remover(id);
                            return reply(result);
                        } catch (e) {
                            console.log('deu ruim', e);
                            return reply('DEU RUIM');
                        }
                    }
                },
            },
            {
                path: '/heroes/{id}',
                method: 'PUT',
                config: {
                    auth: 'jwt',
                    description: 'Rota para alterar heróis por nome',
                    notes: 'Token para alterar registro de herói',
                    tags: ['api'],
                    validate: {
                        params: {
                            id: Joi.string().required(),
                        },
                        payload: {
                            nome: Joi.string()
                                .max(20)
                                .min(2)
                                .required(),
                            dataNascimento: Joi.date().required(),
                            poder: Joi.string().required(),
                            classe: Joi.string().required()
                        },
                        headers: Joi.object({
                            authorization: Joi.string().required(),
                        }).unknown(),
                    },
                    handler: async (req, reply) => {
                        try {
                            const dados = req.payload;
                            const id = req.params.id;
                            const result = await databaseSQL.atualizar(id, dados);
                            return reply(result);
                        } catch (e) {
                            console.log('deu ruim', e);
                            return reply('DEU RUIM');
                        }
                    }
                }
            },
        ]);
    } catch (e) {
        console.error('DEU RUIM', e);
    }
}

app.register([
    //registramos o plugin de auth
    HapiJwt,
    //Registramos os plugins para trabalhar com o SWAGGER
    Inert,
    Vision,
    {
        register: HapiSwagger,
        options: { info: { title: 'API de Heróis', version: '1.0' } }
    }])
    .then(_ => {
        // configuramos a estratégia de autenticação
        //passamos um nome que será usado em cada rota
        //e no objeto validate, validamos se o token é valido
        app.auth.strategy('jwt', 'jwt', {
            secret: SECRET_KEY,
            verifyFunc: (decoded, request, callback) => {
                if (decoded.idToken !== ID_TOKEN) return callback(null, false);
                //ESSE MÉTODO É INVOCADO CADA VEZ QUE USAR O TOKEN
                // E NO OBJETO VALIDATE, VALIDAMOS SE O TOKEN É VALIDO
                return callback(null, true);
            },
            //ALGORITMO DE AUTENTICAÇÃO HASH
            verifyOptions: { algorithms: ['HS256'] }
        });
        //setamos o jwt como default obrigatório
        app.auth.default('jwt');
    }).then(registrarRotas).then(_ => {
        app.start(() => console.log(`Servidor rodando na porta ${process.env.PORT}`));
    });

//para definir o endereço que o cliente vai trabalhar com a sua api 
//definimos as rotas
