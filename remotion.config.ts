import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind';
 
// Set the port for the Webpack Dev Server.
// 3001 is the default, but explicitly setting it makes it consistent.
// Your existing Webpack override for Tailwind CSS
Config.overrideWebpackConfig((currentConfiguration) => {
 // Ensure the module property exists.
  if (!currentConfiguration.module) {
    currentConfiguration.module = { rules: [] };
  }

  // Ensure the rules array exists.
  if (!currentConfiguration.module.rules) {
    currentConfiguration.module.rules = [];
  }

  // Now it's safe to push the new rule.
  currentConfiguration.module.rules.push({
    test: /\.ya?ml$/,
    use: 'yaml-loader',
  });

  // Pass the modified configuration to the Tailwind utility.
  return enableTailwind(currentConfiguration);
});