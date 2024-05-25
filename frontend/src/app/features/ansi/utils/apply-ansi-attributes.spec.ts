import { applyAnsiAttributes } from './apply-ansi-attributes';

describe('applyAnsiAttributes', () => {
  it('should apply bold attribute for code 1', () => {
    const formattedData = applyAnsiAttributes(['1']);
    expect(formattedData.bold).toBe(true);
  });

  it('should apply faint attribute for code 2', () => {
    const formattedData = applyAnsiAttributes(['2']);
    expect(formattedData.faint).toBe(true);
  });

  it('should apply italic attribute for code 3', () => {
    const formattedData = applyAnsiAttributes(['3']);
    expect(formattedData.italic).toBe(true);
  });

  it('should apply underline attribute for code 4', () => {
    const formattedData = applyAnsiAttributes(['4']);
    expect(formattedData.underline).toBe(true);
  });

  it('should apply blink attribute for codes 5 and 6', () => {
    let formattedData = applyAnsiAttributes(['5']);
    expect(formattedData.blink).toBe(true);

    formattedData = applyAnsiAttributes(['6']);
    expect(formattedData.blink).toBe(true);
  });

  it('should apply reverse attribute for code 7', () => {
    const formattedData = applyAnsiAttributes(['7']);
    expect(formattedData.reverse).toBe(true);
  });

  it('should apply concealed attribute for code 8', () => {
    const formattedData = applyAnsiAttributes(['8']);
    expect(formattedData.concealed).toBe(true);
  });

  it('should apply crossedout attribute for code 9', () => {
    const formattedData = applyAnsiAttributes(['9']);
    expect(formattedData.crossedout).toBe(true);
  });

  it('should reset attributes for code 0', () => {
    const formattedData = applyAnsiAttributes(['1', '0']);
    expect(formattedData).toEqual({
      bold: false,
      faint: false,
      italic: false,
      underline: false,
      blink: false,
      reverse: false,
      concealed: false,
      crossedout: false,
      fgcolor: '#ffffff',
      bgcolor: '#000000',
    });
  });

  it('should apply 256-color foreground for code 38', () => {
    const formattedData = applyAnsiAttributes(['38', '5', '10']);
    expect(formattedData.fgcolor).toBe('#00ff00');
  });

  it('should apply 256-color background for code 48', () => {
    const formattedData = applyAnsiAttributes(['48', '5', '10']);
    expect(formattedData.bgcolor).toBe('#00ff00');
  });

  it('should apply RGB foreground for code 38 with RGB values', () => {
    const formattedData = applyAnsiAttributes(['38', '2', '255', '0', '0']);
    expect(formattedData.fgcolor).toBe('#ff0000');
  });

  it('should apply RGB background for code 48 with RGB values', () => {
    const formattedData = applyAnsiAttributes(['48', '2', '0', '255', '0']);
    expect(formattedData.bgcolor).toBe('#00ff00');
  });

  it('should log error for unknown codes', () => {
    console.error = jest.fn();
    applyAnsiAttributes(['999']);
    expect(console.error).toHaveBeenCalledWith(
      'applyAnsiAttributes unknown attribute/color-ESC:',
      'ESC[999',
    );
  });
});
