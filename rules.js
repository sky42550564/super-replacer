module.exports = [
  {
    label: 'hello',
    key: 'alt+x',
    useCursorWord: true,
    callback: ({ v }) => ' hello' + v,
  },
  {
    label: 'hello1',
    key: 'alt+y',
    callback: `${v} hello`,
  },
];
