# 🤖 Bot API

API para execução automatizada de robôs de coleta de dados em sites específicos, como **Crefisa**.\
A estrutura foi projetada para ser **modular e escalável**, permitindo a adição de novos bots conforme necessário.

---

## 🗂️ Estrutura de Pastas

src/\
&#x20;├── routes/&#x20;

│      └── bots/&#x20;

│      ├── crefisa.js # Rota do bot da Crefisa&#x20;

│      └── itau.js # Exemplo de futura expansão

&#x20;├── services/

&#x20;│      └── crefisa.js # Lógica principal do bot Crefisa

├── index.js # Inicialização do servidor Express\
\
## 🔗 Endpoint

### `POST /bot/crefisa`

Roda o bot da Crefisa, que realiza login e download de arquivos associados a um cliente.



#### &#x20;📍 URL

````https://bot-api-wrjw.onrender.com/bot/crefisa````



#### 🧾 Método

`POST`



#### 🧠 Body (JSON)

```
{
  "cpf": "39972402649",
  "clientName": "Marvitor de Souza Lopes",
  "benefitNumber": "2142053992"
}
```

&#x20;&#x20;



#### Respostas

✅ **Sucesso – 200 OK**

```
{
  {
    "Número do benefício": "0123456789",
    "CPF do beneficiário": "123.456.789-10",
    "Data de Nascimento": "01/01/1900",
    "Nome do beneficiário": "Fulano da Silva",
    "Situação do Benefício": "0 - ATIVO",
    "Espécie do Benefício": "00 - Aposentadoria por idade",
    "Benefício concedido por liminar": "Não",
    "Data de Cessação do Benefício – DCB": "",
    "UF de Pagamento": "MG",
    "Tipo de crédito (Cartão Magnético ou Conta-Corrente)": "2 - Conta corrente",
    "CBC da IF Pagadora": "000",
    "Agência da Pagadora": "1234",
    "Conta-corrente onde o benefício é pago": "123456789-1",
    "Classificador da Pensão alimentícia": "0 - Sem PA",
    "Possui representante legal": "Não",
    "Possui procurador": "Não",
    "Possui entidade de representação (não permite averbação)": "Não",
    "Benefício bloqueado para empréstimo": "Não",
    "Data da última Perícia Médica": "",
    "Data do Despacho do Benefício - DDB": "01/01/1900",
    "Valor da margem disponível": "111,11",
    "Valor da margem disponível para cartão": "111,11",
    "Valor do limite de cartão": "1.111,11",
    "Valor da margem disponível para cartão benefício": "111,11",
    "Valor do limite de cartão benefício": "1.111,11",
    "Quantidade de empréstimos ativos ou suspensos": "1",
    "Data da consulta": "01/01/1900",
    "CPF do Representante Legal": "",
    "Nome do Representante Legal": "",
    "Data Fim do Representante Legal": "",
    "Elegivel para Empréstimo": "Sim",
    "Quantidade Empréstimos Ativos": "1",
    "Quantidade Empréstimos Suspensos": "0",
    "Quantidade Empréstimos Refin.": "0",
    "Quantidade Empréstimos Port.": "0",
    "Valor Líquido": "1.111,11",
    "Data Extinção Cota": "",
    "Competência Extinção Cota": "",
    "Valor Comprometido": "111,00",
    "Valor Máximo Comprometimento": "1.111,11",
    "Utiliza Margem Deduzida": "Não",
    "Pessoa Exposta Politicamente": "0 - Pessoa não exposta politicamente",
    "Valor Disponível Averbação Empréstimo": "111,11",
    "Data Bloqueio Benefício": "",
    "Tipo Bloqueio": "0 - Sem bloqueio"
}
}
```



**❌ Erro – 500 Internal Server Error**

```
{
  "error": "Erro ao rodar o bot Crefisa"
}
```

&#x20;&#x20;
