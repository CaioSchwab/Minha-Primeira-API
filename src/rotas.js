const { Router } = require('express');

const senha = require('./intermediarios');

const controladores = require('./controladores/contas');

const rotas = Router();

rotas.get("/contas/saldo", controladores.saldo);
rotas.get("/contas/extrato", controladores.extrato);
rotas.post("/contas", controladores.criarConta);
rotas.put("/contas/:numeroConta/usuario", controladores.atualizarConta);
rotas.delete("/contas/:numeroConta", controladores.excluirConta);

rotas.post("/transacoes/depositar", controladores.deposito);
rotas.post("/transacoes/sacar", controladores.saque);
rotas.post("/transacoes/transferir", controladores.transferencia);

rotas.use(senha.intermediario);

rotas.get("/contas", controladores.listarContas); 

module.exports = rotas