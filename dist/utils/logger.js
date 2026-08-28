import winston from "winston";
import env from "../services/env.js";
const isDevelopment = env.development;
const transports = [];
transports.push(new winston.transports.Console({
    level: isDevelopment ? "debug" : "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), isDevelopment ? winston.format.simple() : winston.format.json()),
}));
const logger = winston.createLogger({
    level: isDevelopment ? "debug" : "info",
    format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
    transports,
});
export default logger;
