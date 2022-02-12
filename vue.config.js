module.exports = {
  runtimeCompiler: true,
  configureWebpack: {
    devtool: 'source-map',
    resolve: {
      fallback: {
        "fs": false,
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "timers": require.resolve("timers-browserify"),
        "stream": require.resolve("stream-browserify")
      }
    }
  },

};
