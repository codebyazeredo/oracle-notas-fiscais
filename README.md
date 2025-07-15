> Este é um microsserviço em Node.js que fornece uma API para consultar notas fiscais em um banco de dados Oracle.
> Ele permite buscar registros da tabela `NOTAS_FISCAIS` usando `codigo_nf` ou a combinação de `cnpj` e `numeroNota`. Porém os parametros podem ser facilmente alterados, assim como as colunas consultadas.
>
> **Funcionalidades:**
>
> * **Endpoint:** `GET /notas`
>
> * Consulta por `codigo_nf`:
>   `GET /notas?codigo_nf=123`
>
> * Consulta por `cnpj` e `numeroNota`:
>   `GET /notas?cnpj=12345678901234&numeroNota=456`
>
> **Como usar localmente:**
>
> 1. Configure o arquivo `.env` com as variáveis:
>
> ```
> PORT=3000
> ORACLE_USER=seu_usuario
> ORACLE_PASSWORD=sua_senha
> ORACLE_CONNECT=seu_connect_string
> ORACLE_INSTANTCLIENT_PATH=caminho_para_instantclient
> JWT_SECRET=seu_segredo_muito_secreto
> ```
>
> 2. Instale as dependências:
>
> ```
> npm install express oracledb dotenv helmet cors express-rate-limit winston jsonwebtoken express-validator
> ```
>
> 3. Configure o Oracle Instant Client e defina o caminho em `ORACLE_INSTANTCLIENT_PATH`.
>
> 4. Gere um token JWT estático:
>
> ```
> node generateStaticToken.js
> ```
>
> 5. Inicie o servidor:
>
> ```
> node gateway.js
> ```
>
> 6. Faça requisições com o token no header:
>
> ```
> curl -H "Authorization: Bearer <seu_token>" http://localhost:3000/notas?codigo_nf=123
> ```
>
> **Requisitos:**
>
> * Node.js 16.x ou superior
> * Oracle Instant Client 19c ou superior
> * Banco de dados Oracle com a tabela `NOTAS_FISCAIS`
