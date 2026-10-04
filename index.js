#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';

const program = new Command();

// Безпечна функція читання та валідації JSON-файлу з обробкою помилок українською
function readData(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('Помилка: Файл за шляхом "' + filePath + '" не знайдено.');
      process.exit(1);
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Помилка під час читання або парсингу JSON: ' + error.message);
    process.exit(1);
  }
}

// Загальні параметри CLI-програми
program
  .name('transport-cli')
  .description('CLI-програма для управління маршрутами громадського транспорту')
  .version('1.0.0')
  .option('-f, --file ', 'шлях до JSON-файлу з даними', 'data.json');


// ==========================================
// ЧАСТИНА 3: Загальні можливості
// ==========================================

// 1. Перелік маршрутів з можливістю обмеження кількості
program
  .command('list')
  .description('Показати стислий список транспортних маршрутів')
  .argument('[limit]', 'обмежити кількість виведених маршрутів')
  .action((limitArg) => {
    const opts = program.opts();
    const data = readData(opts.file);
    const routes = data.routes || [];

    const limit = limitArg ? parseInt(limitArg, 10) : routes.length;

    console.log('Місто: ' + data.cityName);
    console.log('Список маршрутів (показано ' + Math.min(limit, routes.length) + ' з ' + routes.length + '):');
    
    routes.slice(0, limit).forEach((route, index) => {
      console.log((index + 1) + '. Маршрут №' + route.routeNumber + ' (' + route.transportType + ') — зупинок: ' + route.stops.length);
    });
  });
// 2. Один елемент (повна інформація про маршрут за номером)
program
  .command('item')
  .description('Показати повну інформацію про конкретний маршрут')
  .argument('', 'номер маршруту (наприклад, 3A)')
  .action((routeNumber) => {
    const opts = program.opts();
    const data = readData(opts.file);
    const routes = data.routes || [];

    const found = routes.find(r => String(r.routeNumber).toLowerCase() === routeNumber.toLowerCase());

    if (!found) {
      console.error('Помилка: Маршрут №"' + routeNumber + '" не знайдено.');
      process.exit(2);
    }

    console.log('Детальна інформація про маршрут:', JSON.stringify(found, null, 2));
  });

// 3. Окреме поле (доступ до вкладених об'єктів, наприклад intervals.weekdaysMinutes)
program
  .command('field')
  .description('Показати значення окремого вкладеного поля маршруту')
  .argument('', 'номер маршруту')
  .argument('', 'шлях до поля (наприклад, intervals.weekdaysMinutes або remarks)')
  .action((routeNumber, path) => {
    const opts = program.opts();
    const data = readData(opts.file);
    const routes = data.routes || [];

    const route = routes.find(r => String(r.routeNumber).toLowerCase() === routeNumber.toLowerCase());
    if (!route) {
      console.error('Помилка: Маршрут №"' + routeNumber + '" не знайдено.');
      process.exit(2);
    }

    const keys = path.split('.');
    let current = route;
    for (const key of keys) {
      if (current === null || current === undefined || current[key] === undefined) {
        console.error('Помилка: Поле "' + path + '" не існує в цьому маршруті.');
        process.exit(3);
      }
      current = current[key];
    }

    if (current === null) {
      console.log('Значення поля ' + path + ': null (примітки відсутні)');
    } else {
      console.log('Значення поля ' + path + ':', current);
    }
  });

program.parse(process.argv);