import { readFile, resolvePath, stats, getDirectorySize } from '@modus/gimbal-core/lib/utils/fs';
import { sync as brotliSize } from 'brotli-size';
import bytes from 'bytes';
import deepmerge from 'deepmerge';
import globby from 'globby';
import gzipSize from 'gzip-size';
import minimatch from 'minimatch';
import Config from '@/config';
import EventEmitter from '@/event';
import { Report } from '@/typings/command';
import { Context } from '@/typings/context';
import {
  FileResult,
  SizeConfig,
  SizeConfigs,
  AuditStartEvent,
  AuditEndEvent,
  ReportStartEvent,
  ReportEndEvent,
} from '@/typings/module/size';
import defaultConfig from './default-config';
import parseReport from './output';

type CompressionMechanisms = 'brotli' | 'gzip' | undefined;

const getBundleSize = (source: Buffer, compression: CompressionMechanisms = 'gzip'): number => {
  switch (compression) {
    case 'brotli':
      return brotliSize(source);
    case 'gzip':
      return gzipSize.sync(source);
    default:
      return Buffer.byteLength(source);
  }
};

const getFileSource = (path: string): Promise<Buffer> => readFile(path);

const getFileSize = async (path: string, compression: CompressionMechanisms): Promise<number> => {
  const source = await getFileSource(path);

  return getBundleSize(source, compression);
};

const getDirSize = async (path: string): Promise<number> => (await getDirectorySize(path)) as number;

const findMatchingThreshold = (filePath: string, configObject: SizeConfig, context: Context): SizeConfigs | void =>
  configObject.threshold.find((threshold: SizeConfigs): boolean =>
    minimatch(filePath, resolvePath(context.config.get('configs.cwd'), threshold.path)),
  );

const getResult = async (filePath: string, configObject: SizeConfig, context: Context): Promise<FileResult | void> => {
  const threshold = findMatchingThreshold(filePath, configObject, context);

  if (threshold) {
    const maxSizeBytes = bytes(threshold.maxSize);
    const pathStats = await stats(filePath);
    const isDirectory = pathStats.isDirectory();
    const size: number = isDirectory
      ? await getDirSize(filePath)
      : await getFileSize(filePath, configObject.compression);

    return {
      filePath,
      isDirectory,
      maxSizeBytes,
      maxSize: threshold.maxSize,
      sizeBytes: size,
      size: bytes(size),
      thresholdPath: resolvePath(context.config.get('configs.cwd'), threshold.path),
    };
  }

  return undefined;
};

const arrayMerge = (destinationArray: SizeConfigs[], sourceArray: SizeConfigs[], context: Context): SizeConfigs[] => {
  const cwd = context.config.get('configs.cwd');
  const newDestinationArray = destinationArray.slice();

  sourceArray.forEach((sourceItem: SizeConfigs): void => {
    const match = newDestinationArray.find((destItem: SizeConfigs): boolean => {
      const { path: destPath } = destItem;
      const { path: sourcePath } = sourceItem;

      // check if the raw strings match or the resolved full paths match
      return destPath === sourcePath || resolvePath(cwd, destPath) === resolvePath(cwd, sourcePath);
    });

    if (match) {
      // apply config onto default
      Object.assign(match, sourceItem);
    } else {
      // is a new item
      newDestinationArray.push(sourceItem);
    }
  });

  return newDestinationArray;
};

const sizeModule = async (
  context: Context,
  config: SizeConfig | SizeConfigs[] = Config.get('configs.size', []),
): Promise<Report> => {
  const cwd = context.config.get('configs.cwd');
  const configObject = deepmerge(defaultConfig(context), Array.isArray(config) ? { threshold: config } : config, {
    arrayMerge(destinationArray: SizeConfigs[], sourceArray: SizeConfigs[]): SizeConfigs[] {
      return arrayMerge(destinationArray, sourceArray, context);
    },
  });

  const auditStartEvent: AuditStartEvent = {
    config: configObject,
    context,
  };

  await EventEmitter.fire(`module/size/audit/start`, auditStartEvent);

  const pathsGlobs: string[] = configObject.threshold.map((threshold: SizeConfigs): string =>
    resolvePath(cwd, threshold.path),
  );
  const paths = await globby(pathsGlobs, { expandDirectories: false, onlyFiles: false });
  const raw: (FileResult | void)[] = await Promise.all(
    paths.map((filePath: string): Promise<FileResult | void> => getResult(filePath, configObject, context)),
  );
  const audit: FileResult[] = raw.filter(Boolean) as FileResult[];

  const auditEndEvent: AuditEndEvent = {
    audit,
    config: configObject,
    context,
  };

  await EventEmitter.fire(`module/size/audit/end`, auditEndEvent);

  const reportStartEvent: ReportStartEvent = {
    audit,
    config: configObject,
    context,
  };

  await EventEmitter.fire(`module/size/report/start`, reportStartEvent);

  const report = parseReport(audit, context);

  const reportEndEvent: ReportEndEvent = {
    audit,
    config: configObject,
    context,
    report,
  };

  await EventEmitter.fire(`module/size/report/end`, reportEndEvent);

  return report;
};

export default sizeModule;
