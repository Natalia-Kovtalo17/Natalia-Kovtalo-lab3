import { Command } from 'commander';
import { readFileSync } from 'node:fs';

const DEFAULT_FILE = './data.json';

// Вихід з помилкою: повідомлення без стеку + код 1
function fail(message) {
  console.error(`Помилка: ${message}`);
  process.exit(1);
}

// Читає і розбирає JSON; шлях бере з глобальної опції --file
function loadData(command) {
  const { file } = command.optsWithGlobals();
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') fail(`файл «${file}» не знайдено.`);
    fail(`не вдалося прочитати «${file}» (${e.code}).`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    fail(`файл «${file}» містить некоректний JSON: ${e.message}`);
  }
  if (!data || !Array.isArray(data.routes)) {
    fail(`у файлі «${file}» немає масиву routes.`);
  }
  return data;
}

const program = new Command();

program
  .name('transit')
  .description('Довідник маршрутів громадського транспорту міста')
  .version('1.0.0', '-V, --version', 'показати версію програми')
  .helpOption('-h, --help', 'показати довідку')
  .option('-f, --file <path>', 'шлях до JSON-файлу з даними', DEFAULT_FILE);

program
  .command('list')
  .description('показати стислий список маршрутів')
  .action((options, command) => {
    const { routes } = loadData(command);
    for (const r of routes) {
      const first = r.stops?.[0]?.name ?? '?';
      const last = r.stops?.at(-1)?.name ?? '?';
      console.log(`${r.routeNumber}\t${r.transportType}\t${first} → ${last}`);
    }
  });

program.parse();