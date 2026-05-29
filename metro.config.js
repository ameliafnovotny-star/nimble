const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Include @supabase in Babel transform so dynamic imports get compiled for Hermes
config.transformer.transformIgnorePatterns = [
  /node_modules\/(?!(@supabase\/|react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?\/|@unimodules\/))/,
];

// Stub @opentelemetry modules — pulled in optionally by @supabase, not needed in React Native
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@opentelemetry/')) {
    return { type: 'empty' };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
