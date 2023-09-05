const { format } = require('date-fns');
const pt = require('date-fns/locale/pt-BR');

const contas = require('../bancoDeDados/bancodedados');

const listarContas = (req, res) => {
    return res.status(200).json(contas.contas);
};

const criarConta = (req, res) => {
    const {
        nome,
        cpf,
        data_nascimento,
        telefone,
        email,
        senha
    } = req.body

    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({ mensagem: "Preencha os campos: nome, cpf, data_nascimento, telefone, email e senha. Pois são obrigatórios!" })
    };

    if (nome.trim() === '' || cpf.trim() === '' || data_nascimento.trim() === '' || telefone.trim() === '' || email.trim() === '' || senha.trim() === '') {
        return res.status(400).json({ mensagem: 'Os campos de texto não podem ter espaços vazios em volta dos textos!.' });
    };

    if (cpf.length !== 11) {
        return res.status(400).json({ mensagem: "Cpf inválido!" });
    }

    for (let i = 0; i < contas.contas.length; i++) {
        if (contas.contas[i].usuario.cpf === cpf || contas.contas[i].usuario.email === email) {
            return res.status(400).json({ mensagem: "Já existe uma conta com o cpf ou e-mail informado!"
        });
        }
    }

    let id 


    if (contas.contas.length === 0) {
        id = 1
    } else if (contas.contas.length === 1) {
        id = 2
    } else {
        id = contas.contas.length + 1
    }


    const novaConta = {
        numero_conta: id,
        saldo: 0,
        usuario: {
            nome,
            cpf,
            data_nascimento,
            telefone,
            email,
            senha
        }
    };

    contas.contas.push(novaConta);

    return res.status(204).send();
};

const atualizarConta = (req, res) => {
    const { numeroConta } = req.params

    if (!numeroConta) {
        return res.status(400).json({ mensagem: `Numero da conta não encontrado` })
    };

    const { nome, cpf, data_nascimento, telefone, email, senha } = req.body


    if (!nome || !cpf || !data_nascimento || !telefone || !email || !senha) {
        return res.status(400).json({ mensagem: "Preencha os campos: nome, cpf, data_nascimento, telefone, email e senha. Pois são obrigatórios!" });
    };

    if (nome.trim() === '' || cpf.trim() === '' || data_nascimento.trim() === '' || telefone.trim() === '' || email.trim() === '' || senha.trim() === '') {
        return res.status(400).json({ mensagem: 'Os campos de texto não podem ter espaços vazios em volta dos textos!.' });
    };

    if (cpf.length !== 11) {
        return res.status(400).json({ mensagem: "Cpf inválido!" });
    };

    const outrasContas = contas.contas.filter((conta) => {
        return conta.numero_conta !== Number(numeroConta) 
    });

    for (let i = 0; i < outrasContas.length; i++) {
        if (outrasContas[i].usuario.cpf === cpf) {
            return res.status(400).json({ mensagem: "O CPF informado já existe no cadastro!"
        });
        }
    };

    for (let i = 0; i < outrasContas.length; i++) {
        if (outrasContas[i].usuario.email === email) {
            return res.status(400).json({ mensagem: "O EMAIL informado já existe no cadastro!"
        });
        }
    };

    const conta = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numeroConta)
    });
    
    if (!conta) {
        return res.status(404).json({ mensagem: `Conta não encontrada` })
    };

    conta.usuario.nome = nome
    conta.usuario.cpf = cpf
    conta.usuario.data_nascimento = data_nascimento
    conta.usuario.telefone = telefone
    conta.usuario.email = email
    conta.usuario.senha = senha

    return res.status(204).send();
};

const excluirConta = (req, res) => {
    const { numeroConta } = req.params

    if (!numeroConta) {
        return res.status(400).json({ mensagem: `Numero da conta não encontrado` })
    };

    const conta = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numeroConta)
    });

    if (!conta) {
        return res.status(404).json({ mensagem: "A conta referente ao 'numero_conta' passado não existe em nosso banco de dados!" })
    };

    if (conta.saldo !== 0) {
        return res.status(403).json({ mensagem: "A conta só pode ser removida se o saldo for zero!" })
    };

    const indiceConta = contas.contas.indexOf(conta);

    contas.contas.splice(indiceConta, 1);

    return res.status(204).send();
};

const deposito = (req, res) => {
    const { numero_conta, valor } = req.body

    if (!numero_conta || !valor ) {
        return res.status(400).json({ mensagem: "O número da conta e o valor são obrigatórios!" })
    };

    const conta = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numero_conta)
    });

    if (!conta) {
        return res.status(404).json({ mensagem: `Conta não encontrada` })
    };

    conta.saldo += valor

    const data = format(new Date(), "yyyy-LL-dd hh:mm:ss", { locale: pt });

    const historicoDeposito = {
        data,
        numero_conta,
        valor
    };

    contas.depositos.push(historicoDeposito);

    return res.status(204).send()
};

const saque = (req, res) => {
    const { numero_conta, valor, senha } = req.body

    if (!numero_conta || !valor || !senha) {
        return res.status(400).json({ mensagem: "O número da conta o valor e a senha são obrigatórios!" })
    };

    const conta = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numero_conta)
    });

    if (!conta) {
        return res.status(404).json({ mensagem: `Conta não encontrada` })
    };

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: "A senha da conta informada é inválida!" })
    };

    if (valor < 0) {
            return res.status(400).json({ mensagem: "O valor não pode ser menor que zero!" })
    };

    if (valor > conta.saldo) {
        return res.status(400).json({ mensagem: "Saldo insuficiente!"})
    };
    

    conta.saldo -= valor

    const data = format(new Date(), "yyyy-LL-dd hh:mm:ss", { locale: pt });

    const historicoSaque = {
        data,
        numero_conta,
        valor
    };

    contas.saques.push(historicoSaque);

    return res.status(204).json()
};

const transferencia = (req, res) => {
    const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body

    if (!numero_conta_origem || !numero_conta_destino || !valor || !senha) {
        return res.status(400).json({ mensagem: "Preencha os campos: numero_conta_origem, numero_conta_destino, valor e senha. Pois são obrigatórios!" })
    };

    const contaOrigem = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numero_conta_origem)
    });

    if (!contaOrigem) {
        return res.status(404).json({ mensagem: "Conta bancaria de origem não encontrada!" })
    };

    const contaDestino = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numero_conta_destino)
    });

    if (!contaDestino) {
        return res.status(404).json({ mensagem: "Conta bancaria de destino não encontrada!" })
    };

    if (senha !== contaOrigem.usuario.senha) {
        return res.status(401).json({ mensagem: "A senha da conta de origem informada é inválida!" })
    };

    if (valor < 0) {
        return res.status(400).json({ mensagem: "O valor não pode ser menor que zero!" })
    };
    
    if (valor > contaOrigem.saldo) {
        return res.status(400).json({ mensagem: "Saldo insuficiente para a transferência!"})
    };

    contaOrigem.saldo -= valor
    contaDestino.saldo += valor

    const data = format(new Date(), "yyyy-LL-dd hh:mm:ss", { locale: pt });

    const historicoTransferencia = {
        data,
        numero_conta_origem,
        numero_conta_destino,
        valor
    };

    contas.transferencias.push(historicoTransferencia);

    return res.status(204).send()
};

const saldo = (req, res) => {
    const {numero_conta, senha} = req.query

    if (!numero_conta|| !senha) {
        return res.status(400).json({ mensagem: "O número da conta e a senha são obrigatórios!" })
    };

    const conta = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numero_conta)
    });

    if (!conta) {
        return res.status(404).json({ mensagem: "Conta bancária não encontada!" })
    };

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: "A senha da conta informada é inválida!" })
    };

    const saldo = {
        saldo: conta.saldo
    }

    return res.status(200).json(saldo)
};

const extrato = (req, res) => {
    const {numero_conta, senha} = req.query

    if (!numero_conta|| !senha) {
        return res.status(400).json({ mensagem: "O número da conta e a senha são obrigatórios!" })
    };

    const conta = contas.contas.find((conta) => {
        return conta.numero_conta === Number(numero_conta)
    });

    if (!conta) {
        return res.status(404).json({ mensagem: "Conta bancária não encontada!" })
    };

    if (senha !== conta.usuario.senha) {
        return res.status(401).json({ mensagem: "A senha da conta informada é inválida!" })
    };

    const saques = contas.saques.filter((saque) => {
        return saque.numero_conta === Number(numero_conta)
    });

    const depositos = contas.depositos.filter((deposito) => {
        return deposito.numero_conta === Number(numero_conta)
    });

    const transferenciasEnviadas = contas.transferencias.filter((deposito) => {
        return deposito.numero_conta_origem === Number(numero_conta)
    });
    
    const transferenciasRecebidas = contas.transferencias.filter((deposito) => {
        return deposito.numero_conta_destino === Number(numero_conta)
    });

    const extrato = {
        depositos,
        saques,
        transferenciasEnviadas,
        transferenciasRecebidas
    }

    return res.status(200).json(extrato)
};

module.exports = {
    listarContas,
    criarConta,
    atualizarConta,
    excluirConta,
    deposito,
    saque,
    transferencia,
    saldo,
    extrato
}