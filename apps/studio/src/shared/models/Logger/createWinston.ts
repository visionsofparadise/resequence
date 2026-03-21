import { app } from "electron";
import { existsSync, mkdirSync } from "fs";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const levelColors: Record<string, string> = {
	error: "\x1b[31m",
	warn: "\x1b[33m",
	info: "\x1b[36m",
	debug: "\x1b[90m",
};
const reset = "\x1b[0m";

const stringify = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);

	return JSON.stringify(value);
};

const humanReadableFormat = winston.format.printf((info) => {
	const time = new Date().toLocaleTimeString("en-US", { hour12: false });
	const level = info.level.toUpperCase().padEnd(5);
	const color = levelColors[info.level] ?? "";

	const namespace = stringify(info.namespace) || "app";
	const message = stringify(info.message);

	const contextEntries = Object.entries(info)
		.filter(([key]) => !["level", "message", "timestamp", "namespace"].includes(key))
		.map(([key, value]) => `${key}=${stringify(value)}`)
		.join(" ");

	const contextStr = contextEntries ? ` ${contextEntries}` : "";

	return `${time} ${color}${level}${reset} [${namespace}] ${message}${contextStr}`;
});

const getLogLevel = (): string => {
	if (app.isPackaged) {
		return "error";
	}

	return process.env.LOG_LEVEL ?? "info";
};

export const createWinston = (logsDir: string): winston.Logger => {
	if (!existsSync(logsDir)) {
		mkdirSync(logsDir, { recursive: true });
	}

	const level = getLogLevel();

	return winston.createLogger({
		level,
		format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
		transports: [
			new winston.transports.Console({
				format: humanReadableFormat,
			}),
			new DailyRotateFile({
				dirname: logsDir,
				filename: "dev-%DATE%.log",
				datePattern: "YYYY-MM-DD",
				maxSize: "10m",
				maxFiles: 3,
				format: humanReadableFormat,
			}),
			new DailyRotateFile({
				dirname: logsDir,
				filename: "main-%DATE%.log",
				datePattern: "YYYY-MM-DD",
				maxSize: "10m",
				maxFiles: 3,
				format: winston.format.printf((info) => JSON.stringify(info)),
			}),
		],
	});
};
