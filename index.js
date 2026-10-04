import { Command } from 'commander';

const program = new Command();

program
  .name('transit')
  .description('Довідник маршрутів громадського транспорту міста')
  .version('1.0.0', '-V, --version', 'показати версію програми')
  .helpOption('-h, --help', 'показати довідку');

program.parse();