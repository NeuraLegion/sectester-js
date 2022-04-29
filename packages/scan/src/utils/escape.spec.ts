import { escape } from './escape';

describe('escape', () => {
  it.each([
    {
      input: 'content-type: application/json+patch; charset=utf-8',
      expected: 'content-type: application/json\\+patch; charset=utf-8'
    },
    {
      input: 'column1|column2',
      expected: 'column1\\|column2'
    },
    {
      input: 'file (1).har',
      expected: 'file \\(1\\)\\.har'
    }
  ])('should escape the chars in $input', ({ input, expected }) => {
    // act
    const result = escape(input);

    // assert
    expect(result).toEqual(expected);
  });

  it.each([
    {
      input: 'content-type: application/json-patch; charset=utf-8',
      expected: 'content-type: application/json-patch; charset=utf-8'
    },
    {
      input: 'column1,column2',
      expected: 'column1,column2'
    },
    {
      input: 'file',
      expected: 'file'
    }
  ])(
    'should do nothing if $input does not contain any characters to be escaped',
    ({ input, expected }) => {
      // act
      const result = escape(input);

      // assert
      expect(result).toEqual(expected);
    }
  );

  it.each([
    {
      input: 'content-type: application/json-patch; charset=utf-8',
      chars: 't',
      expected:
        'con\\ten\\t-\\type: applica\\tion/json-pa\\tch; charse\\t=u\\tf-8'
    },
    {
      input: 'column1,column2',
      chars: '2',
      expected: 'column1,column\\2'
    },
    {
      input: 'file',
      chars: '',
      expected: 'file'
    },
    {
      input: 'file',
      chars: '2',
      expected: 'file'
    }
  ])(
    'should return $expected for $input if chars to be escaped is $chars',
    ({ input, chars, expected }) => {
      // act
      const result = escape(input, chars);

      // assert
      expect(result).toEqual(expected);
    }
  );
});
