import { IAnsiData } from '@mudlet3/frontend/features/ansi';
import { WithRequired } from '@mudlet3/frontend/shared';

import { processAnsiSequences } from './process-ansi-sequences';

function isAnsiDataWithText(
  ansiData: Partial<IAnsiData>[],
): ansiData is WithRequired<Partial<IAnsiData>, 'text'>[] {
  return ansiData.every((data) => data.text !== undefined);
}

export function processAnsiData(
  text: string,
): WithRequired<Partial<IAnsiData>, 'text'>[] {
  const parts = text.split('\x1b');

  if (parts.length === 1) {
    return [
      {
        text: parts[0],
      },
    ];
  }

  const results = parts
    .filter((part) => part !== '' && part !== undefined)
    .map((part) => processAnsiSequences(part))
    .filter((part) => part !== null) as Partial<IAnsiData>[];

  const reducedUntilText = results.reduce<Partial<IAnsiData>[]>((acc, part) => {
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

  // reducedUntilText should have an text property by now
  if (!isAnsiDataWithText(reducedUntilText)) {
    throw new Error('Ansi data is missing text property');
  }

  return reducedUntilText;
}
