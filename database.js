const Fs = require('fs');
const Bluebird = require('bluebird');
const FsAsync = Bluebird.promisifyAll(Fs);
const Classes = require('./classes');
class Database {
    constructor() {
        this.NOME_BANCO = 'Herois.json';
    }
    //Se o arquivo existir, vamos obter o arquivo com todos 
    //os itens e adicionar o nosso herói a lista de itens
    async cadastrar(heroiCadastrar) {
        //pegamos o heroi antigo, e precisamos adicionar caracteristica
        //que nesse momento é um MAGO e precisamos transformar ele
        //em 1
        //Por boa prática, não alteramos a instancia de um objeto,
        //Sempre criamos um objeto novo
        //Com o Object.assign , a partir de um objeto existente
        //criamos um novo, adicionando as propriedades que serão diferentes

        // 1-> param: Objeto Vazio, é o alvo onde tudo será armazenado
        // 2-> param: Objeto antigo
        // 3-> param: Propriedades que devem ser alteradas

        const heroi = Object.assign({}, heroiCadastrar, { classe: Classes[heroiCadastrar.classe] });

        //Para cadastra em arquivos, precisamos converter nosso objeto
        //para string
        if (Fs.existsSync(this.NOME_BANCO)) {
            const dados = await this.listar();
            dados.push(heroi);

            return await this.salvarArquivo(dados);
        }
        //Se não existir adiciona um array com o heroi na primeira posição
        await this.salvarArquivo([heroi]);
        // const result = await FsAsync.writeFileAsync(
        //     this.NOME_BANCO,
        //     JSON.stringify([heroi])
        // );

    }
    async salvarArquivo(dados) {
        const result = await FsAsync.writeFileAsync(this.NOME_BANCO, JSON.stringify(dados));
    }

    async listar() {
        //Recebemos os arquivos e retornamos a base completa
        const result = await FsAsync.readFileAsync(this.NOME_BANCO);
        //pega o buffer do arquivo e transforma no objeto javascript
        return JSON.parse(result);
    }

    async remover(nome) {
        const dados = await this.listar();
        //Usamos a função filter do JAVAScript
        //para filtrar itens do array
        //Trazemos todos os herois que não tenham esse nome
        const resultado = dados.filter(item => item.nome !== nome);
        await this.salvarArquivo(resultado);
    }

    async atualizar(nomeAntigo, heroi) {
        const dados = await this.listar();
        const item = dados.filter(heroi => heroi.nome === nomeAntigo);

        //MAP funciona como um for
        //Navega em cada item da lista até encontrar 
        const listaMapeada = item.map(heroiAntigo => {
            heroiAntigo.nome = heroi.nome;
            heroiAntigo.dataNascimento = heroi.dataNascimento;
            heroiAntigo.poder = heroi.poder;
            heroiAntigo.classe = heroi.classe;
            return heroiAntigo;
        });
        await this.remover(nomeAntigo);

        const promises = listaMapeada.map(itemMapeado => this.cadastrar
            (itemMapeado)
        );
        await Promise.all(promises);
    }



    async relatorioclasse() {
        const dados = await this.listar();
        let classes = {};
        //Entramos em cada chave da class classes
        //inicializamos as nossas caracteristicas locais 
        Object.keys(Classes).map(i => { classes[i] = 0; });

        dados.map(
            item => {
                const descricao = Object.keys(Classes)
                    .filter(key => Classes[key] === item.classe);
                const nomeClasse = descricao[0];
                console.log(nomeClasse);
                const classe = classes[nomeClasse];
                classes[nomeClasse] += 1;
            }
        );


        // async relatorioclasse(){
        //     const dados = await this.listar();
        //     let classes = {};
        //     dados.map(
        //         item => {
        //             const descricao = Object.keys(Classes) 
        //             .filter(key => Classes[key] === item.classe);
        //         const nomeClasse = descricao[0];
        //         console.log(nomeClasse);
        //         const classe = classes[nomeClasse]; 
        //         classes[nomeClasse] = classe ? classe +1 : 1;
        //         }
        //     );

        // async relatorioclasse(){
        //     const dados = await this.listar();
        //     let classes = {};
        //      dados.map(
        //         item => {
        //             const classe = classes[item.classe] 
        //             classes[item.classe] = classe ? classe +1 : 1;
        //         }
        //     );

        return classes;
    }
}

module.exports = Database;