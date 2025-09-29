import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind';
 import path from 'path';

// Set the port for the Webpack Dev Server.
// 3001 is the default, but explicitly setting it makes it consistent.
// Your existing Webpack override for Tailwind CSS
Config.overrideWebpackConfig((currentConfiguration) => {
  // Ensure the module property and its rules array exist.
  if (!currentConfiguration.module) {
    currentConfiguration.module = { rules: [] };
  }
  if (!currentConfiguration.module.rules) {
    currentConfiguration.module.rules = [];
  }

  // Add the rule to process .yaml files.
  // This loader will parse YAML into a JavaScript object.
  currentConfiguration.module.rules.push({
    test: /\.ya?ml$/,
    use: 'yaml-loader',
  });

  // Pass the modified configuration to the Tailwind utility
  return enableTailwind(currentConfiguration);
});