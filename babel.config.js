module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    overrides: [
      {
        include: /node_modules\/@supabase\//,
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
          '@babel/plugin-transform-dynamic-import',
        ],
      },
    ],
  };
};
