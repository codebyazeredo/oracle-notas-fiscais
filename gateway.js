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



