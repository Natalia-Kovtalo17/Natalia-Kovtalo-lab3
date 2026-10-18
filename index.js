#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';

const program = new Command();

// Безпечна функція читання та валідації JSON-файлу
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

program
  .command('item')
  .description('Показати повну інформацію про конкретний маршрут')
  .argument('<routeNumber>', 'номер маршруту (наприклад, 3A)')
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

program
  .command('field')
  .description('Показати значення окремого вкладеного поля маршруту')
  .argument('<routeNumber>', 'номер маршруту')
  .argument('<path>', 'шлях до поля (наприклад, intervals.weekdaysMinutes або remarks)')
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


// ==========================================
// ЧАСТИНА 4: Можливості свого варіанта (Варіант 9)
// ==========================================

// 1. Зупинки маршруту (використовує name, latitude, longitude)
program
  .command('stops')
  .description('Показати список зупинок для конкретного маршруту')
  .argument('<routeNumber>', 'номер маршруту (наприклад, 3A)')
  .action((routeNumber) => {
    const opts = program.opts();
    const data = readData(opts.file);
    const routes = data.routes || [];

    const route = routes.find(r => String(r.routeNumber).toLowerCase() === routeNumber.toLowerCase());
    if (!route) {
      console.error('Помилка: Маршрут №"' + routeNumber + '" не знайдено.');
      process.exit(2);
    }

    console.log('Зупинки для маршруту №' + route.routeNumber + ' (' + route.transportType + '):');
    route.stops.forEach((stop, index) => {
      if (typeof stop === 'string') {
        console.log((index + 1) + '. ' + stop);
      } else {
        const name = stop.name;
        const lat = stop.latitude;
        const lng = stop.longitude;
        
        const coordStr = (lat !== undefined && lng !== undefined) ? ' [Координати: ' + lat + ', ' + lng + ']' : '';
        console.log((index + 1) + '. ' + name + coordStr);
      }
    });
  });

// 2. Інтервал руху (використовує weekdaysMinutes та weekendsMinutes)
program
  .command('intervals')
  .description('Показати інтервал руху маршруту')
  .argument('<routeNumber>', 'номер маршруту (наприклад, 3A)')
  .argument('[day]', 'день тижня: weekdays або weekends')
  .action((routeNumber, dayArg) => {
    const opts = program.opts();
    const data = readData(opts.file);
    const routes = data.routes || [];

    const route = routes.find(r => String(r.routeNumber).toLowerCase() === routeNumber.toLowerCase());
    if (!route) {
      console.error('Помилка: Маршрут №"' + routeNumber + '" не знайдено.');
      process.exit(2);
    }

    const intervals = route.intervals || {};
    console.log('Інтервали руху для маршруту №' + route.routeNumber + ':');

    const day = dayArg ? dayArg.toLowerCase() : 'all';

    if (day === 'weekdays' || day === 'all') {
      console.log('- Будні дні: ' + (intervals.weekdaysMinutes !== undefined ? intervals.weekdaysMinutes + ' хв' : 'не вказано'));
    }
    if (day === 'weekends' || day === 'weekend' || day === 'all') {
      console.log('- Вихідні дні: ' + (intervals.weekendsMinutes !== undefined ? intervals.weekendsMinutes + ' хв' : 'не вказано'));
    }
  });

// 3. Маршрути з низькою підлогою
program
  .command('low-floor')
  .description('Показати маршрути, які мають низькопідлогові машини')
  .action(() => {
    const opts = program.opts();
    const data = readData(opts.file);
    const routes = data.routes || [];

    const lowFloorRoutes = routes.filter(r => r.hasLowFloorVehicles === true);

    console.log('Маршрути з низькопідлоговими машинами у місті ' + data.cityName + ':');
    if (lowFloorRoutes.length === 0) {
      console.log('Послуга низької підлоги на жодному маршруті не заявлена.');
    } else {
      lowFloorRoutes.forEach((route, index) => {
        console.log((index + 1) + '. Маршрут №' + route.routeNumber + ' (' + route.transportType + ') — зупинок: ' + route.stops.length);
      });
    }
  });

program.parse(process.argv);
