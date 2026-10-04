#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';

const program = new Command();

// Функція безпечного читання JSON-файлу з обробкою помилок українською
function readData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Помилка: Файл за шляхом "${filePath}" не знайдено.`);
      process.exit(1);
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Помилка під час читання або парсингу JSON: ${error.message}`);
    process.exit(1);
  }
}

// Загальні налаштування програми
program
  .name('transport-cli')
  .description('CLI-програма для управління маршрутами громадського транспорту')
  .version('1.0.0')
  .option('-f, --file ', 'шлях до JSON-файлу з даними', 'data.json');

program.parse(process.argv);