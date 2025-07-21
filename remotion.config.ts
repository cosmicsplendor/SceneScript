import {Config} from '@remotion/cli/config';
import {enableTailwind} from '@remotion/tailwind';
 
// Set the port for the Webpack Dev Server.
// 3001 is the default, but explicitly setting it makes it consistent.
 
// Your existing Webpack override for Tailwind CSS
Config.overrideWebpackConfig((currentConfiguration) => {
  return enableTailwind(currentConfiguration);
});