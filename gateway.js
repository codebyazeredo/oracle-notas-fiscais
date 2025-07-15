require('dotenv').config();

const express = require('express');
const oracledb = require('oracledb');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const jwt = require('jsonwebtoken');

const { check, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Limite de requisições excedido, tente novamente mais tarde.'
}));

app.use((req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader.split(' ')[1];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn(`Tentativa de acesso sem token: ${req.ip}`);
        return res.status(401).json({ error: 'Não autorizado.' });
    }
    
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        logger.error(`Token inválido: ${err.message}`);
        return res.status(401).json({ error: 'Token inválido.' });
    }
});

const validateQuery = [
    check('codigo_nf').optional().isNumeric().withMessage('Código da nota fiscal deve ser numérico.'),
    check('cnpj').optional().matches(/^\d{14}$/).withMessage('CNPJ deve ter 14 dígitos.'),
    check('numeroNota').optional().isNumeric().withMessage('Número da nota fiscal deve ser numérico.'),
];

let pool;
async function initializePool() {
    try {
        pool = await oracledb.createPool({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECT,
            poolMin: 2,
            poolMax: 10,
            poolTimeout: 60
        });

        logger.info('Conexão com o banco de dados Oracle estabelecida com sucesso.');
    } catch (err) {
        logger.error(`Erro ao conectar ao banco de dados Oracle: ${err.message}`);
        process.exit(1);
    }
}

app.get('/notas', validateQuery, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { codigo_nf, cnpj, numeroNota } = req.query;
    let query = '';
    let binds = {};
    let connection;

    if (codigo_nf) {
        query = 'SELECT * FROM notas_fiscais WHERE codigo_nf = :codigo_nf';
        binds = { codigo_nf };
    } else if (cnpj && numeroNota) {
        query = 'SELECT * FROM notas_fiscais WHERE cnpj = :cnpj AND numero_nota = :numeroNota';
        binds = { cnpj, numeroNota};
    } else {
        return res.status(400).json({ error: 'Parâmetros inválidos. Use o código da NF ou cnpj e número da nota fiscal.' });
    }

    try {
        logger.info(`Requisição recebida: /notas`, { query: req.query });
        
        connection = await pool.getConnection();

        const result = await connection.execute(query, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            maxRows: 100
        });

        const filteredRows = result.rows.filter(row => ({
            ID: row.ID,
            CODIGO_NF: row.CODIGO_NF,
            TIPO_NOTA: row.TIPO_NOTA,
            CDFILIAL: row.CDFILIAL,
            NRLANCTONF: row.NRLANCTONF,
            FILIAL_RECEBIMENTO: row.FILIAL_RECEBIMENTO,
            AF: row.AF,
            CNPJ: row.CNPJ,
            NOME_FORNECEDOR: row.NOME_FORNECEDOR,
            NUMERO_NOTA: row.NUMERO_NOTA,
            SERIE_NOTA: row.SERIE_NOTA,
            DATA_EMISSAO: row.DATA_EMISSAO,
            VALOR_TOTAL: row.VALOR_TOTAL,
            PARCELA: row.PARCELA,
            DATA_VENCIMENTO_ORIGINAL: row.DATA_VENCIMENTO_ORIGINAL,
            VALOR_VENCIMENTO_ORIGINAL: row.VALOR_VENCIMENTO_ORIGINAL,
            DATA_VENCIMENTO_ATUALIZADO: row.DATA_VENCIMENTO_ATUALIZADO,
            VALOR_VENCIMENTO_ATUALIZADO: row.VALOR_VENCIMENTO_ATUALIZADO,
        }));

        logger.info(`Consulta Realizada [OK]: ${filteredRows.length} registros`); 
        return res.json(filteredRows);   
    } catch (err) {
        logger.error(`Erro ao consultar notas fiscais: ${err.message}`, { query, binds });
        return res.status(500).json({ error: 'Erro ao consultar notas fiscais.' });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                logger.error(`Erro ao fechar conexão: ${err.message}`);
            }
        }
    }
});
