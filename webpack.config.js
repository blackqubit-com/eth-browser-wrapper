const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development', // or 'production' or 'none'
  entry: './src/main.js',
  devtool: 'source-map',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
      // Add other fallbacks as needed
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
      // Add other polyfills if needed
    }),
  ],
  module: {
    rules: [
      // Your existing loaders (e.g., Babel) go here
    ],
  },
};
