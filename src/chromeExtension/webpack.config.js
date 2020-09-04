const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: '' },
      ],
    }),
  ],
};
