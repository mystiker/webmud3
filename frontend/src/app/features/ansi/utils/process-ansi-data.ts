import { IAnsiData } from '@mudlet3/frontend/features/ansi';
import { processAnsiSequences } from './process-ansi-sequences';

export function processAnsiData(text: string): Partial<IAnsiData>[] {
  const parts = text.split('\x1b');

  const results = parts
    .filter((part) => part !== '' && part !== undefined)
    .map((part) => processAnsiSequences(part))
    .filter((part) => part !== null) as Partial<IAnsiData>[];

  const test = results.reduce<Partial<IAnsiData>[]>((acc, part) => {
    const lastText = acc[acc.length - 1]?.text;

    if (lastText === undefined) {
      const last = acc.pop();

      const updated = {
        ...last,
        ...part,
      };

      acc.push(updated);
    } else {
      acc.push(part);
    }

    return acc;
  }, []);

  return test;
}
