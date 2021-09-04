module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: false
    },
    output: {
      filename: "bundle.js"
    }
  },
  css: {
    extract: false
  }
};
