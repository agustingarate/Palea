import { createElement } from 'react';
import { Platform, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { primitives } from '@palea/design-tokens';

export function ReadOnlyHtml({ html }: { html: string }) {
  if (Platform.OS === 'web') {
    return createElement('div', {
      className: 'palea-description',
      dangerouslySetInnerHTML: { __html: html },
    });
  }
  return (
    <View style={{ minHeight: 96 }}>
      <WebView
        originWhitelist={['about:blank']}
        source={{
          html: `<meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:-apple-system,system-ui;color:${primitives.color.black};font-size:${primitives.typography.body.fontSize}px;line-height:${primitives.typography.body.lineHeight}px;padding:0;margin:0}h1{font-size:${primitives.typography.screenTitle.fontSize}px;line-height:${primitives.typography.screenTitle.lineHeight}px}h2{font-size:${primitives.typography.sectionTitle.fontSize}px;line-height:${primitives.typography.sectionTitle.lineHeight}px}h3{font-size:${primitives.typography.body.fontSize}px;line-height:${primitives.typography.body.lineHeight}px}p,ul,ol{margin:0 0 ${primitives.spacing.sm}px}a{color:${primitives.color.indigo}}</style>${html}`,
        }}
        scrollEnabled={false}
        style={{ backgroundColor: 'transparent', minHeight: 96 }}
      />
    </View>
  );
}
