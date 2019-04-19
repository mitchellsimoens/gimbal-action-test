import Table, { HorizontalTable } from 'cli-table3';
import { CommandReturn } from '@/typings/command';
import { CliOutputOptions } from '@/typings/output/cli';
import { CommandOptions } from '@/typings/utils/command';
import log from '@/utils/logger';

const keysToCareAbout = [
  'Documents',
  'Frames',
  'JSHeapTotalSize',
  'JSHeapUsedSize',
  'LayoutCount',
  'Nodes',
  'RecalcStyleCount',
];

const cliOutput = (report: CommandReturn, commandOptions: CommandOptions, options?: CliOutputOptions): void => {
  const table =
    options && options.table ? options.table : (new Table({ head: ['Category', 'Value'] }) as HorizontalTable);

  const keys = commandOptions.verbose ? Object.keys(report.data).sort() : keysToCareAbout;

  keys.forEach(
    (key: string): void => {
      // @ts-ignore
      table.push([key, { content: report.data[key], hAlign: 'right' }]);
    },
  );

  if (!options || !options.table) {
    // if a table wasn't passed in, output table
    // otherwise let whatever passed the table in
    // manage outputting the table
    log(table.toString());
  }
};

export default cliOutput;