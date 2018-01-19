#!/usr/bin/env node
const Sequelize = require('sequelize');
const Heroi = require('./heroi');
//const sql = require('mssql/msnodesqlv8');


//importando o Sequelize, para manipular os dados do SQL server
//const Sequelize = require('sequelize');
//const sql = require('mssql/msnodesqlv8');
/*const conexao = {
    db: 'ImersaoNudesJS',
   // username: '',
    //password: ''
};*/

/*const ImersaoNudesJS = new Sequelize(
    conexao.db,
    //conexao.username,
    //conexao.password,
    {
        dialect: 'mssql',
        host: 'HOME',
        port: 1433,
        logging:false,
        dialectOptions:{
            requestTimeout: 3000,//timeout = 30 segundos
        },
    },
);*/
/*
let ImersaoNudesJS = new Sequelize({
    dialect: 'mssql',
    dialectModulePath: 'sequelize-msnodesqlv8',
    dialectOptions: {
      driver: 'SQL Server Native Client 11.0',
      instanceName: 'HOME',
      trustedConnection: true
    },
    host: 'localhost',
    database: 'ImersaoNudesJS'
  });*/


//ImersaoNudesJS.sync({ force: true })
//HeroModel.hasMany();


//definimos uma função para inicializar nossas tabelas no banco de dados
//caso não aguardar o sync do framework terminar de sincronizar
// vai dar xabu

class DatabaseSQL {
    constructor() {
        this.ImersaoNudesJS = {};
        this.HeroModel = {};
    }
    async conectar() {
        // pegamos a url do BANO NO Heroku
        // caso estejamos em local ele pega a string e conecta com o banco
        // caso esteja em produção, ele pega a url que vem do heroku
        // importante a banco_url poder mudar a qualquer momento
        // pois quem define é o proprio heroku
        //database_url -> heroku
        //banco_url -> nosso banco local

        //Definimos no .env.prod que a url vai vir do heroku 
        //1o DATABASE_URL = qualquer coisa
        //2o passo DATABASE_URL = url definidada do heroku
        const herokuPostgres = process.env.DATABASE_URL;
        //const herokuPostgres = 'postgres://gpvlucdtcjcksq:049a1ac611e6c3c39064540ad5a02bf014a3bfcafa1f95f4584a7c44ed2cde15@ec2-54-197-233-123.compute-1.amazonaws.com:5432/ddbtgigrvl401e';
        //definiimos as configurações da BAse de dados
        this.ImersaoNudesJS = new Sequelize(
            herokuPostgres,
            {
                dialect: 'postgres',
                dialectOptions: {
                    ssl: true,
                    requestTimeout: 30000, // timeout = 30 seconds
                },
            },
        );
        await this.definirModelo();
    }
    async definirModelo() {
        this.HeroModel = this.ImersaoNudesJS.define('Heroes', {
            ID: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            NOME: Sequelize.STRING,
            PODER: Sequelize.STRING,
            CLASSE_ID: Sequelize.INTEGER,
            DATA_NASCIMENTO: Sequelize.DATE,
        });
        this.ClasseModel = this.ImersaoNudesJS.define('Classes', {
            ID: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            DESCRICAO: {
                type: Sequelize.STRING,
                required: true,
            }
        });
        //fazemos o relacionamento entre as tabelas
        //adicionando o Classe do Heroi
        this.HeroModel.hasMany(this.ClasseModel);
        //com o sync mapeamos e criamos as tabelas caso elas não existam

        await this.HeroModel.sync({ force: true })
        await this.ClasseModel.sync({ force: true })

        await this.ClasseModel.create({
            DESCRICAO: 'warrior'
        });
        await this.ClasseModel.create({
            DESCRICAO: 'mago'
        });
        await this.ClasseModel.create({
            DESCRICAO: 'rogue'
        });
        await this.ClasseModel.create({
            DESCRICAO: 'archer'
        });

    }

    async cadastrar(hero) {
        //Usamos a tecnica
        const { ID } = await this.pesquisarClasse(hero.classe);

        const result = await this.HeroModel.create
            ({
                NOME: hero.nome,
                PODER: hero.poder,
                CLASSE_ID: ID,
                DATA_NASCIMENTO: hero.dataNascimento,
            });
        return result;
    }
    async pesquisarClasse(descricao) {
        //Pesquisamos a classe pela descrição, para pesquisar e obter o id do banco
        const result = await this.ClasseModel.findOne({
            where: { DESCRICAO: descricao },
        });
        return result.get({ plain: true });
    }
    async listarHerois() {
        //Carregamos todos os nossos herois
        //O findall recebe alguns parametros
        //{where:NOME:'Erick'} -> similar ao where do banco de dados
        //passamos o plain true para trazer os dados do objeto
        //iteramos em cada objeto,
        //extraimos soomente os dados que precisamos

        const result = await this.HeroModel.findAll().map(item => {
            //extraimos os objetos que precisamos
            const { ID, NOME, PODER, CLASSE_ID, DATA_NASCIMENTO } = item;
            //se o nome da chave for igual a do valor
            //const heroi = { ID, NOME, PODER, CLASSE_ID, DATA_NASCIMENTO };
            const heroi = {
                id: ID,
                nome: NOME,
                poder: PODER,
                classe: CLASSE_ID,
                data: DATA_NASCIMENTO
            };

            const heroiMapeado = new Heroi(heroi);
            return heroiMapeado;
        });

        return result;
    }

    async remover(nome) {
        const result = await this.HeroModel.destroy({ where: { NOME: nome } });
        return result;
    }

    async atualizar(nomeAntigo, hero) {
        //Para fazer update passamos dois parametros
        // 1-> Os campos que precisam ser alterados
        // 2-> QUERY(WHERE ATUALIZAR)
        const result = await this.HeroModel.update(
            {
                NOME: hero.nome,
                DATA_NASCIMENTO: hero.data
            },
            {
                where: { NOME: nomeAntigo },
                returning: true,
                plain: true
            });
        return result;
    }
}

module.exports = DatabaseSQL;