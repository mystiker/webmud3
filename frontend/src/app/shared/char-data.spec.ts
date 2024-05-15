import { CharacterData } from './char-data';

describe('CharacterData', () => {
  let characterData: CharacterData;

  beforeEach(() => {
    characterData = new CharacterData('TestCharacter');
  });

  test('should initialize with the correct name', () => {
    expect(characterData.nameAtMud).toBe('TestCharacter');
  });

  test('should set status correctly', () => {
    characterData.setStatus('Healthy');
    expect(characterData.cStatus).toBe('Healthy');
  });

  test('should set vitals correctly', () => {
    characterData.setVitals('Alive|Dead');
    expect(characterData.cVitals).toBe('Alive');
  });

  test('should set stats correctly', () => {
    const statsInput = 'str=59.8|int=130|con=34.2|dex=59.7';
    characterData.setStats(statsInput);

    expect(characterData.cStats.length).toBe(4);

    expect(characterData.cStats[0]).toEqual({
      key: 'str',
      name: 'Stärke',
      value: '59.8',
    });

    expect(characterData.cStats[1]).toEqual({
      key: 'int',
      name: 'Intelligenz',
      value: '130',
    });

    expect(characterData.cStats[2]).toEqual({
      key: 'con',
      name: 'Ausdauer',
      value: '34.2',
    });

    expect(characterData.cStats[3]).toEqual({
      key: 'dex',
      name: 'Geschicklichkeit',
      value: '59.7',
    });
  });

  test('should handle unknown stats gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const statsInput = 'str=59.8|int=130|con=34.2|unknown=42|dex=59.7';
    characterData.setStats(statsInput);

    expect(characterData.cStats.length).toBe(4);

    expect(characterData.cStats[0]).toEqual({
      key: 'str',
      name: 'Stärke',
      value: '59.8',
    });

    expect(characterData.cStats[1]).toEqual({
      key: 'int',
      name: 'Intelligenz',
      value: '130',
    });

    expect(characterData.cStats[2]).toEqual({
      key: 'con',
      name: 'Ausdauer',
      value: '34.2',
    });

    expect(characterData.cStats[3]).toEqual({
      key: 'dex',
      name: 'Geschicklichkeit',
      value: '59.7',
    });

    expect(consoleSpy).toHaveBeenCalledWith('Unknown Stat', ['unknown', '42']);
    consoleSpy.mockRestore();
  });
});
