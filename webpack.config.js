const path = require('path');

module.exports = {
  mode: 'development', // or 'production' or 'none'
  entry: './src/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
